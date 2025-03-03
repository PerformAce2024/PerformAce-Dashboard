import { connectToMongo } from "../config/db.js";
import { fetchAndStoreOutbrainCampaignData } from "../services/fetchAllOutbrainServices.js";

const validateDataStructure = (data) => {
  const requiredFields = [
    "startDate",
    "endDate",
    "campaignId",
    "last-used-rawdata-update-time",
    "last-used-rawdata-update-time-gmt-millisec",
    "timezone",
    "campaignPerformanceResult",
    "performanceByCountry",
    "performanceByOS",
    "performanceByBrowser",
    "performanceByRegion",
  ];

  const metricsFields = [
    "clicks",
    "impressions",
    "visible_impressions",
    "spent",
    "conversions_value",
    "roas",
    "roas_clicks",
    "roas_views",
    "ctr",
    "vctr",
    "cpm",
    "vcpm",
    "cpc",
    "campaigns_num",
    "cpa",
    "cpa_clicks",
    "cpa_views",
    "cpa_actions_num",
    "cpa_actions_num_from_clicks",
    "cpa_actions_num_from_views",
    "cpa_conversion_rate",
    "cpa_conversion_rate_clicks",
    "cpa_conversion_rate_views",
  ];

  const validation = {
    missingFields: [],
    invalidTypes: [],
    missingMetrics: [],
    formatErrors: [],
  };

  // Check required fields
  requiredFields.forEach((field) => {
    if (!(field in data)) {
      validation.missingFields.push(field);
    }
  });

  // Validate date formats
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(data.startDate)) {
    validation.formatErrors.push("Invalid startDate format");
  }
  if (!dateRegex.test(data.endDate)) {
    validation.formatErrors.push("Invalid endDate format");
  }

  // Validate timestamp format
  const timestampRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{1}$/;
  if (!timestampRegex.test(data["last-used-rawdata-update-time"])) {
    validation.formatErrors.push(
      "Invalid last-used-rawdata-update-time format"
    );
  }

  // Check performance results structure
  [
    "campaignPerformanceResult",
    "performanceByCountry",
    "performanceByOS",
    "performanceByBrowser",
    "performanceByRegion",
  ].forEach((metric) => {
    if (data[metric]) {
      if (!Array.isArray(data[metric].results)) {
        validation.invalidTypes.push(`${metric}.results is not an array`);
      }
      if (typeof data[metric].recordCount !== "number") {
        validation.invalidTypes.push(`${metric}.recordCount is not a number`);
      }
      if (!data[metric].metadata?.dateStored) {
        validation.missingFields.push(`${metric}.metadata.dateStored`);
      }
    }
  });

  // Check campaign performance metrics
  if (data.campaignPerformanceResult?.results?.[0]) {
    metricsFields.forEach((field) => {
      if (!(field in data.campaignPerformanceResult.results[0])) {
        validation.missingMetrics.push(field);
      }
    });
  }

  return validation;
};

const testOutbrainDataFormat = async () => {
  let client;
  try {
    console.log("Starting Outbrain data format test...");

    // Test parameters
    const campaignId = "53101339";
    const startDate = "2024-12-07";
    const endDate = "2024-12-07";

    // Store data
    console.log("Fetching and storing data...");
    await fetchAndStoreOutbrainCampaignData(campaignId, startDate, endDate);

    // Connect to MongoDB to verify
    client = await connectToMongo();
    const db = client.db("campaignAnalytics");
    const collection = db.collection("outbrainNewDataFormat");

    // Retrieve stored data
    const storedData = await collection.findOne({
      campaignId,
      startDate,
      endDate,
    });

    if (!storedData) {
      throw new Error("Data not found in database");
    }

    console.log("\nVerifying data structure...");
    const validationResults = validateDataStructure(storedData);

    // Print validation results
    console.log("\nValidation Results:");
    if (
      validationResults.missingFields.length === 0 &&
      validationResults.invalidTypes.length === 0 &&
      validationResults.missingMetrics.length === 0 &&
      validationResults.formatErrors.length === 0
    ) {
      console.log("✓ Data structure is valid");
      console.log("✓ All required fields present");
      console.log("✓ All data types are correct");
      console.log("✓ All metrics are present");
      console.log("✓ All date formats are valid");
    } else {
      console.log("\nValidation Errors:");
      if (validationResults.missingFields.length > 0) {
        console.log("Missing Fields:", validationResults.missingFields);
      }
      if (validationResults.invalidTypes.length > 0) {
        console.log("Invalid Types:", validationResults.invalidTypes);
      }
      if (validationResults.missingMetrics.length > 0) {
        console.log("Missing Metrics:", validationResults.missingMetrics);
      }
      if (validationResults.formatErrors.length > 0) {
        console.log("Format Errors:", validationResults.formatErrors);
      }
    }

    // Sample Data Preview
    console.log("\nData Sample:");
    const dataSample = {
      campaignId: storedData.campaignId,
      startDate: storedData.startDate,
      endDate: storedData.endDate,
      timezone: storedData.timezone,
      lastUpdate: storedData["last-used-rawdata-update-time"],
      recordCounts: {
        campaign: storedData.campaignPerformanceResult?.recordCount,
        country: storedData.performanceByCountry?.recordCount,
        os: storedData.performanceByOS?.recordCount,
        browser: storedData.performanceByBrowser?.recordCount,
        region: storedData.performanceByRegion?.recordCount,
      },
    };
    console.log(JSON.stringify(dataSample, null, 2));

    return {
      success: true,
      validation: validationResults,
      dataSample,
    };
  } catch (error) {
    console.error("Test failed:", error);
    throw error;
  } finally {
    if (client) {
      await client.close();
      console.log("\nMongoDB connection closed");
    }
  }
};

// Run test
console.log("Starting Outbrain format test...");
testOutbrainDataFormat()
  .then((result) => {
    console.log("\nTest execution completed.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nTest execution failed:", error);
    process.exit(1);
  });
