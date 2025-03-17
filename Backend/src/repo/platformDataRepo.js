import { getDb } from "../config/db.js";

class PlatformDataRepo {
  static async getPlatformData(platform) {
    console.log(`Getting data for platform: ${platform}`);
    const client = await getDb();
    if (!client) {
      console.error("Failed to connect to MongoDB");
      throw new Error("Failed to connect to MongoDB");
    }

    try {
      // Determine which collection to use based on platform
      let collectionName;
      switch (platform.toLowerCase()) {
        case "mgid":
          collectionName = "mgid_transformed_data_final";
          break;
        case "taboola":
          collectionName = "taboolaData";
          break;
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }

      const collection = client.collection(collectionName);

      const pipeline = [
        {
          $unwind: "$campaignPerformanceResult.results",
        },
        {
          $group: {
            _id: null,
            totalClicks: {
              $sum: "$campaignPerformanceResult.results.clicks",
            },
            totalImpressions: {
              $sum: "$campaignPerformanceResult.results.impressions",
            },
            totalSpent: {
              $sum: "$campaignPerformanceResult.results.spent",
            },
            totalCPC: {
              $avg: "$campaignPerformanceResult.results.cpc",
            },
            totalCTR: {
              $avg: "$campaignPerformanceResult.results.ctr",
            },
          },
        },
      ];

      const result = await collection.aggregate(pipeline).toArray();

      if (!result.length) {
        return {
          totalClicks: 0,
          totalImpressions: 0,
          totalSpent: 0,
          totalCPC: 0,
          totalCTR: 0,
        };
      }

      return result[0];
    } catch (error) {
      console.error(`Error in getPlatformData for ${platform}:`, error);
      throw error;
    }
  }

  static async getFilteredData(clientName, platform) {
    console.log(
      `Getting filtered data for client: ${clientName}, platform: ${platform}`
    );
    const client = await getDb();
    if (!client) {
      console.error("Failed to connect to MongoDB");
      throw new Error("Failed to connect to MongoDB");
    }

    try {
      // Determine which collection to use based on platform
      let collectionName;
      switch (platform.toLowerCase()) {
        case "mgid":
          collectionName = "mgid_transformed_data_final";
          break;
        case "taboola":
          collectionName = "taboolaData";
          break;
        default:
          // Use aggregated table as fallback
          collectionName = "aggregatedTableFromAllPlatforms";
      }

      const collection = client.collection(collectionName);

      const pipeline = [
        {
          $match: { clientName: clientName },
        },
        {
          $unwind: "$campaignPerformanceResult.results",
        },
        {
          $group: {
            _id: null,
            totalClicks: {
              $sum: "$campaignPerformanceResult.results.clicks",
            },
            totalImpressions: {
              $sum: "$campaignPerformanceResult.results.impressions",
            },
            totalSpent: {
              $sum: "$campaignPerformanceResult.results.spent",
            },
            totalCPC: {
              $avg: "$campaignPerformanceResult.results.cpc",
            },
            totalCTR: {
              $avg: "$campaignPerformanceResult.results.ctr",
            },
          },
        },
      ];

      const result = await collection.aggregate(pipeline).toArray();

      if (!result.length) {
        return {
          totalClicks: 0,
          totalImpressions: 0,
          totalSpent: 0,
          totalCPC: 0,
          totalCTR: 0,
        };
      }

      return result[0];
    } catch (error) {
      console.error(
        `Error in getFilteredData for client ${clientName}, platform ${platform}:`,
        error
      );
      throw error;
    }
  }
}

export default PlatformDataRepo;
