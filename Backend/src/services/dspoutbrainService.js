import fetch from "node-fetch";
import { Buffer } from "buffer";
import csv from "csvtojson";

// Environment variables
const OUTBRAIN_DSP_API_BASE_URL = process.env.OUTBRAIN_DSP_API_BASE_URL?.trim();
const OUTBRAIN_DSP_CLIENT_ID = process.env.OUTBRAIN_DSP_CLIENT_ID;
const OUTBRAIN_DSP_CLIENT_SECRET = process.env.OUTBRAIN_DSP_CLIENT_SECRET;

// Validation check for required environment variables
if (
  !OUTBRAIN_DSP_API_BASE_URL |
  !OUTBRAIN_DSP_CLIENT_ID |
  !OUTBRAIN_DSP_CLIENT_SECRET
) {
  throw new Error(
    "Missing required environment variables for Outbrain service"
  );
}
let dspoutbrainToken = null;
let tokenExpiryTime = null;
export const getDspOutbrainToken = async () => {
  try {
    // Create Basic auth credentials by encoding client_id:client_secret in base64
    const basicAuth = Buffer.from(
      `${OUTBRAIN_DSP_CLIENT_ID}:${OUTBRAIN_DSP_CLIENT_SECRET}`
    ).toString("base64");
    const response = await fetch(`${OUTBRAIN_DSP_API_BASE_URL}/o/token/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Error fetching token: ${response.status} - ${response.statusText}`
      );
    }

    const data = await response.json();
    dspoutbrainToken = data.access_token;
    tokenExpiryTime = Date.now() + data.expires_in * 1000;
    return dspoutbrainToken;
  } catch (error) {
    console.error("Error fetching API Token:", error.message);
    throw new Error("Failed to get API token.");
  }
};

const getValidDspOutbrainToken = async () => {
  if (dspoutbrainToken && Date.now() < tokenExpiryTime) {
    return dspoutbrainToken;
  }
  return await getDspOutbrainToken();
};

const submitDspOutbrainReportJob = async (
  campaignId,
  fromDate,
  toDate,
  breakdownField
) => {
  try {
    const token = await getValidDspOutbrainToken();
    const requestBody = {
      fields: [
        { field: "Campaign Id" },
        { field: "Campaign" },
        { field: breakdownField },
        { field: "Impressions" },
        { field: "Clicks" },
        { field: "CTR" },
        { field: "Total Spend" },
        { field: "Campaign Status" },
        { field: "Viewable Impressions" },
        { field: "Avg. CPC" },
        { field: "Avg. CPM" },
      ],
      filters: [
        {
          field: "Campaign Id",
          operator: "=",
          value: campaignId,
        },
        {
          field: "Date",
          operator: "between",
          from: fromDate,
          to: toDate,
        },
      ],
      options: {
        showArchived: true,
      },
    };

    const response = await fetch(
      `${OUTBRAIN_DSP_API_BASE_URL}/rest/v1/reports/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Api-Policy": "strict",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      console.error(`Error response for ${type}:`, await response.text());
      throw new Error(`Error fetching ${type}: ${response.statusText}`);
    }
    const data = await response.json();
    return data.data.id;
  } catch (error) {
    console.error("Error submitting report job:", error.message);
    throw new Error("Unable to submit report job.");
  }
};

export const checkDspOutbrainReportStatus = async (jobId) => {
  try {
    const token = await getValidDspOutbrainToken();
    const response = await fetch(
      `${OUTBRAIN_DSP_API_BASE_URL}/rest/v1/reports/${jobId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Api-Policy": "strict",
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error(
        "Error response for job status check:",
        await response.text()
      );
      throw new Error(`Error checking job status: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error checking report job status:", error.message);
    throw new Error("Unable to check report job status.");
  }
};

export const downloadAndParseCsvReport = async (csvUrl) => {
  try {
    const response = await fetch(csvUrl, {
      method: "GET",
    });
    console.log(response, "This is csv response");

    if (!response.ok) {
      console.error("Error response for CSV download:", await response.text());
      throw new Error(`Error downloading CSV: ${response.statusText}`);
    }

    const csvText = await response.text();
    console.log(csvText, "this is csv text");

    // Parse the CSV data to JSON
    const records = await csv().fromString(csvText);
    const fieldsToRemove = ["campaignId", "campaignName"];
    const cleanedRecords = records.map((record) => {
      fieldsToRemove.forEach((field) => {
        delete record[field];
      });
      return record;
    });

    console.log(cleanedRecords, "These are the records");
    return cleanedRecords;
  } catch (error) {
    console.error("Error downloading or parsing CSV:", error.message);
    throw new Error("Unable to download or parse the report data.");
  }
};

export const getDspOutbrainBreakdownReport = async (
  campaignId,
  fromDate,
  toDate,
  breakdownField,
  maxAttempts = 30,
  pollingInterval = 2000
) => {
  try {
    // 1. Submit the report job
    const jobId = await submitDspOutbrainReportJob(
      campaignId,
      fromDate,
      toDate,
      breakdownField
    );
    console.log(`Report job submitted with ID: ${jobId}`);

    // 2. Poll for job completion
    let attempts = 0;
    let jobStatus;

    while (attempts < maxAttempts) {
      jobStatus = await checkDspOutbrainReportStatus(jobId);

      if (jobStatus.data.status === "DONE") {
        console.log(
          `Report job completed successfully after ${attempts + 1} attempts`
        );
        break;
      } else if (jobStatus.data.status === "FAILED") {
        throw new Error(`Report job failed: ${JSON.stringify(jobStatus)}`);
      }

      console.log(`Job status: ${jobStatus.data.status}, waiting...`);
      await new Promise((resolve) => setTimeout(resolve, pollingInterval)); // Using setTimeout for sleep
      attempts++;
    }

    if (attempts >= maxAttempts) {
      throw new Error(
        `Report generation timed out after ${maxAttempts} attempts`
      );
    }

    const csvUrl = jobStatus.data.result;
    return await downloadAndParseCsvReport(csvUrl);
  } catch (error) {
    console.error("Error getting breakdown report:", error.message);
    throw new Error(
      `Failed to get ${breakdownField} breakdown report: ${error.message}`
    );
  }
};

export const getDspOutbrainRegionBreakdownReport = async (
  campaignId,
  fromDate,
  toDate
) => {
  return getDspOutbrainBreakdownReport(
    campaignId,
    fromDate,
    toDate,
    "State / Region"
  );
};

export const getDspOutbrainPublisherBreakdownReport = async (
  campaignId,
  fromDate,
  toDate
) => {
  return getDspOutbrainBreakdownReport(
    campaignId,
    fromDate,
    toDate,
    "Publisher"
  );
};

export const getDspOutbrainDeviceBreakdownReport = async (
  campaignId,
  fromDate,
  toDate
) => {
  return getDspOutbrainBreakdownReport(campaignId, fromDate, toDate, "Device");
};

export const getDspOutbrainOSBreakdownReport = async (
  campaignId,
  fromDate,
  toDate
) => {
  return getDspOutbrainBreakdownReport(
    campaignId,
    fromDate,
    toDate,
    "Operating System"
  );
};

export const getDspOutbrainCampaignPerformanceResult = async (
  campaignId,
  fromDate,
  toDate
) => {
  try {
    const token = await getValidDspOutbrainToken();
    const requestBody = {
      fields: [
        { field: "Campaign Id" },
        { field: "Campaign" },
        { field: "Impressions" },
        { field: "Clicks" },
        { field: "CTR" },
        { field: "Total Spend" },
        { field: "Campaign Status" },
        { field: "Viewable Impressions" },
        { field: "Avg. CPC" },
        { field: "Avg. CPM" },
      ],
      filters: [
        {
          field: "Campaign Id",
          operator: "=",
          value: campaignId,
        },
        {
          field: "Date",
          operator: "between",
          from: fromDate,
          to: toDate,
        },
      ],
      options: {
        showArchived: true,
      },
    };

    const response = await fetch(
      `${OUTBRAIN_DSP_API_BASE_URL}/rest/v1/reports/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Api-Policy": "strict",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      console.error(
        `Error response for campaign performance:`,
        await response.text()
      );
      throw new Error(
        `Error fetching campaign performance: ${response.statusText}`
      );
    }

    // Get the job ID from the response
    const data = await response.json();
    const jobId = data.data.id;

    // Poll for job completion
    let attempts = 0;
    const maxAttempts = 30;
    const pollingInterval = 2000;
    let jobStatus;

    while (attempts < maxAttempts) {
      jobStatus = await checkDspOutbrainReportStatus(jobId);

      if (jobStatus.data.status === "DONE") {
        console.log(
          `Campaign performance report completed successfully after ${
            attempts + 1
          } attempts`
        );
        break;
      } else if (jobStatus.data.status === "FAILED") {
        throw new Error(
          `Campaign performance report failed: ${JSON.stringify(jobStatus)}`
        );
      }

      console.log(`Job status: ${jobStatus.data.status}, waiting...`);
      await new Promise((resolve) => setTimeout(resolve, pollingInterval)); // Using setTimeout for sleep
      attempts++;
    }

    if (attempts >= maxAttempts) {
      throw new Error(
        `Report generation timed out after ${maxAttempts} attempts`
      );
    }

    // Download and parse the CSV
    const csvUrl = jobStatus.data.result;
    return await downloadAndParseCsvReport(csvUrl);
  } catch (error) {
    console.error("Error getting campaign performance report:", error.message);
    throw new Error(
      `Failed to get campaign performance report: ${error.message}`
    );
  }
};

export const processDspOutbrainCampaign = async (
  campaignId,
  startDate,
  endDate
) => {
  try {
    console.log(
      `Processing DSP Outbrain campaign ${campaignId} for date range ${startDate} to ${endDate}`
    );

    // 1. Get the basic campaign performance data
    const campaignResults = await getDspOutbrainCampaignPerformanceResult(
      campaignId,
      startDate,
      endDate
    );
    console.log("Campaign performance data fetched successfully");

    // 2. Get breakdown data in parallel
    const [regionData, publisherData, deviceData, osData] = await Promise.all([
      getDspOutbrainRegionBreakdownReport(campaignId, startDate, endDate),
      getDspOutbrainPublisherBreakdownReport(campaignId, startDate, endDate),
      getDspOutbrainDeviceBreakdownReport(campaignId, startDate, endDate),
      getDspOutbrainOSBreakdownReport(campaignId, startDate, endDate),
    ]);

    console.log("All breakdown reports fetched successfully");

    // 3. Prepare the complete data object
    const completeData = {
      campaignId,
      startDate,
      endDate,
      campaignPerformanceResult: campaignResults,
      performanceByRegion: regionData,
      performanceByPublisher: publisherData,
      performanceByDevice: deviceData,
      performanceByOS: osData,
      dateStored: new Date(),
    };

    return completeData;
  } catch (error) {
    console.error("Error processing DSP Outbrain campaign:", error);
    throw new Error(
      `Failed to process DSP Outbrain campaign: ${error.message}`
    );
  }
};
