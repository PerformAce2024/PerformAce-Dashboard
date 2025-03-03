import fetch from "node-fetch";

import { Buffer } from "buffer";

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
        // Removed client_id and client_secret from body as they're now in the Authorization header
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

const fetchDspOutbrainData = async (url, type) => {
  try {
    const token = await getValidDspOutbrainToken();
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Api-Policy": "strict",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error(`Error response for ${type}:`, await response.text());
      throw new Error(`Error fetching ${type}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${type}:`, error.message);
    throw new Error(`Unable to fetch ${type.toLowerCase()}.`);
  }
};
export const getDspOutbrainCampaignPerformanceResult = async (
  campaignId,
  from,
  to
) => {
  const url = `${OUTBRAIN_DSP_API_BASE_URL}/rest/v1/campaigns/${campaignId}/stats/?from=${from}&to=${to}`;
  return await fetchDspOutbrainData(url, "Campaign Performance Result");
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
