const TABOOLA_BASE_URL = process.env.TABOOLA_API_BASE_URL;
const TABOOLA_AUTH_URL = process.env.TABOOLA_AUTH_URL;
const TABOOLA_CLIENT_ID = process.env.TABOOLA_CLIENT_ID;
const TABOOLA_CLIENT_SECRET = process.env.TABOOLA_CLIENT_SECRET;
const TABOOLA_ACCOUNT_ID = process.env.TABOOLA_ACCOUNT_ID;

let taboolaToken = null;
let tokenExpiryTime = null;

export const getTaboolaToken = async () => {
  try {
    const response = await fetch(TABOOLA_AUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: TABOOLA_CLIENT_ID,
        client_secret: TABOOLA_CLIENT_SECRET,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Error fetching token: ${response.status} - ${response.statusText}`
      );
    }

    const data = await response.json();
    taboolaToken = data.access_token;
    tokenExpiryTime = Date.now() + data.expires_in * 1000;
    return taboolaToken;
  } catch (error) {
    console.error("Error fetching API Token:", error.message);
    throw new Error("Failed to get API token.");
  }
};

const getValidTaboolaToken = async () => {
  if (taboolaToken && Date.now() < tokenExpiryTime) {
    return taboolaToken;
  }
  return await getTaboolaToken();
};

const fetchTaboolaData = async (url, type) => {
  try {
    const token = await getValidTaboolaToken();
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
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

export const getTaboolaCampaignPerformanceResult = async (
  campaignId,
  startDate,
  endDate
) => {
  const requestUrl = `${TABOOLA_BASE_URL}${TABOOLA_ACCOUNT_ID}/reports/campaign-summary/dimensions/day?start_date=${startDate}&end_date=${endDate}&campaign=${campaignId}`;
  return await fetchTaboolaData(requestUrl, "Campaign Performance Result");
};

export const getTaboolaPerformanceByCountry = async (
  campaignId,
  startDate,
  endDate
) => {
  const requestUrl = `${TABOOLA_BASE_URL}${TABOOLA_ACCOUNT_ID}/reports/campaign-summary/dimensions/country_breakdown?start_date=${startDate}&end_date=${endDate}&campaign=${campaignId}&include_multi_conversions=true`;
  return await fetchTaboolaData(requestUrl, "Performance by Country");
};

export const getTaboolaPerformanceByOS = async (
  campaignId,
  startDate,
  endDate
) => {
  const requestUrl = `${TABOOLA_BASE_URL}${TABOOLA_ACCOUNT_ID}/reports/campaign-summary/dimensions/os_family_breakdown?start_date=${startDate}&end_date=${endDate}&campaign=${campaignId}&include_multi_conversions=true`;
  return await fetchTaboolaData(requestUrl, "Performance by OS");
};

export const getTaboolaPerformanceByBrowser = async (
  campaignId,
  startDate,
  endDate
) => {
  const requestUrl = `${TABOOLA_BASE_URL}${TABOOLA_ACCOUNT_ID}/reports/campaign-summary/dimensions/browser_breakdown?start_date=${startDate}&end_date=${endDate}&campaign=${campaignId}&include_multi_conversions=true`;
  return await fetchTaboolaData(requestUrl, "Performance by Browser");
};

export const getTaboolaPerformanceByRegion = async (
  campaignId,
  startDate,
  endDate
) => {
  const requestUrl = `${TABOOLA_BASE_URL}${TABOOLA_ACCOUNT_ID}/reports/campaign-summary/dimensions/region_breakdown?start_date=${startDate}&end_date=${endDate}&campaign=${campaignId}&include_multi_conversions=true`;
  return await fetchTaboolaData(requestUrl, "Performance by Region");
};

export const getTaboolaPerformanceBySite = async (
  campaignId,
  startDate,
  endDate
) => {
  const requestUrl = `${TABOOLA_BASE_URL}${TABOOLA_ACCOUNT_ID}/reports/campaign-summary/dimensions/site_breakdown?start_date=${startDate}&end_date=${endDate}${
    campaignId ? `&campaign=${campaignId}` : ""
  }&include_multi_conversions=true&exclude_empty_campaigns=true`;
  console.log("Request URL for site performance:", requestUrl);
  return await fetchTaboolaData(requestUrl, "Performance by Site");
};
