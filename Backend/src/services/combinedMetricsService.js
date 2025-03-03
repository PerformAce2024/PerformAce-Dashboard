// Backend/src/services/combinedMetricsService.js
import { fetchTaboolaData } from "./taboolaService.js"; // Import Taboola service function
import { fetchMGIDData } from "./mgidService.js"; // Import MGID service function

export const getCombinedMetrics = async (campaignId) => {
  try {
    // Fetch data from Taboola and MGID services
    const taboolaData = await fetchTaboolaData(campaignId);
    const mgidData = await fetchMGIDData(campaignId);

    // Aggregate data (assuming taboolaData and mgidData have similar structures)
    const combinedData = {
      totalClicks: (taboolaData.totalClicks || 0) + (mgidData.totalClicks || 0),
      totalImpressions:
        (taboolaData.totalImpressions || 0) + (mgidData.totalImpressions || 0),
      totalSpent: (taboolaData.totalSpent || 0) + (mgidData.totalSpent || 0),
      averageCTR:
        ((taboolaData.totalClicks + mgidData.totalClicks) /
          (taboolaData.totalImpressions + mgidData.totalImpressions)) *
          100 || 0,
      clicksData: [
        ...(taboolaData.clicksData || []),
        ...(mgidData.clicksData || []),
      ],
    };

    return combinedData;
  } catch (error) {
    console.error("Error merging Taboola and MGID data:", error);
    throw error;
  }
};
