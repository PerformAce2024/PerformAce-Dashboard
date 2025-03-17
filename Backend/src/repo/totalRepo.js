import { connectToMongo, getDb } from "../config/db.js";

class CampaignTotalRepo {
  static async getCampaignPerformanceTotals(campaignId) {
    console.log("Connecting to MongoDB...");
    const client = await getDb();
    if (!client) {
      console.error("Failed to connect to MongoDB");
      throw new Error("Failed to connect to MongoDB");
    }

    const campaignCollection = client.collection("taboolaData");

    console.log(`Fetching campaign data for campaignId: ${campaignId}`);
    // Find the specific campaign by ID
    const campaign = await campaignCollection.findOne({ campaignId });
    console.log("Campaign Data:", campaign);

    if (
      !campaign ||
      !campaign.campaignPerformanceResult ||
      !campaign.campaignPerformanceResult.results
    ) {
      console.error(
        `Campaign data not found or malformed for campaignId: ${campaignId}`
      );
      throw new Error("Campaign data not found or malformed");
    }

    // Log campaign performance results
    const results = campaign.campaignPerformanceResult.results;
    console.log("Campaign Performance Results:", results);

    if (!results || results.length === 0) {
      console.error("No performance results found for campaignId:", campaignId);
      throw new Error("No performance results found");
    }

    // Aggregating totals for clicks, impressions, spent, ctr, and cpm
    console.log("Aggregating totals for clicks, impressions, and spent...");
    const totals = results.reduce(
      (acc, result) => {
        acc.clicks += result.clicks || 0;
        acc.impressions += result.impressions || 0;
        acc.spent += result.spent || 0;
        return acc;
      },
      {
        clicks: 0,
        impressions: 0,
        spent: 0,
        ctr: 0,
      }
    );

    // Calculate CTR
    totals.ctr = totals.clicks / (totals.impressions || 1);
    console.log(
      `Total Clicks: ${totals.clicks}, Total Impressions: ${totals.impressions}, Total Spent: ${totals.spent}, CTR: ${totals.ctr}`
    );

    // Extracting clicks per date for the line chart
    console.log("Extracting clicks per date for the chart...");
    const clicksData = results.map((result) => ({
      date: result.date, // Each result has a date
      clicks: result.clicks || 0, // Number of clicks for that date
    }));
    console.log("Clicks Data:", clicksData);

    // Return aggregated totals and clicks data
    return {
      totalClicks: totals.clicks,
      totalImpressions: totals.impressions,
      totalSpent: totals.spent,
      averageCTR: totals.ctr.toFixed(2),
      clicksData: clicksData, // Include clicks data for charting
    };
  }
}

export default CampaignTotalRepo;
