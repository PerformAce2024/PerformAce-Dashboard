import { connectToMongo, getDb } from "../config/db.js";
import moment from "moment"; // Optional, for date formatting

class CampaignDailyDataRepo {
  // Function to fetch daily clicks and impressions for a specific campaign
  static async getCampaignDailyData(campaignId) {
    console.log("Connecting to MongoDB...");
    const client = await getDb();
    if (!client) {
      console.error("Failed to connect to MongoDB");
      throw new Error("Failed to connect to MongoDB");
    }

    const campaignCollection = client.collection("taboolaData");

    console.log(
      `Fetching daily performance data for campaignId: ${campaignId}`
    );

    // Retrieve campaign data by ID
    const campaign = await campaignCollection.findOne({ campaignId });
    console.log("Campaign Data:", campaign);

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
    const dailyData = results.map((result) => ({
      date: result.date, // Date of the data point
      clicks: result.clicks || 0, // Daily clicks
      impressions: result.impressions || 0, // Daily impressions
    }));
    console.log("Daily Clicks and Impressions Data:", dailyData);

    // Return daily data
    return {
      campaignId: campaignId, // Return campaignId for reference
      dailyData: dailyData, // Array of daily clicks and impressions
    };
  }

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

  static async getClientCampaignDailyMetrics(campaignId, clientName) {
    console.log("Connecting to MongoDB...");
    const client = await getDb();
    if (!client) {
      console.error("Failed to connect to MongoDB");
      throw new Error("Failed to connect to MongoDB");
    }

    const campaignCollection = client.collection("taboolaData");
    const releaseOrdersCollection = client.collection("releaseOrders");

    console.log(`Fetching daily metrics for campaignId: ${campaignId}`);

    // Retrieve campaign data by ID
    const campaign = await campaignCollection.findOne({ campaignId });
    console.log("Campaign Data:", campaign);

    if (!campaign || !campaign.campaignPerformanceResult) {
      console.error(
        `Campaign data not found or malformed for campaignId: ${campaignId}`
      );
      throw new Error("Campaign data not found or malformed");
    }

    // Retrieve client-specific data from `releaseOrders`
    console.log(`Fetching client data for clientName: ${clientName}`);
    const clientData = await releaseOrdersCollection.findOne({
      client: clientName,
    });
    console.log("Client Data:", clientData);

    if (!clientData) {
      console.error(`Client data not found for clientName: ${clientName}`);
      throw new Error("Client data not found");
    }

    // Extract the array of daily results from the campaign data
    const results = campaign.campaignPerformanceResult.results;

    if (!results || results.length === 0) {
      console.error("No performance results found for campaignId:", campaignId);
      throw new Error("No performance results found");
    }

    // Get the CPC from the client data
    const clientCPC = parseFloat(clientData.cpc); // Ensure clientCPC is a number

    // Map results to include date, amount spent, impressions, clicks, avg CPC, and CTR
    console.log("Mapping daily metrics...");
    const dailyMetrics = results.map((result) => {
      let date = new Date(result.date);
      date = date.toISOString().split("T")[0]; // Format the date to 'YYYY-MM-DD'

      const clicks = result.clicks || 0;
      const impressions = result.impressions || 0;
      const amountSpent = clicks > 0 ? clicks * clientCPC : 0;
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

      return {
        date,
        clicks,
        impressions,
        amountSpent,
        ctr,
      };
    });
    console.log("Daily Metrics:", dailyMetrics);

    // Return daily metrics
    return {
      campaignId: campaignId, // Return campaignId for reference
      dailyMetrics: dailyMetrics, // Array of daily metrics data
      clientCPC: clientCPC, // Client-specific CPC
    };
  }
}

export default CampaignDailyDataRepo;
