import cron from "node-cron";
import { handleTaboolaCampaign } from "../controllers/campaign.controller.js";
import { getDb } from "../config/db.js";
// AWS and MongoDB configuration
const CAMPAIGNS_COLLECTION = "campaigns";
const CAMPAIGN_PERFORMANCES_COLLECTION = "campaignperformances";
const AGGREGATED_COLLECTION = "aggregatedTableFromAllPlatforms";

// Process active campaigns
const updateTaboolaCampaigns = async () => {
  try {
    console.log(
      "Starting Taboola campaign update process at",
      new Date().toISOString()
    );

    // Connect to MongoDB
    const db = await getDb();

    const campaignsCollection = db.collection(CAMPAIGNS_COLLECTION);
    const campaignPerformancesCollection = db.collection(
      CAMPAIGN_PERFORMANCES_COLLECTION
    );
    const aggregatedCollection = db.collection(AGGREGATED_COLLECTION);

    // Get current date
    const currentDate = new Date();

    // Find active Taboola campaigns (endDate > currentDate)
    const activeCampaigns = await campaignsCollection
      .find({
        platform: "taboola",
        endDate: { $gt: currentDate },
      })
      .toArray();

    console.log(
      `Found ${activeCampaigns.length} active Taboola campaigns to process`
    );

    // Process campaigns sequentially (not in parallel)
    for (const campaign of activeCampaigns) {
      try {
        console.log(`Processing campaign: ${campaign.campaignId}`);

        // Prepare campaign data for SQS
        const campaignData = {
          clientName: campaign.clientName || "Unknown",
          clientEmail: campaign.clientEmail || "no-email@example.com",
          platform: "taboola",
          roNumber: campaign.roNumber || "",
          campaignId: campaign.campaignId,
          startDate: campaign.startDate,
          endDate: campaign.endDate,
        };

        // Get updated data from handleTaboolaCampaign
        const updatedData = await handleTaboolaCampaign(campaignData);

        // Update campaignperformances collection
        await campaignPerformancesCollection.updateOne(
          { campaignId: campaign.campaignId },
          { $set: updatedData },
          { upsert: true }
        );
        console.log(
          `Updated campaignperformances for campaignId: ${campaign.campaignId}`
        );

        // Update aggregatedTableFromAllPlatforms
        const aggUpdateResult = await aggregatedCollection.updateOne(
          {
            email: campaign.clientEmail,
            "releaseOrders.roNumber": campaign.roNumber,
            "releaseOrders.platforms.taboola.campaignResults.campaignId":
              campaign.campaignId,
          },
          {
            $set: {
              "releaseOrders.$[ro].platforms.taboola.campaignResults.$[cr]":
                updatedData,
            },
          },
          {
            arrayFilters: [
              { "ro.roNumber": campaign.roNumber },
              { "cr.campaignId": campaign.campaignId },
            ],
          }
        );
        console.log(
          `Updated aggregatedTableFromAllPlatforms for campaignId: ${campaign.campaignId}, matched: ${aggUpdateResult.matchedCount}, modified: ${aggUpdateResult.modifiedCount}`
        );

        // Add a delay between campaigns to avoid overwhelming SQS
        console.log("Waiting 2 second before processing next campaign...");
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(
          `Error processing campaign ${campaign.campaignId}:`,
          error
        );
      }
    }

    console.log("All campaigns processed successfully!");
  } catch (error) {
    console.error("Error in processTaboolaCampaigns:", error);
  }
};

// Schedule to run after 12 hours daily
cron.schedule("30 8,20 * * *", async () => {
  console.log("Running scheduled Taboola campaign update job...");
  try {
    await updateTaboolaCampaigns();
    console.log(
      "Scheduled job completed successfully at",
      new Date().toISOString()
    );
  } catch (error) {
    console.error("Error in scheduled job:", error);
  }
});

console.log(
  "Taboola campaign update cron job scheduled to run at 1:00 AM daily"
);

export { updateTaboolaCampaigns };
