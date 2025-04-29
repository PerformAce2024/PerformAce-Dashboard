// combinedMetrics/combinedDataTotals.js

import { fetchPlatformPerformanceData } from "./fetchPlatformPerformanceData.js";
import { aggregateMultiPlatformData } from "../client/js/dataprocessing.js";
import { updateUIWithPerformanceData } from "../client/js/updateui.js";
import config from "../helper/config.js";
import { updateMetricsTableWithPerformanceData } from "../client/js/metricstable.js";

export const fetchCampaignDataTotal = async (selectedRO) => {
  try {
    console.log("Starting to fetch total campaign data for RO:", selectedRO);
    const userEmail =
      localStorage.getItem("selectedClientEmail") ||
      localStorage.getItem("userEmail");

    const authToken = localStorage.getItem("authToken");

    if (!userEmail || !selectedRO) {
      console.error("Missing required data:", { userEmail, selectedRO });
      return;
    }

    // Fetch CampaignData first
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

    console.log(
      "Fetching performance data for platforms:",
      Object.keys(platformCampaignIds)
    );

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

    console.log("Performance data fetched successfully", performanceData);

    // Process and aggregate the performance data across all platforms
    const aggregatedData = aggregateMultiPlatformData(performanceData);
    console.log("Data aggregated successfully", aggregatedData);

    // Update UI with the aggregated data
    updateUIWithPerformanceData(aggregatedData);
    console.log("UI updated with performance data", aggregatedData);
    // Update Metrics Table
    // updateMetricsTableWithPerformanceData(aggregatedData);
    updateMetricsTableWithPerformanceData(aggregatedData);
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
