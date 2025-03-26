import { getDb } from "../config/db.js";
import {
  storeDailyMetricsForClient,
  getClientDailyMetrics,
} from "../services/campaignDailyMetricsService.js";

async function testClientDailyMetrics() {
  try {
    const clientEmail = "agarwal11srishti@gmail.com";
    const startDate = "2024-11-10";
    const endDate = "2024-11-13";

    // First, verify data exists in source collections
    const client = await getDb();

    const clientExists = await client
      .collection("clients")
      .findOne({ email: clientEmail });
    if (!clientExists) {
      throw new Error("Test client not found in database");
    }

    const releaseOrders = await client
      .collection("releaseOrders")
      .find({ clientEmail: { $in: [clientEmail] } })
      .toArray();
    console.log(`Found ${releaseOrders.length} release orders`);

    for (const ro of releaseOrders) {
      const campaigns = await db
        .collection("campaigns")
        .find({ roName: ro.roNumber })
        .toArray();
      console.log(`RO ${ro.roNumber} has ${campaigns.length} campaigns`);

      for (const campaign of campaigns) {
        const [taboolaData, outbrainData] = await Promise.all([
          db
            .collection("taboolaData")
            .findOne({ campaignId: campaign.campaignId }),
          db
            .collection("outbrainNewDataFormat")
            .findOne({ campaignId: campaign.campaignId }),
        ]);
        console.log(`Campaign ${campaign.campaignId}:`, {
          hasTaboola: !!taboolaData,
          hasOutbrain: !!outbrainData,
        });
      }
    }

    // Store metrics
    const storedData = await storeDailyMetricsForClient(
      clientEmail,
      startDate,
      endDate
    );
    console.log("Stored data:", JSON.stringify(storedData, null, 2));

    // Verify structure
    if (!storedData.dailyMetrics || !Array.isArray(storedData.dailyMetrics)) {
      throw new Error(
        "Invalid data structure: dailyMetrics missing or not an array"
      );
    }

    // Retrieve and compare
    const retrievedData = await getClientDailyMetrics(
      clientEmail,
      startDate,
      endDate
    );

    const match = JSON.stringify(storedData) === JSON.stringify(retrievedData);
    console.log(`Data verification: ${match ? "PASSED ✓" : "FAILED ✗"}`);

    if (!match) {
      console.log("Differences found:");
      console.log("Stored:", JSON.stringify(storedData, null, 2));
      console.log("Retrieved:", JSON.stringify(retrievedData, null, 2));
    }
  } catch (error) {
    console.error("Test failed:", error.message);
    console.error(error.stack);
  }
}

testClientDailyMetrics();
