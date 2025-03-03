// Backend/src/routes/combinedMetrics.route.js
import express from "express";
import CombinedTotalRepo from "../repo/combinedTotalRepo.js";
import CombinedAggregatesRepo from "../repo/combinedAggregatesRepo.js";
import CombinedTopStates from "../repo/combinedTopStatesRepo.js";
import CombinedNativeHubRepo from "../repo/combinedNativeHubRepo.js";
import CombinedDailyDataRepo from "../repo/combinedDailyDataRepo.js";
import CombinedOsBasedClicksRepo from "../repo/combinedOsBasedClicksRepo.js";
import CombinedBrowserBasedClicksRepo from "../repo/combinedBrowserBasedClicksRepo.js";
import AdminPageAggregatedRepo from "../repo/adminPageDataAggregatedRepo.js";

const router = express.Router();

// Get total campaign performance by campaignId
router.get("/combined/getCampaignTotals/:campaignId", async (req, res) => {
  try {
    const { campaignId } = req.params;
    console.log("GET /combined/getCampaignTotals/:campaignId route hit");

    try {
      console.log(
        "Fetching combined total campaign performance for campaignId:",
        campaignId
      );
      const combinedData =
        await CombinedTotalRepo.getCombinedCampaignPerformanceTotals(
          campaignId
        );
      console.log("Combined campaign totals extracted successfully.");
      res.status(200).json(combinedData);
    } catch (error) {
      console.error("Error fetching campaign totals:", error);
      res.status(500).send("An error occurred while fetching campaign totals.");
    }
  } catch (error) {
    res.status(500).json({
      message: "Error fetching combined metrics",
      error: error.message,
    });
  }
});

// Get aggregated campaign data by campaignId
router.get("/combined/getCampaignAggregates/:campaignId", async (req, res) => {
  const { campaignId } = req.params;
  console.log("GET /combined/getCampaignAggregates/:campaignId route hit");

  try {
    console.log(
      "Fetching combined campaign aggregates for campaignId:",
      campaignId
    );
    const combinedAggregates =
      await CombinedAggregatesRepo.getCombinedCampaignRegionAggregates(
        campaignId
      );
    console.log("Combined campaign aggregates extracted successfully.");
    res.json(combinedAggregates);
  } catch (error) {
    console.error("Error fetching campaign aggregates:", error);
    res
      .status(500)
      .send("An error occurred while fetching campaign aggregates.");
  }
});

// Route to get the top 7 states by clicks for a given campaign
router.get("/combined/getTop7States/:campaignId", async (req, res) => {
  const { campaignId } = req.params;
  console.log("GET /combined/getTop7States/:campaignId route hit");

  try {
    console.log(
      `Fetching combined top 7 states by clicks for campaignId: ${campaignId}`
    );
    const top7StatesData =
      await CombinedTopStates.getCombinedTop7StatesByClicks(campaignId); // Using the new repo function
    console.log("Combined top 7 States data fetched successfully.");
    res.json(top7StatesData);
  } catch (error) {
    console.error("Error fetching top 7 states data:", error);
    res.status(500).send("An error occurred while fetching top 7 states data.");
  }
});

router.get(
  "/combined/getCampaignDetailsNativeHub/:campaignId",
  async (req, res) => {
    const { campaignId } = req.params;
    console.log(
      "GET /combined/getCampaignDetailsNativeHub/:campaignId route hit"
    );

    try {
      console.log(
        "Fetching combined campaign performance for nativeHub - campaignId:",
        campaignId
      );
      const combinedData =
        await CombinedNativeHubRepo.getCombinedCampaignPerformanceNativeHub(
          campaignId
        );
      console.log("Combined nativeHub Campaign totals extracted successfully.");
      res.status(200).json(combinedData);
    } catch (error) {
      console.error("Error fetching campaign totals for nativehub:", error);
      res
        .status(500)
        .send(
          "An error occurred while fetching campaign totals for nativehub."
        );
    }
  }
);

router.get("/combined/getCampaignDailyData/:campaignId", async (req, res) => {
  const { campaignId } = req.params;
  console.log("GET /combined/getCampaignDailyData/:campaignId route hit");

  try {
    console.log(
      "Fetching combined daily clicks and impressions for campaignId:",
      campaignId
    );
    const campaignDailyData = await CombinedDailyDataRepo.getCombinedDailyData(
      campaignId
    );
    console.log("Combined daily data Campaign totals extracted successfully.");
    res.json(campaignDailyData);
  } catch (error) {
    console.error(
      "Error fetching campaign daily clicks and impressions:",
      error
    );
    res
      .status(500)
      .send(
        "An error occurred while fetching campaign daily clicks and impressions."
      );
  }
});

// Get clicks by OS for a specific campaignId
router.get("/combined/getClicksByOS/:campaignId", async (req, res) => {
  const { campaignId } = req.params;
  console.log("GET /combined/getClicksByOS/:campaignId route hit");

  try {
    console.log(`Fetching combined clicks by OS for campaignId: ${campaignId}`);
    const clicksByOSData =
      await CombinedOsBasedClicksRepo.getCombinedClicksByOS(campaignId);
    console.log("Combined clicks by OS data fetched successfully.");
    res.json(clicksByOSData);
  } catch (error) {
    console.error("Error fetching clicks by OS:", error);
    res.status(500).send("An error occurred while fetching clicks by OS.");
  }
});

// Route to fetch clicks by browser for a given campaign
router.get("/combined/getClicksByBrowser/:campaignId", async (req, res) => {
  const { campaignId } = req.params;
  console.log("GET /combined/getClicksByBrowser/:campaignId route hit");

  try {
    console.log(
      `Fetching combined clicks by browser for campaignId: ${campaignId}`
    );
    const clicksByBrowser =
      await CombinedBrowserBasedClicksRepo.getCombinedClicksByBrowser(
        campaignId
      );
    console.log("Combined clicks by browser fetched successfully.");
    res.json(clicksByBrowser);
  } catch (error) {
    console.error("Error fetching clicks by browser:", error);
    res.status(500).send("An error occurred while fetching clicks by browser.");
  }
});

router.get("/combinedData", async (req, res) => {
  try {
    console.log("fetching combined data of all the campaigns");
    const clientName = req.query.clientName;

    let allCampaignData;
    if (clientName) {
      console.log(`Filtering data for client: ${clientName}`);
      allCampaignData = await AdminPageAggregatedRepo.getClientFilteredData(
        clientName
      );
    } else {
      allCampaignData = await AdminPageAggregatedRepo.getCombinedData();
    }

    console.log("Data fetched successfully");
    res.json(allCampaignData);
  } catch (error) {
    console.error("Error in fetching data ", error);
    res.status(500).send("An error occurred while fetching data.");
  }
});

router.get("/clients", async (req, res) => {
  try {
    console.log("Fetching unique client names");
    const clients = await AdminPageAggregatedRepo.getUniqueClients();
    res.json(clients);
  } catch (error) {
    console.error("Error fetching client names:", error);
    res.status(500).send("An error occurred while fetching client names.");
  }
});

export default router;
