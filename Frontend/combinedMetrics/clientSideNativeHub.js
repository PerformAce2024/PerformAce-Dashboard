import config from "../helper/config.js";
import { aggregateMultiPlatformData } from "../client/js/dataprocessing.js";
import { fetchPlatformPerformanceData } from "./fetchPlatformPerformanceData.js";
import { updateOSPerformance } from "./updateOSNHC.js";
import { UpdateRegionData } from "./updateRegionDataNHC.js";
import { updateBrowserPerformance } from "./updateBroswerNHC.js";
import { updateDailyMetrics } from "./updateDailyMetricsNHC.js";
import { updateDashboardMetrics } from "./updateMetricsNHC.js";

const clientSideNativeHub = async () => {
  try {
    const userEmail = localStorage.getItem("userEmail");
    const authToken = localStorage.getItem("authToken");
    const selectedRO = sessionStorage.getItem("selectedRO");
    if (!userEmail || !selectedRO) {
      console.error("Missing required data:", { userEmail, selectedRO });
      return;
    }

    // Fetch CPC first
    const roResponse = await fetch(
      `${config.BASE_URL}/api/releaseOrders/cpc/${selectedRO}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    if (!roResponse.ok) {
      throw new Error("Failed to fetch RO details");
    }

    const roData = await roResponse.json();
    const roNumber = roData.roNumber;

    const clientNameResponse = await fetch(
      `${config.BASE_URL}/api/clientname/${encodeURIComponent(userEmail)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    if (!clientNameResponse.ok) {
      throw new Error("Failed to fetch client name");
    }

    const clientData = await clientNameResponse.json();
    const clientName = clientData.clientName;

    const mappingsResponse = await fetch(
      `${config.BASE_URL}/api/campaignMappings?clientName=${encodeURIComponent(
        clientName
      )}&roNumber=${encodeURIComponent(roNumber)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    if (!mappingsResponse.ok) {
      throw new Error("Failed to fetch campaign mappings");
    }

    const mappingsData = await mappingsResponse.json();

    // Extract campaign IDs for each platform
    const platformCampaignIds = {
      taboola: [],
      outbrain: [],
      dspOutbrain: [],
      mgid: [],
    };

    const mapping = mappingsData.mappings.find((m) => m.roNumber === roNumber);

    if (mapping) {
      if (mapping.taboolaCampaignId)
        platformCampaignIds.taboola = mapping.taboolaCampaignId;
      if (mapping.outbrainCampaignId)
        platformCampaignIds.outbrain = mapping.outbrainCampaignId;
      if (mapping.dspOutbrainCampaignId)
        platformCampaignIds.dspOutbrain = mapping.dspOutbrainCampaignId;
      if (mapping.mgidCampaignId)
        platformCampaignIds.mgid = mapping.mgidCampaignId;
    }

    const performanceData = {
      taboola: await fetchPlatformPerformanceData(
        "taboola",
        platformCampaignIds.taboola,
        authToken
      ),
      outbrain: await fetchPlatformPerformanceData(
        "outbrain",
        platformCampaignIds.outbrain,
        authToken
      ),
      dspOutbrain: await fetchPlatformPerformanceData(
        "dspOutbrain",
        platformCampaignIds.dspOutbrain,
        authToken
      ),
      mgid: await fetchPlatformPerformanceData(
        "mgid",
        platformCampaignIds.mgid,
        authToken
      ),
    };

    // Process and aggregate the performance data across all platforms
    const aggregatedData = aggregateMultiPlatformData(performanceData);

    // Update UI with the aggregated data
    console.log("UI updated with performance data");
    //for metrics
    updateDashboardMetrics(aggregatedData);
    // for OS
    updateOSPerformance(aggregatedData);

    // for region
    UpdateRegionData(aggregatedData);

    // for browser
    updateBrowserPerformance(aggregatedData);
    // for Statistics
    updateDailyMetrics(aggregatedData);
    return {
      clientName,
      roNumber,
      platformCampaignIds,
      performanceData,
      aggregatedData,
    };
  } catch (error) {
    console.error("Error in campaign data flow:", error);
    console.log(
      "%c 🚨 CAMPAIGN DATA ERROR",
      "background: red; color: white; font-size: 20px"
    );
    console.log(error.stack); // Show stack trace
    // Handle error in UI
  }
};
document.addEventListener("DOMContentLoaded", () => {
  clientSideNativeHub();
});
