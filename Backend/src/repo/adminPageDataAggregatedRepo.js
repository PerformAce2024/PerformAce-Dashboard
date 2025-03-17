import { connectToMongo, getDb } from "../config/db.js";

class AdminPageAggregatedRepo {
  static async getCombinedData() {
    console.log("Connecting to MongoDB for aggregated data...");
    const client = await getDb();
    if (!client) {
      console.error("Failed to connect to MongoDB");
      throw new Error("Failed to connect to MongoDB");
    }

    try {
      const collection = client.collection("aggregatedTableFromAllPlatforms");
      const count = await collection.countDocuments();
      console.log(`Total documents in collection: ${count}`);

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
      console.error("Error in getCombinedData:", error);
      throw error;
    }
  }

  static async getClientFilteredData(clientName) {
    console.log(`Getting filtered data for client: ${clientName}`);
    const client = await getDb();
    if (!client) {
      console.error("Failed to connect to MongoDB");
      throw new Error("Failed to connect to MongoDB");
    }

    try {
      const collection = client.collection("aggregatedTableFromAllPlatforms");

      const pipeline = [
        {
          $match: { name: clientName },
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
        `Error in getClientFilteredData for client ${clientName}:`,
        error
      );
      throw error;
    }
  }

  static async getUniqueClients() {
    console.log("Getting unique client names...");
    const client = await getDb();
    if (!client) {
      console.error("Failed to connect to MongoDB");
      throw new Error("Failed to connect to MongoDB");
    }

    try {
      const collection = client.collection("aggregatedTableFromAllPlatforms");

      const result = await collection.distinct("email");
      console.log(result);

      return result.map((name) => ({ name }));
    } catch (error) {
      console.error("Error in getUniqueClients:", error);
      throw error;
    } finally {
      client.close();
    }
  }
}
export default AdminPageAggregatedRepo;
