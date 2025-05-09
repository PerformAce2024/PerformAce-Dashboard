import express from "express";
import {
  fetchCampaignPerformance,
  fetchPerformanceByCountry,
  fetchPerformanceByOS,
  fetchPerformanceByBrowser,
  fetchPerformanceByRegion,
} from "../controllers/taboola.controller.js";
import { fetchAndStoreTaboolaCampaignData } from "../services/fetchAllTaboolaServices.js";
import CampaignTotalRepo from "../repo/totalRepo.js";
import CampaignAggregatesRepo from "../repo/aggregatesRepo.js";
import CampaignNativeHubRepo from "../repo/NativeHubRepo.js";
import CampaignDailyDataRepo from "../repo/dailyDataRepo.js";
import CampaignTopStates from "../repo/topStatesRepo.js";
import CampaignPerformanceByOSRepo from "../repo/OsBasedClicksRepo.js";
import CampaignPerformanceByBrowserRepo from "../repo/browserBasedClicksRepo.js";
import CampaignAllStates from "../repo/allStatesData.js";

const router = express.Router();

// Fetch general campaign performance
router.get("/campaign-performance", (req, res, next) => {
  console.log("GET /campaign-performance route hit");
  fetchCampaignPerformance(req, res, next)
    .then(() => console.log("Campaign performance fetched successfully"))
    .catch((error) => {
      console.error("Error fetching campaign performance:", error);
      next(error);
    });
});

// Fetch performance by country
router.get("/performance-country", (req, res, next) => {
  console.log("GET /performance-country route hit");
  fetchPerformanceByCountry(req, res, next)
    .then(() => console.log("Performance by country fetched successfully"))
    .catch((error) => {
      console.error("Error fetching performance by country:", error);
      next(error);
    });
});

// Fetch performance by OS
router.get("/performance-os", (req, res, next) => {
  console.log("GET /performance-os route hit");
  fetchPerformanceByOS(req, res, next)
    .then(() => console.log("Performance by OS fetched successfully"))
    .catch((error) => {
      console.error("Error fetching performance by OS:", error);
      next(error);
    });
});

// Fetch performance by browser
router.get("/performance-browser", (req, res, next) => {
  console.log("GET /performance-browser route hit");
  fetchPerformanceByBrowser(req, res, next)
    .then(() => console.log("Performance by browser fetched successfully"))
    .catch((error) => {
      console.error("Error fetching performance by browser:", error);
      next(error);
    });
});

// Fetch performance by region
router.get("/performance-region", (req, res, next) => {
  console.log("GET /performance-region route hit");
  fetchPerformanceByRegion(req, res, next)
    .then(() => console.log("Performance by region fetched successfully"))
    .catch((error) => {
      console.error("Error fetching performance by region:", error);
      next(error);
    });
});

// Route to fetch and store Taboola campaign data
router.post("/taboola/fetch-store-campaign", async (req, res) => {
  const { campaignId, startDate, endDate } = req.body;
  console.log("POST /taboola/fetch-store-campaign route hit");
  console.log("Request body:", req.body);

  // Validate that required parameters are provided
  if (!campaignId || !startDate || !endDate) {
    console.error(
      "Missing required parameters: campaignId, startDate, or endDate"
    );
    return res
      .status(400)
      .json({
        message:
          "Missing required parameters: campaignId, startDate, or endDate",
      });
  }

  try {
    console.log(
      `Fetching and storing Taboola campaign data for Campaign ID: ${campaignId}`
    );
    await fetchAndStoreTaboolaCampaignData(campaignId, startDate, endDate);
    console.log("Campaign data successfully fetched and stored");
    return res
      .status(200)
      .json({ message: "Campaign data successfully fetched and stored" });
  } catch (error) {
    console.error("Error fetching and storing campaign data:", error);
    return res
      .status(500)
      .json({
        message: "Failed to fetch and store campaign data",
        error: error.message,
      });
  }
});

// Get total campaign performance by campaignId
router.get("/taboola/getCampaignTotals/:campaignId", async (req, res) => {
  const { campaignId } = req.params;
  console.log("GET /taboola/getCampaignTotals/:campaignId route hit");
  console.log("Request Params:", req.params);

  try {
    console.log(
      "Fetching total campaign performance for campaignId:",
      campaignId
    );
    const campaignTotals = await CampaignTotalRepo.getCampaignPerformanceTotals(
      campaignId
    );
    console.log("Campaign totals extracted successfully.");
    res.json(campaignTotals);
  } catch (error) {
    console.error("Error fetching campaign totals:", error);
    res.status(500).send("An error occurred while fetching campaign totals.");
  }
});

// Get aggregated campaign data by campaignId
router.get("/taboola/getCampaignAggregates/:campaignId", async (req, res) => {
  const { campaignId } = req.params;
  console.log("GET /taboola/getCampaignAggregates/:campaignId route hit");
  console.log("Request Params:", req.params);

  try {
    console.log("Fetching campaign aggregates for campaignId:", campaignId);
    const campaignAggregates =
      await CampaignAggregatesRepo.getCampaignRegionAggregates(campaignId);
    console.log("Campaign aggregates extracted successfully.");
    res.json(campaignAggregates);
  } catch (error) {
    console.error("Error fetching campaign aggregates:", error);
    res
      .status(500)
      .send("An error occurred while fetching campaign aggregates.");
  }
});

router.get(
  "/taboola/getCampaignDetailsNativeHub/:campaignId",
  async (req, res) => {
    const { campaignId } = req.params;
    console.log(
      "GET /taboola/getCampaignDetailsNativeHub/:campaignId route hit"
    );
    console.log("Request Params:", req.params);

    try {
      console.log(
        "Fetching total campaign performance for campaignId:",
        campaignId
      );
      const campaignNativeHub =
        await CampaignNativeHubRepo.getCampaignPerformanceNativeHub(campaignId);
      console.log("NativeHub Campaign totals extracted successfully.");
      res.json(campaignNativeHub);
    } catch (error) {
      console.error("Error fetching campaign totals:", error);
      res.status(500).send("An error occurred while fetching campaign totals.");
    }
  }
);

// Route to get the top 7 states by clicks for a given campaign
router.get("/taboola/getTop7States/:campaignId", async (req, res) => {
  const { campaignId } = req.params;
  console.log("GET /taboola/getTop7States/:campaignId route hit");
  console.log("Request Params:", req.params);

  try {
    console.log(
      `Fetching top 7 states by clicks for campaignId: ${campaignId}`
    );
    const top7StatesData = await CampaignTopStates.getTop7StatesByClicks(
      campaignId
    ); // Using the new repo function
    console.log("Top 7 States data fetched successfully.");
    res.json(top7StatesData);
  } catch (error) {
    console.error("Error fetching top 7 states data:", error);
    res.status(500).send("An error occurred while fetching top 7 states data.");
  }
});

// Get clicks by OS for a specific campaignId
router.get("/taboola/getClicksByOS/:campaignId", async (req, res) => {
  const { campaignId } = req.params;
  console.log("GET /taboola/getClicksByOS/:campaignId route hit");
  console.log("Request Params:", req.params);

  try {
    console.log(`Fetching clicks by OS for campaignId: ${campaignId}`);
    const clicksByOSData = await CampaignPerformanceByOSRepo.getClicksByOS(
      campaignId
    );
    console.log("Clicks by OS data fetched successfully.");
    res.json(clicksByOSData);
  } catch (error) {
    console.error("Error fetching clicks by OS:", error);
    res.status(500).send("An error occurred while fetching clicks by OS.");
  }
});

// Route to fetch clicks by browser for a given campaign
router.get("/taboola/getClicksByBrowser/:campaignId", async (req, res) => {
  const { campaignId } = req.params;
  console.log("GET /taboola/getClicksByBrowser/:campaignId route hit");
  console.log("Request Params:", req.params);

  try {
    console.log(`Fetching clicks by browser for campaignId: ${campaignId}`);
    const clicksByBrowser =
      await CampaignPerformanceByBrowserRepo.getClicksByBrowser(campaignId);
    console.log("Clicks by browser fetched successfully.");
    res.json(clicksByBrowser);
  } catch (error) {
    console.error("Error fetching clicks by browser:", error);
    res.status(500).send("An error occurred while fetching clicks by browser.");
  }
});

router.get("/taboola/getAllStatesByClicks/:campaignId", async (req, res) => {
  const { campaignId } = req.params;
  console.log("GET /taboola/getAllStatesByClicks/:campaignId route hit");
  console.log("Request Params:", req.params);

  try {
    console.log(`Fetching all states by clicks for campaignId: ${campaignId}`);
    const allStatesData = await CampaignAllStates.getAllStatesByClicks(
      campaignId
    ); // Using the new repo function
    console.log("All States data fetched successfully.");
    res.json(allStatesData);
  } catch (error) {
    console.error("Error fetching all states data:", error);
    res.status(500).send("An error occurred while fetching top 7 states data.");
  }
});

// Route to get daily metrics (date, amount spent, impressions, clicks, avg CPC, CTR) for a specific campaignId
router.get("/taboola/getAdminDailyMetrics/:campaignId", async (req, res) => {
  const { campaignId } = req.params;
  console.log("GET /taboola/getDailyMetrics/:campaignId route hit");
  console.log("Request Params:", req.params);

  try {
    console.log(`Fetching daily metrics for campaignId: ${campaignId}`);
    const dailyMetrics =
      await CampaignDailyDataRepo.getAdminCampaignDailyMetrics(campaignId);
    console.log("Daily metrics fetched successfully.");
    res.json(dailyMetrics);
  } catch (error) {
    console.error("Error fetching daily metrics:", error);
    res.status(500).send("An error occurred while fetching daily metrics.");
  }
});

// Route to get daily metrics (date, amount spent, impressions, clicks, avg CPC, CTR) for a specific campaignId
router.get("/taboola/getClientDailyMetrics/:campaignId", async (req, res) => {
  const { campaignId } = req.params;
  console.log("GET /taboola/getDailyMetrics/:campaignId route hit");
  console.log("Request Params:", req.params);

  try {
    console.log(`Fetching daily metrics for campaignId: ${campaignId}`);
    const dailyMetrics =
      await CampaignDailyDataRepo.getClientCampaignDailyMetrics(
        campaignId,
        "Honda"
      );
    console.log("Daily metrics fetched successfully.");
    res.json(dailyMetrics);
  } catch (error) {
    console.error("Error fetching daily metrics:", error);
    res.status(500).send("An error occurred while fetching daily metrics.");
  }
});

export default router;
