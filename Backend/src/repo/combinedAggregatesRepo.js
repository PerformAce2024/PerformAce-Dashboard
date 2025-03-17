import { connectToMongo, getDb } from "../config/db.js";
import CampaignAggregatesRepo from "./aggregatesRepo.js";
import MgidAggregatesRepo from "./mgidAggregatesRepo.js";

class CombinedAggregatesRepo {
  static async getCombinedCampaignRegionAggregates(taboolaCampaignId) {
    console.log("Connecting to MongoDB for campaign mapping...");
    const client = await getDb();
    if (!client) {
      console.error("Failed to connect to MongoDB");
      throw new Error("Failed to connect to MongoDB");
    }

    const campaignMappingCollection = client.collection("campaignMappings");

    // Fetch the mapping for the given Taboola campaign ID
    const mapping = await campaignMappingCollection.findOne({
      taboolaCampaignId,
    });
    if (!mapping || !mapping.mgidCampaignId) {
      console.error(
        `No matching MGID campaign ID found for Taboola campaign ID: ${taboolaCampaignId}`
      );
      throw new Error("No matching MGID campaign ID found");
    }

    const mgidCampaignId = mapping.mgidCampaignId;
    console.log(
      `Found mapping: Taboola ID ${taboolaCampaignId} -> MGID ID ${mgidCampaignId}`
    );

    // Fetch aggregated data from both platforms
    console.log("Fetching Taboola aggregates...");
    const taboolaAggregates =
      await CampaignAggregatesRepo.getCampaignRegionAggregates(
        taboolaCampaignId
      );
    console.log("Taboola Aggregates:", taboolaAggregates);

    console.log("Fetching MGID aggregates...");
    const mgidAggregates =
      await MgidAggregatesRepo.getMgidCampaignRegionAggregates(mgidCampaignId);
    console.log("MGID Aggregates:", mgidAggregates);

    // Combine metrics
    const combinedTotals = {
      totalClicks:
        (mgidAggregates.totalClicks || 0) +
        (taboolaAggregates.totalClicks || 0),
    };

    // Merge top 3 clicks data by region
    const combinedClicksDataMap = new Map();
    const mergeClicksData = (data) => {
      data.forEach((entry) => {
        if (combinedClicksDataMap.has(entry.region)) {
          combinedClicksDataMap.set(
            entry.region,
            combinedClicksDataMap.get(entry.region) + entry.clicks
          );
        } else {
          combinedClicksDataMap.set(entry.region, entry.clicks);
        }
      });
    };

    mergeClicksData(mgidAggregates.top3ClicksData);
    mergeClicksData(taboolaAggregates.top3ClicksData);

    const combinedClicksData = Array.from(
      combinedClicksDataMap,
      ([region, clicks]) => ({ region, clicks })
    );

    // Sort and take the top 3 regions plus "Other"
    combinedClicksData.sort((a, b) => b.clicks - a.clicks);
    const top3Combined = combinedClicksData.slice(0, 3);
    const otherClicks = combinedClicksData
      .slice(3)
      .reduce((acc, curr) => acc + curr.clicks, 0);
    top3Combined.push({ region: "Other", clicks: otherClicks });

    console.log("Combined Totals:", combinedTotals);
    console.log("Top 3 Combined Clicks Data with Other:", top3Combined);

    return {
      totalClicks: combinedTotals.totalClicks,
      top3ClicksData: top3Combined,
    };
  }
}

export default CombinedAggregatesRepo;
