import fetch from 'node-fetch';  // Import the node-fetch library to make API calls
import dotenv from 'dotenv';     // Import dotenv to manage environment variables
dotenv.config(); // Load environment variables from .env file

const TABOOLA_BASE_URL = process.env.TABOOLA_API_BASE_URL;
const TABOOLA_AUTH_URL = process.env.TABOOLA_AUTH_URL;
const TABOOLA_CLIENT_ID = process.env.TABOOLA_CLIENT_ID;
const TABOOLA_CLIENT_SECRET = process.env.TABOOLA_CLIENT_SECRET;
const TABOOLA_ACCOUNT_ID = process.env.TABOOLA_ACCOUNT_ID;

// Log the loaded variables for debugging
console.log('Taboola Service initialized.');

// Global variable to store the token and its expiration time
let taboolaToken = null;
let tokenExpiryTime = null;

// Function to get API Token using client credentials
export const getTaboolaToken = async () => {
    try {
        console.log('Requesting token from:', TABOOLA_AUTH_URL);
        console.log('Client ID:', process.env.TABOOLA_CLIENT_ID);
        console.log('Client Secret:', process.env.TABOOLA_CLIENT_SECRET ? '******' : 'Not set');

        const response = await fetch(TABOOLA_AUTH_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: TABOOLA_CLIENT_ID,
                client_secret: TABOOLA_CLIENT_SECRET,
            }),
        });

        if (!response.ok) {
            console.error('Response Status:', response.status);
            console.error('Response Message:', response.statusText);
            const errorDetails = await response.text();
            console.error('Error Details:', errorDetails); // Log detailed error message
            throw new Error(`Error fetching token: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        taboolaToken = data.access_token;
        console.log('Access token is: ', taboolaToken);
        tokenExpiryTime = Date.now() + data.expires_in * 1000; // expires_in is in seconds
        console.log('Token expiry time is: ', tokenExpiryTime);

        return taboolaToken;
    } catch (error) {
        console.error('Error fetching API Token:', error.message);
        throw new Error('Failed to get API token.');
    }
};

// Function to get a valid API token (generate a new one if expired)
const getValidTaboolaToken = async () => {
    // Check if the token is still valid
    if (taboolaToken && Date.now() < tokenExpiryTime) {
        console.log('Using existing valid token.');
        return taboolaToken;
    }

    console.log('Token expired or missing. Fetching a new one...');
    // Otherwise, generate a new token
    return await getTaboolaToken();
};

// Function to make API requests to Taboola
const fetchTaboolaData = async (url, type) => {
    try {
        const token = await getValidTaboolaToken();
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            if (response.status === 401) {
                console.error('Authentication error. Please check your credentials.');
                throw new Error('Authentication failed.');
            }
            if (response.status === 404) {
                console.error(`Endpoint not found: ${url}`);
                throw new Error('Invalid API endpoint.');
            }
            console.error(`Unexpected error fetching ${type}: ${response.statusText}`);
            throw new Error(`Error fetching ${type}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Error fetching ${type}: ${error.message}`);
        throw new Error(`Unable to fetch ${type.toLowerCase()}.`);
    }
};

// Function to get Campaign Performance Result
export const getTaboolaCampaignPerformanceResult = async (campaignId, startDate, endDate) => {
    const requestUrl = `${TABOOLA_BASE_URL}${TABOOLA_ACCOUNT_ID}/reports/campaign-summary/dimensions/day?start_date=${startDate}&end_date=${endDate}&campaign=${campaignId}`;
    console.log('Request URL for campaign performance result:', requestUrl);
    return await fetchTaboolaData(requestUrl, 'Campaign Performance Result');
};

// Function to get performance by country
export const getTaboolaPerformanceByCountry = async (campaignId, startDate, endDate) => {
    const requestUrl = `${TABOOLA_BASE_URL}${TABOOLA_ACCOUNT_ID}/reports/campaign-summary/dimensions/country_breakdown?start_date=${startDate}&end_date=${endDate}&campaign=${campaignId}&include_multi_conversions=true`;
    console.log("Request URL for Country performance:", requestUrl);
    return await fetchTaboolaData(requestUrl, 'Performance by Country');
};

// Function to get performance by OS
export const getTaboolaPerformanceByOS = async (campaignId, startDate, endDate) => {
    const requestUrl = `${TABOOLA_BASE_URL}${TABOOLA_ACCOUNT_ID}/reports/campaign-summary/dimensions/os_family_breakdown?start_date=${startDate}&end_date=${endDate}&campaign=${campaignId}&include_multi_conversions=true`;
    console.log("Request URL for OS performance:", requestUrl);
    return await fetchTaboolaData(requestUrl, 'Performance by OS');
};

// Function to get performance by Browser
export const getTaboolaPerformanceByBrowser = async (campaignId, startDate, endDate) => {
    const requestUrl = `${TABOOLA_BASE_URL}${TABOOLA_ACCOUNT_ID}/reports/campaign-summary/dimensions/browser_breakdown?start_date=${startDate}&end_date=${endDate}&campaign=${campaignId}&include_multi_conversions=true`;
    console.log("Request URL for Browser performance:", requestUrl);
    return await fetchTaboolaData(requestUrl, 'Performance by Browser');
};

// Function to get performance by Region
export const getTaboolaPerformanceByRegion = async (campaignId, startDate, endDate) => {
    const requestUrl = `${TABOOLA_BASE_URL}${TABOOLA_ACCOUNT_ID}/reports/campaign-summary/dimensions/region_breakdown?start_date=${startDate}&end_date=${endDate}&campaign=${campaignId}&include_multi_conversions=true`;
    console.log("Request URL for Region performance:", requestUrl);
    return await fetchTaboolaData(requestUrl, 'Performance by Region');
};