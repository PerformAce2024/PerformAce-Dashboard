import aggregateClientData from "../services/aggregationService.js";

const handleError = (res, error, metric) => {
  console.error(`Error fetching ${metric}:`, error);
  res
    .status(500)
    .json({ message: `Failed to fetch ${metric}`, error: error.message });
};

export const getPerformanceByBrowser = async (req, res) => {
  try {
    const { clientEmail, startDate, endDate } = req.query;
    const data = await aggregateClientData(clientEmail, startDate, endDate);
    res.json(data.performanceByBrowser);
  } catch (error) {
    handleError(res, error, "browser performance");
  }
};

export const getPerformanceByOS = async (req, res) => {
  try {
    const { clientEmail, startDate, endDate } = req.query;
    const data = await aggregateClientData(clientEmail, startDate, endDate);
    res.json(data.performanceByOS);
  } catch (error) {
    handleError(res, error, "OS performance");
  }
};

export const getPerformanceByCountry = async (req, res) => {
  try {
    const { clientEmail, startDate, endDate } = req.query;
    const data = await aggregateClientData(clientEmail, startDate, endDate);
    res.json(data.performanceByCountry);
  } catch (error) {
    handleError(res, error, "country performance");
  }
};

export const getPerformanceByRegion = async (req, res) => {
  try {
    const { clientEmail, startDate, endDate } = req.query;
    const data = await aggregateClientData(clientEmail, startDate, endDate);
    res.json(data.performanceByRegion);
  } catch (error) {
    handleError(res, error, "region performance");
  }
};

export const getCampaignPerformance = async (req, res) => {
  try {
    const { clientEmail, startDate, endDate } = req.query;
    const data = await aggregateClientData(clientEmail, startDate, endDate);
    res.json(data.campaignPerformanceResult);
  } catch (error) {
    handleError(res, error, "campaign performance");
  }
};
