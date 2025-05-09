import cron from "node-cron";
import dotenv from "dotenv";
import moment from "moment";
import { getDb } from "../config/db.js";
import { processMgidCampaign } from "../services/mgidService.js";

dotenv.config();

const CAMPAIGNS_COLLECTION = "campaigns";
const MGID_DATA_COLLECTION = "mgidData";
const AGGREGATED_COLLECTION = "aggregatedTableFromAllPlatforms";

const updateAggregatedTable = async (db, campaign, campaignResults) => {
  try {
    const aggUpdateResult = await db
      .collection(AGGREGATED_COLLECTION)
      .updateOne(
        {
          email: campaign.clientEmail,
          "releaseOrders.roNumber": campaign.roNumber,
          "releaseOrders.platforms.mgid.campaignResults.campaignId":
            campaign.campaignId,
        },
        {
          $set: {
            "releaseOrders.$[ro].platforms.mgid.campaignResults.$[cr]":
              campaignResults,
            lastUpdated: new Date(),
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
  } catch (error) {
    console.error("Error updating aggregated table:", error);
  }
};

const updateMgidCampaigns = async () => {
  try {
    console.log(
      "Starting MGID campaign update process at",
      new Date().toISOString()
    );
    const db = await getDb();
    const campaignsCollection = db.collection(CAMPAIGNS_COLLECTION);
    const mgidDataCollection = db.collection(MGID_DATA_COLLECTION);
    const aggregatedCollection = db.collection(AGGREGATED_COLLECTION);
    const currentDate = moment().format("YYYY-MM-DD");

    // Find active MGID campaigns
    const activeCampaigns = await campaignsCollection
      .find({
        platform: "mgid",
        endDate: { $gt: currentDate },
      })
      .toArray();

    console.log(
      `Found ${activeCampaigns.length} active MGID campaigns to process`
    );

    for (const campaign of activeCampaigns) {
      try {
        console.log(`Processing MGID campaign: ${campaign.campaignId}`);
        // Format dates if needed (assuming YYYY-MM-DD is fine for MGID)
        const campaignResults = await processMgidCampaign(
          campaign.campaignId,
          campaign.startDate,
          campaign.endDate
        );
        // Upsert into mgidData
        await mgidDataCollection.updateOne(
          { campaignId: campaign.campaignId },
          { $set: { ...campaignResults, lastUpdated: new Date() } },
          { upsert: true }
        );
        // Update aggregated table
        await updateAggregatedTable(db, campaign, campaignResults);
        // Add delay to avoid browser/crawler overload
        console.log(
          "Waiting 7 seconds before processing next MGID campaign..."
        );
        await new Promise((resolve) => setTimeout(resolve, 7000));
      } catch (error) {
        console.error(
          `Error processing MGID campaign ${campaign.campaignId}:`,
          error
        );
      }
    }
    console.log("All MGID campaigns processed successfully!");
  } catch (error) {
    console.error("Error in processMgidCampaigns:", error);
  }
};

// Schedule to run after 12 hours daily
cron.schedule("15 8,20 * * *", async () => {
  console.log("Running scheduled MGID campaign update job...");
  try {
    await updateMgidCampaigns();
    console.log(
      "Scheduled MGID job completed successfully at",
      new Date().toISOString()
    );
  } catch (error) {
    console.error("Error in scheduled MGID job:", error);
  }
});

console.log(
  "MGID campaign update cron job scheduled to run at 1:00 AM and 1:00 PM daily"
);

export { updateMgidCampaigns };
