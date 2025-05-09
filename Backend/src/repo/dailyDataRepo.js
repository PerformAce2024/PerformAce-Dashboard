import { getDb } from "../config/db.js";

class CampaignDailyDataRepo {
  // Function to fetch daily clicks and impressions for a specific campaign

  static async getAdminCampaignDailyMetrics(campaignId) {
    try {
      console.log(campaignId);

      if (!campaignId) {
        throw new Error("Campaign ID is required");
      }

      const db = await getDb();

      // Find the campaign performance data for this campaign ID
      const campaignPerformance = await db
        .collection("campaignperformances")
        .findOne({ campaignId: campaignId });
      console.log(campaignPerformance, "performance");

      if (!campaignPerformance) {
        throw new Error(
          "No campaign performance data found for this campaign ID"
        );
      }

      // Extract the daily metrics from the results
      const results =
        campaignPerformance.campaignPerformanceResult?.results || [];

      // Format the daily metrics for the frontend
      const dailyMetrics = results.map((result) => {
        // Extract date from the string format "2025-01-31 00:00:00.0"
        const dateParts = result.date.split(" ")[0].split("-");
        const formattedDate = `${dateParts[1]}/${dateParts[2]}/${dateParts[0]}`;

        return {
          date: formattedDate,
          clicks: result.clicks || 0,
          impressions: result.impressions || 0,
          avgCpc: result.cpc || 0,
          ctr: result.ctr * 100 || 0, // Convert to percentage
          amountSpent: result.spent || 0,
        };
      });

      return {
        success: true,
        dailyMetrics: dailyMetrics,
        campaignId: campaignId,
        campaignDetails: {
          startDate: campaignPerformance.startDate,
          endDate: campaignPerformance.endDate,
        },
      };
    } catch (error) {
      console.error("Error fetching Taboola daily metrics:", error);
      return {
        success: false,
        message: "Server error while fetching daily metrics",
        error: error.message,
      };
    }
  }
}

export default CampaignDailyDataRepo;
