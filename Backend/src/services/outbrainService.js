import fetch from "node-fetch";
// Environment variablesOUTBRAIN_API_BASE_URL
const OUTBRAIN_BASE_URL = process.env.OUTBRAIN_API_BASE_URL?.trim();
const OUTBRAIN_MARKETER_ID = process.env.OUTBRAIN_MARKETER_ID?.trim();
const OUTBRAIN_TOKEN = process.env.OUTBRAIN_TOKEN?.trim();
// [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("api@performacemedia.com:API@$#@!"))

// Validation check for required environment variables

if (!OUTBRAIN_BASE_URL || !OUTBRAIN_MARKETER_ID || !OUTBRAIN_TOKEN) {
  throw new Error(
    "Missing required environment variables for Outbrain service"
  );
}

const fetchOutbrainData = async (url, description) => {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "OB-TOKEN-V1": OUTBRAIN_TOKEN,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to fetch ${description}: ${response.status} - ${errorText}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching ${description}:`, error.message);
    throw error;
  }
};

export const getOutbrainCampaignPerformanceResult = async (
  campaignId,
  from,
  to
) => {
  const url = `${OUTBRAIN_BASE_URL}/reports/marketers/${OUTBRAIN_MARKETER_ID}/periodic?from=${from}&to=${to}&campaignId=${campaignId}&breakdown=daily&limit=500`;
  return await fetchOutbrainData(url, "Campaign Performance Result");
};

export const getOutbrainPerformanceByCountry = async (campaignId, from, to) => {
  const url = `${OUTBRAIN_BASE_URL}/reports/marketers/${OUTBRAIN_MARKETER_ID}/geo?from=${from}&to=${to}&campaignId=${campaignId}&breakdown=country&limit=500`;
  return await fetchOutbrainData(url, "Performance by Country");
};

export const getOutbrainPerformanceByOS = async (campaignId, from, to) => {
  const url = `${OUTBRAIN_BASE_URL}/reports/marketers/${OUTBRAIN_MARKETER_ID}/platforms?from=${from}&to=${to}&campaignId=${campaignId}&breakdown=os&limit=500`;
  return await fetchOutbrainData(url, "Performance by OS");
};

export const getOutbrainPerformanceByBrowser = async (campaignId, from, to) => {
  const url = `${OUTBRAIN_BASE_URL}/reports/marketers/${OUTBRAIN_MARKETER_ID}/platforms?from=${from}&to=${to}&campaignId=${campaignId}&breakdown=browser&limit=500`;
  return await fetchOutbrainData(url, "Performance by Browser");
};

export const getOutbrainPerformanceByRegion = async (campaignId, from, to) => {
  const url = `${OUTBRAIN_BASE_URL}/reports/marketers/${OUTBRAIN_MARKETER_ID}/geo?from=${from}&to=${to}&campaignId=${campaignId}&breakdown=region&limit=500`;
  return await fetchOutbrainData(url, "Performance by Region");
};

export const getOutbrainPerformanceByDomain = async (campaignId, from, to) => {
  const url = `${OUTBRAIN_BASE_URL}/reports/marketers/${OUTBRAIN_MARKETER_ID}/publishers?from=${from}&to=${to}&campaignId=${campaignId}&breakdown=domain&limit=500`;
  return await fetchOutbrainData(url, "Performance by Domain");
};

export const getOutbrainPerformanceByAds = async (campaignId, from, to) => {
  const url = `${OUTBRAIN_BASE_URL}/reports/marketers/${OUTBRAIN_MARKETER_ID}/promotedContent?from=${from}&to=${to}&campaignId=${campaignId}&breakdown=ad&limit=500`;
  return await fetchOutbrainData(url, "Performance by Ads");
};
