import { getDb } from "../config/db.js";
import {
  getOutbrainCampaignPerformanceResult,
  getOutbrainPerformanceByCountry,
  getOutbrainPerformanceByOS,
  getOutbrainPerformanceByBrowser,
  getOutbrainPerformanceByRegion,
  getOutbrainPerformanceByDomain,
  getOutbrainPerformanceByAds,
} from "./outbrainService.js";

export const fetchAndStoreOutbrainCampaignData = async (
  campaignId,
  startDate,
  endDate
) => {
  let client;
  try {
    console.log(`Fetching Outbrain data for campaignId: ${campaignId}`);

    // Fetch all performance data
    const [
      campaignPerformanceResult,
      performanceByCountry,
      performanceByOS,
      performanceByBrowser,
      performanceByRegion,
      performanceByDomain,
      performanceByAds,
    ] = await Promise.all([
      getOutbrainCampaignPerformanceResult(campaignId, startDate, endDate),
      getOutbrainPerformanceByCountry(campaignId, startDate, endDate),
      getOutbrainPerformanceByOS(campaignId, startDate, endDate),
      getOutbrainPerformanceByBrowser(campaignId, startDate, endDate),
      getOutbrainPerformanceByRegion(campaignId, startDate, endDate),
      getOutbrainPerformanceByDomain(campaignId, startDate, endDate),
      getOutbrainPerformanceByAds(campaignId, startDate, endDate),
    ]);

    // Connect to MongoDB
    client = await getDb();
    const collection = client.collection("outbrainNewDataFormat");

    // Current timestamp in IST format
    const now = new Date();
    const istTime = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
      .format(now)
      .replace(/(\d+)\/(\d+)\/(\d+), /, "$3-$1-$2 ");

    // Prepare document
    const document = {
      startDate,
      endDate,
      campaignId,
      "last-used-rawdata-update-time": istTime,
      "last-used-rawdata-update-time-gmt-millisec": now.getTime(),
      timezone: "IST",
      campaignPerformanceResult: {
        results: campaignPerformanceResult?.results || [],
        recordCount: campaignPerformanceResult?.results?.length || 0,
        metadata: {
          dateStored: new Date(),
        },
      },
      performanceByCountry: {
        results: performanceByCountry?.results || [],
        recordCount: performanceByCountry?.results?.length || 0,
        metadata: {
          dateStored: new Date(),
        },
      },
      performanceByOS: {
        results: performanceByOS?.results || [],
        recordCount: performanceByOS?.results?.length || 0,
        metadata: {
          dateStored: new Date(),
        },
      },
      performanceByBrowser: {
        results: performanceByBrowser?.results || [],
        recordCount: performanceByBrowser?.results?.length || 0,
        metadata: {
          dateStored: new Date(),
        },
      },
      performanceByRegion: {
        results: performanceByRegion?.results || [],
        recordCount: performanceByRegion?.results?.length || 0,
        metadata: {
          dateStored: new Date(),
        },
      },
      performanceByDomain: {
        results: performanceByDomain?.results || [],
        recordCount: performanceByDomain?.results?.length || 0,
        metadata: {
          dateStored: new Date(),
        },
      },
      performanceByAds: {
        results: performanceByAds?.results || [],
        recordCount: performanceByAds?.results?.length || 0,
        metadata: {
          dateStored: new Date(),
        },
      },
      metadata: {
        dateStored: new Date(),
        status: "complete",
      },
    };

    // Store in MongoDB
    const result = await collection.updateOne(
      {
        campaignId,
        startDate,
        endDate,
      },
      { $set: document },
      { upsert: true }
    );

    console.log("MongoDB Result:", {
      matched: result.matchedCount,
      modified: result.modifiedCount,
      upserted: result.upsertedId ? true : false,
    });

    return {
      success: true,
      status: "complete",
      documentId: result.upsertedId || result.modifiedCount,
    };
  } catch (error) {
    console.error("Error in fetchAndStoreOutbrainCampaignData:", error);
    throw error;
  }
};

// Test function
export const testOutbrainDataFetch = async () => {
  try {
    const campaignId = "00166070f8884f88a1c72511c0efaaf804";
    const startDate = "2024-03-01";
    const endDate = "2024-03-19";

    console.log("Starting test...");
    const result = await fetchAndStoreOutbrainCampaignData(
      campaignId,
      startDate,
      endDate
    );
    console.log("Test completed:", result);
    return result;
  } catch (error) {
    console.error("Test failed:", error);
    throw error;
  }
};
