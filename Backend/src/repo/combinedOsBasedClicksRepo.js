import { getDb } from "../config/db.js";
import CampaignPerformanceByOSRepo from "./OsBasedClicksRepo.js";

class CombinedOsBasedClicksRepo {
  static async getCombinedClicksByOS(taboolaCampaignId) {
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

    // Fetch OS-based clicks data from both Taboola and MGID
    console.log("Fetching Taboola OS-based clicks data...");
    const taboolaOsClicks = await CampaignPerformanceByOSRepo.getClicksByOS(
      taboolaCampaignId
    );
    console.log("Taboola OS Clicks Data:", taboolaOsClicks);

    // Combine the OS clicks data from both sources
    const combinedOsClicksMap = new Map();

    const mergeOsClicksData = (data) => {
      data.forEach((entry) => {
        const osFamily = entry.osFamily;
        if (combinedOsClicksMap.has(osFamily)) {
          combinedOsClicksMap.set(
            osFamily,
            combinedOsClicksMap.get(osFamily) + entry.clicks
          );
        } else {
          combinedOsClicksMap.set(osFamily, entry.clicks);
        }
      });
    };

    mergeOsClicksData(taboolaOsClicks);
    mergeOsClicksData(mgidOsClicks);

    const combinedOsClicksData = Array.from(
      combinedOsClicksMap,
      ([osFamily, clicks]) => ({ osFamily, clicks })
    );

    // Sort the combined data by clicks in descending order
    combinedOsClicksData.sort((a, b) => b.clicks - a.clicks);

    console.log("Combined OS Clicks Data:", combinedOsClicksData);

    // Return the combined OS-based clicks data
    return combinedOsClicksData;
  }
}

export default CombinedOsBasedClicksRepo;
