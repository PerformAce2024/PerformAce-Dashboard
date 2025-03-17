import { getDb } from "../config/db.js";
import {
  getTaboolaCampaignPerformanceResult,
  getTaboolaPerformanceByCountry,
  getTaboolaPerformanceByOS,
  getTaboolaPerformanceByBrowser,
  getTaboolaPerformanceByRegion,
  getTaboolaPerformanceBySite,
} from "./taboolaService.js";

const dbName = "campaignAnalytics";
const collectionName = "taboolaData";

export const fetchAndStoreTaboolaCampaignData = async (
  campaignId,
  startDate,
  endDate
) => {
  try {
    const [
      campaignPerformanceResult,
      performanceByCountry,
      performanceByOS,
      performanceByBrowser,
      performanceByRegion,
      performanceBySite,
    ] = await Promise.all([
      getTaboolaCampaignPerformanceResult(campaignId, startDate, endDate),
      getTaboolaPerformanceByCountry(campaignId, startDate, endDate),
      getTaboolaPerformanceByOS(campaignId, startDate, endDate),
      getTaboolaPerformanceByBrowser(campaignId, startDate, endDate),
      getTaboolaPerformanceByRegion(campaignId, startDate, endDate),
      getTaboolaPerformanceBySite(campaignId, startDate, endDate),
    ]);

    const client = await getDb();
    if (!client) throw new Error("MongoDB connection failed");

    const collection = client.collection(collectionName);

    const campaignData = {
      campaignId,
      startDate,
      endDate,
      campaignPerformanceResult,
      performanceByCountry,
      performanceByOS,
      performanceByBrowser,
      performanceByRegion,
      performanceBySite,
      dateStored: new Date(),
    };

    await collection.updateOne(
      { campaignId, startDate, endDate },
      { $set: campaignData },
      { upsert: true }
    );

    return campaignData;
  } catch (error) {
    console.error("Error fetching and storing Taboola campaign data:", error);
    throw new Error("Failed to fetch and save Taboola campaign data");
  }
};
