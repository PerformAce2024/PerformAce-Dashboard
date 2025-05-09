import CampaignTotalRepo from "./totalRepo.js";

class CombinedTotalRepo {
  static async getCombinedCampaignPerformanceTotals(taboolaCampaignId) {
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

    console.log(
      `Found mapping: Taboola ID ${taboolaCampaignId} -> MGID ID ${mgidCampaignId}`
    );

    // Fetch data from both platforms
    console.log("Fetching Taboola data...");
    const taboolaData = await CampaignTotalRepo.getCampaignPerformanceTotals(
      taboolaCampaignId
    );
    console.log("Taboola Data:", taboolaData);

    console.log("Fetching MGID data...");

    // Combine metrics
    const combinedTotals = {
      totalClicks: (mgidData.totalClicks || 0) + (taboolaData.totalClicks || 0),
      totalImpressions:
        (mgidData.totalImpressions || 0) + (taboolaData.totalImpressions || 0),
      totalSpent: (mgidData.totalSpent || 0) + (taboolaData.totalSpent || 0),
      averageCTR: (
        (mgidData.totalClicks + taboolaData.totalClicks) /
        (mgidData.totalImpressions + taboolaData.totalImpressions || 1)
      ).toFixed(2),
    };

    // Merge clicks data by date
    const clicksDataMap = new Map();
    const mergeClicksData = (data) => {
      data.forEach((entry) => {
        if (clicksDataMap.has(entry.date)) {
          clicksDataMap.set(
            entry.date,
            clicksDataMap.get(entry.date) + entry.clicks
          );
        } else {
          clicksDataMap.set(entry.date, entry.clicks);
        }
      });
    };

    mergeClicksData(taboolaData.clicksData);

    const combinedClicksData = Array.from(clicksDataMap, ([date, clicks]) => ({
      date,
      clicks,
    }));

    console.log("Combined Totals:", combinedTotals);
    console.log("Combined Clicks Data:", combinedClicksData);

    return {
      ...combinedTotals,
      clicksData: combinedClicksData,
    };
  }
}

export default CombinedTotalRepo;
