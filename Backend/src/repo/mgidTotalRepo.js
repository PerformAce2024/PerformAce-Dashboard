import { connectToMongo, getDb } from "../config/db.js";

class MgidTotalRepo {
  static async getMgidCampaignPerformanceTotals(campaignId) {
    console.log("Connecting to MongoDB...");
    const client = await getDb();
    if (!client) {
      console.error("Failed to connect to MongoDB");
      throw new Error("Failed to connect to MongoDB");
    }

    const mgidCollection = client.collection("mgid_transformed_data");

    console.log(`Fetching MGID campaign data for campaignId: ${campaignId}`);
    // Find the specific campaign by ID
    const campaign = await mgidCollection.findOne({ campaignId });
    console.log("MGID Campaign Data:", campaign);

    if (
      !campaign ||
      !campaign.campaignPerformanceResult ||
      !campaign.campaignPerformanceResult.results
    ) {
      console.error(
        `MGID campaign data not found or malformed for campaignId: ${campaignId}`
      );
      throw new Error("MGID campaign data not found or malformed");
    }

    // Log campaign performance results
    const results = campaign.campaignPerformanceResult.results;
    console.log("MGID Campaign Performance Results:", results);

    if (!results || results.length === 0) {
      console.error("No performance results found for campaignId:", campaignId);
      throw new Error("No performance results found");
    }

    // Aggregating totals for clicks, impressions, and spent
    console.log("Aggregating totals for clicks, impressions, and spent...");
    const totals = results.reduce(
      (acc, result) => {
        acc.clicks += parseInt(result.Clicks || 0, 10);
        acc.impressions += parseInt(
          result[
            "                         Imps                          "
          ]?.trim() || 0,
          10
        );
        acc.spent += parseFloat(result["Spent, INR"]?.replace(",", "") || 0);
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
    let clicksData = results.map((result) => ({
      date: result[" Date"]?.trim(), // Adjust if necessary for correct date field
      clicks: parseInt(result.Clicks || 0, 10),
    }));

    // Filter out entries where the date is empty or clicks are 0
    clicksData = clicksData.filter((entry) => entry.date && entry.clicks > 0);

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

export default MgidTotalRepo;
