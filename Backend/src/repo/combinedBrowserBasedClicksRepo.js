import { connectToMongo, getDb } from "../config/db.js";
import CampaignPerformanceByBrowserRepo from "./browserBasedClicksRepo.js";
import MgidPerformanceByBrowserRepo from "./mgidBrowserBasedClicksRepo.js";

class CombinedBrowserBasedClicksRepo {
  static async getCombinedClicksByBrowser(taboolaCampaignId) {
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

    // Fetch browser-based clicks data from both Taboola and MGID
    console.log("Fetching Taboola browser-based clicks data...");
    const taboolaBrowserClicks =
      await CampaignPerformanceByBrowserRepo.getClicksByBrowser(
        taboolaCampaignId
      );
    console.log("Taboola Browser Clicks Data:", taboolaBrowserClicks);

    console.log("Fetching MGID browser-based clicks data...");
    const mgidBrowserClicks =
      await MgidPerformanceByBrowserRepo.getMgidClicksByBrowser(mgidCampaignId);
    console.log("MGID Browser Clicks Data:", mgidBrowserClicks);

    // Combine the browser clicks data from both sources
    const combinedBrowserClicksMap = new Map();

    const mergeBrowserClicksData = (data) => {
      data.forEach((entry) => {
        const browser = entry.browser;
        if (combinedBrowserClicksMap.has(browser)) {
          combinedBrowserClicksMap.set(
            browser,
            combinedBrowserClicksMap.get(browser) + entry.clicks
          );
        } else {
          combinedBrowserClicksMap.set(browser, entry.clicks);
        }
      });
    };

    mergeBrowserClicksData(taboolaBrowserClicks);
    mergeBrowserClicksData(mgidBrowserClicks);

    const combinedBrowserClicksData = Array.from(
      combinedBrowserClicksMap,
      ([browser, clicks]) => ({ browser, clicks })
    );

    // Sort the combined data by clicks in descending order
    combinedBrowserClicksData.sort((a, b) => b.clicks - a.clicks);

    console.log("Combined Browser Clicks Data:", combinedBrowserClicksData);

    // Return the combined browser-based clicks data
    return combinedBrowserClicksData;
  }
}

export default CombinedBrowserBasedClicksRepo;
