import { connectToMongo, getDb } from "../config/db.js";

class MgidPerformanceByBrowserRepo {
  static async getMgidClicksByBrowser(campaignId) {
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

    // Check if campaign exists and contains performanceByBrowser data
    if (!campaign || !campaign.performanceByBrowser) {
      console.error("Campaign data or performanceByBrowser not found");
      throw new Error("Campaign data or performanceByBrowser not found");
    }

    // Extract performance by browser for the given date (assumes one date)
    const dateKey = Object.keys(campaign.performanceByBrowser)[0]; // Assumes a date key is present
    const browserResults = campaign.performanceByBrowser[dateKey];
    console.log("Browser Performance Results:", browserResults);

    if (!browserResults || browserResults.length === 0) {
      console.error("No browser performance data found");
      throw new Error("No browser performance data found");
    }

    // Map the results to extract browser names and clicks
    const clicksByBrowser = browserResults.map((browser) => ({
      browser: browser.Browser || "Unknown", // Use 'Unknown' if browser field is missing
      clicks: parseInt(browser.Clicks || 0, 10), // Ensure clicks are parsed as integers
    }));

    // Log for debugging
    console.log("Clicks by Browser:", clicksByBrowser);

    // Return the mapped results
    return clicksByBrowser;
  }
}

export default MgidPerformanceByBrowserRepo;
