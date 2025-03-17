import CampaignTopStates from "./topStatesRepo.js";
import MgidTopStates from "./mgidTopStatesRepo.js";

class CombinedTopStatesRepo {
  static async getCombinedTop7StatesByClicks(taboolaCampaignId) {
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

    // Fetch top 7 states by clicks from both Taboola and MGID
    console.log("Fetching Taboola top states...");
    const taboolaTopStates = await CampaignTopStates.getTop7StatesByClicks(
      taboolaCampaignId
    );
    console.log("Taboola Top States:", taboolaTopStates);

    console.log("Fetching MGID top states...");
    const mgidTopStates = await MgidTopStates.getMgidTop7StatesByClicks(
      mgidCampaignId
    );
    console.log("MGID Top States:", mgidTopStates);

    // Combine the total clicks from both platforms
    const combinedTotals = {
      totalClicks:
        (mgidTopStates.totalClicks || 0) + (taboolaTopStates.totalClicks || 0),
    };

    // Merge top 7 states data by region
    const combinedClicksDataMap = new Map();
    const mergeClicksData = (data) => {
      data.forEach((entry) => {
        if (combinedClicksDataMap.has(entry.state)) {
          combinedClicksDataMap.set(
            entry.state,
            combinedClicksDataMap.get(entry.state) + entry.clicks
          );
        } else {
          combinedClicksDataMap.set(entry.state, entry.clicks);
        }
      });
    };

    mergeClicksData(mgidTopStates.top7ClicksData);
    mergeClicksData(taboolaTopStates.top7ClicksData);

    const combinedClicksData = Array.from(
      combinedClicksDataMap,
      ([state, clicks]) => ({ state, clicks })
    );

    // Sort and take the top 7 states plus "Other"
    combinedClicksData.sort((a, b) => b.clicks - a.clicks);
    const top7Combined = combinedClicksData.slice(0, 7);
    const otherClicks = combinedClicksData
      .slice(7)
      .reduce((acc, curr) => acc + curr.clicks, 0);
    top7Combined.push({ state: "Other", clicks: otherClicks });

    console.log("Combined Total Clicks:", combinedTotals);
    console.log("Top 7 Combined Clicks Data with Other:", top7Combined);

    // Return the aggregated data
    return {
      totalClicks: combinedTotals.totalClicks,
      top7ClicksData: top7Combined,
    };
  }
}

export default CombinedTopStatesRepo;
