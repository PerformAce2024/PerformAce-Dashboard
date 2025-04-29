import {
  getTaboolaCampaignPerformanceResult,
  getTaboolaPerformanceByCountry,
  getTaboolaPerformanceByOS,
  getTaboolaPerformanceByBrowser,
  getTaboolaPerformanceByRegion,
  getTaboolaPerformanceBySite,
} from "../services/taboolaService.js";

export const fetchCampaignPerformance = async (req, res) => {
  const { campaignId, startDate, endDate } = req.query;

  if (!campaignId || !startDate || !endDate) {
    return res.status(400).json({ message: "Missing required parameters" });
  }

  try {
    const result = await getTaboolaCampaignPerformanceResult(
      campaignId,
      startDate,
      endDate
    );
    res.json(result);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const fetchPerformanceByCountry = async (req, res) => {
  const { campaignId, startDate, endDate } = req.query;
  try {
    const data = await getTaboolaPerformanceByCountry(
      campaignId,
      startDate,
      endDate
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const fetchPerformanceByOS = async (req, res) => {
  const { campaignId, startDate, endDate } = req.query;
  try {
    const data = await getTaboolaPerformanceByOS(
      campaignId,
      startDate,
      endDate
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const fetchPerformanceByBrowser = async (req, res) => {
  const { campaignId, startDate, endDate } = req.query;
  try {
    const data = await getTaboolaPerformanceByBrowser(
      campaignId,
      startDate,
      endDate
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const fetchPerformanceByRegion = async (req, res) => {
  const { campaignId, startDate, endDate } = req.query;
  try {
    const data = await getTaboolaPerformanceByRegion(
      campaignId,
      startDate,
      endDate
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const fetchPerformanceBySite = async (req, res, next) => {
  try {
    const { campaignId, startDate, endDate } = req.query;
    const siteData = await getTaboolaPerformanceBySite(
      campaignId,
      startDate,
      endDate
    );
    res.json(siteData);
  } catch (error) {
    next(error);
  }
};
