import cron from "node-cron";
import moment from "moment";
import { getDb } from "../config/db.js";
import { processDspOutbrainCampaign } from "../services/dspoutbrainService.js";

// Date formatting utility (copied from campaign.controller.js)
const formatDateForOutbrain = (dateString) => {
  let formattedDate;
  if (dateString.includes("/")) {
    const parts = dateString.split("/");
    if (parts.length === 3) {
      const month = parts[0].padStart(2, "0");
      const day = parts[1].padStart(2, "0");
      const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
      formattedDate = `${year}-${month}-${day}`;
    }
  } else if (dateString.includes("-")) {
    const parts = dateString.split("-");
    if (parts[0].length === 4) {
      formattedDate = dateString;
    } else if (parts.length === 3) {
      const month = parts[0].padStart(2, "0");
      const day = parts[1].padStart(2, "0");
      const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
      formattedDate = `${year}-${month}-${day}`;
    }
  }
  if (!formattedDate) {
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        formattedDate = `${year}-${month}-${day}`;
      } else {
        throw new Error("Invalid date format");
      }
    } catch (error) {
      console.error(`Error formatting date: ${dateString}`, error);
      throw new Error(
        `Invalid date format: ${dateString}. Required format is YYYY-MM-DD`
      );
    }
  }
  return formattedDate;
};

const updateAggregatedTable = async (db, campaign, campaignResults) => {
  try {
    // Prepare the data for the nested structure (see schema image 3)
    const aggUpdateResult = await db
      .collection("aggregatedTableFromAllPlatforms")
      .updateOne(
        {
          email: campaign.clientEmail,
          "releaseOrders.roNumber": campaign.roNumber,
          "releaseOrders.platforms.dspOutbrain.campaignResults.campaignId":
            campaign.campaignId,
        },
        {
          $set: {
            "releaseOrders.$[ro].platforms.dspOutbrain.campaignResults.$[cr]":
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

const updateDspOutbrainCampaigns = async () => {
  let db;
  try {
    console.log("Starting DSP Outbrain campaigns update job...");
    db = await getDb();
    const campaignsCollection = db.collection("campaigns");
    const dspOutbrainDataCollection = db.collection("dspOutbrainData");
    const currentDate = moment().format("YYYY-MM-DD");
    // Find active DSP Outbrain campaigns
    const activeCampaigns = await campaignsCollection
      .find({
        platform: "dspoutbrain",
        endDate: { $gt: currentDate },
      })
      .toArray();
    console.log(
      `Found ${activeCampaigns.length} active DSP Outbrain campaigns to process`
    );
    for (const campaign of activeCampaigns) {
      try {
        const formattedStartDate = formatDateForOutbrain(campaign.startDate);
        const formattedEndDate = formatDateForOutbrain(campaign.endDate);
        const campaignResults = await processDspOutbrainCampaign(
          campaign.campaignId,
          formattedStartDate,
          formattedEndDate
        );
        // Only update if the document exists
        const updateResult = await dspOutbrainDataCollection.updateOne(
          { campaignId: campaign.campaignId },
          {
            $set: {
              ...campaignResults,
              lastUpdated: new Date(),
            },
          }
        );
        if (updateResult.matchedCount === 0) {
          console.log(
            `No existing document found in dspOutbrainData for campaignId: ${campaign.campaignId}, skipping update.`
          );
        } else {
          console.log(
            `Updated dspOutbrainData for campaignId: ${campaign.campaignId}, modified: ${updateResult.modifiedCount}`
          );
        }
        // Update aggregated table
        await updateAggregatedTable(db, campaign, campaignResults);
        // Add delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 5000));
      } catch (error) {
        console.error(`Error updating campaign ${campaign.campaignId}:`, error);
      }
    }
    console.log("DSP Outbrain campaigns update job completed successfully");
  } catch (error) {
    console.error("Error in DSP Outbrain campaigns update job:", error);
  }
};

// // Schedule to run after 12 hours daily
cron.schedule("0 8,20 * * *", updateDspOutbrainCampaigns);

export { updateDspOutbrainCampaigns };
