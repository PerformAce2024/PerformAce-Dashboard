import { connectToMongo, getDb } from "../config/db.js";

class MgidDailyDataRepo {
  // Function to fetch daily clicks and impressions for a specific MGID campaign
  static async getMgidCampaignDailyData(campaignId) {
    console.log("Connecting to MongoDB...");
    const client = await getDb();
    if (!client) {
      console.error("Failed to connect to MongoDB");
      throw new Error("Failed to connect to MongoDB");
    }

    const mgidCollection = client.collection("mgid_transformed_data");

    console.log(
      `Fetching daily performance data for MGID campaignId: ${campaignId}`
    );

    // Retrieve campaign data by ID
    const campaign = await mgidCollection.findOne({ campaignId });
    console.log("MGID Campaign Data:", campaign);

    if (!campaign || !campaign.campaignPerformanceResult) {
      console.error(
        `Campaign data not found or malformed for campaignId: ${campaignId}`
      );
      throw new Error("Campaign data not found or malformed");
    }

    // Extract the array of daily results
    const results = campaign.campaignPerformanceResult.results;

    if (!results || results.length === 0) {
      console.error("No performance results found for campaignId:", campaignId);
      throw new Error("No performance results found");
    }

    // Map results to daily clicks and impressions
    console.log("Mapping daily clicks and impressions...");
    let dailyData = results.map((result) => ({
      date: result[" Date"]?.trim(), // Adjust for actual date field name in your data
      clicks: parseInt(result.Clicks || 0, 10), // Daily clicks
      impressions: parseInt(
        result[
          "                         Imps                          "
        ]?.trim() || 0,
        10
      ), // Daily impressions
    }));

    // Filter out entries where the date is empty or clicks are 0
    dailyData = dailyData.filter(
      (entry) => entry.date && entry.clicks > 0 && entry.impressions
    );

    console.log("Daily Clicks and Impressions Data:", dailyData);

    // Return daily data
    return {
      campaignId: campaignId, // Return campaignId for reference
      dailyData: dailyData, // Array of daily clicks and impressions
    };
  }
}

export default MgidDailyDataRepo;
