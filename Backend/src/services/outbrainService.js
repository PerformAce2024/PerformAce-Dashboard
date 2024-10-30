// PerformAce-Dashboard/Backend/src/services/outbrainService.js

import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const OUTBRAIN_BASE_URL = process.env.OUTBRAIN_API_BASE_URL;
const OUTBRAIN_USERNAME = process.env.OUTBRAIN_USERNAME;
const OUTBRAIN_PASSWORD = process.env.OUTBRAIN_PASSWORD;
const OUTBRAIN_MARKETER_ID = process.env.OUTBRAIN_MARKETER_ID;

console.log("Outbrain Service initialized.");

// Global variable to store the token and its expiration time
let outbrainToken = null;
let tokenExpiryTime = null;

// Function to get API Token using Basic Authentication
export const getOutbrainToken = async () => {
    const authString = `${OUTBRAIN_USERNAME}:${OUTBRAIN_PASSWORD}`;
    const base64AuthString = Buffer.from(authString).toString('base64');

    try {
        console.log('Requesting Outbrain token...');

        const response = await fetch(`${OUTBRAIN_BASE_URL}/login`, {
            method: 'GET',
            headers: { Authorization: `Basic ${base64AuthString}` },
        });

        if (!response.ok) {
            console.error(`Failed to get token: ${response.status} - ${response.statusText}`);
            const errorDetails = await response.text();
            console.error('Error Details:', errorDetails);
            throw new Error(`Error fetching token: ${response.statusText}`);
        }

        const data = await response.json();
        outbrainToken = data['OB-TOKEN-V1'];
        console.log('Obtained Outbrain token:', outbrainToken);
        
        // Check token expiration from API if available, otherwise default to 1 hour
        tokenExpiryTime = Date.now() + (60 * 60 * 1000); // Assuming 1-hour expiry for Outbrain tokens

        return outbrainToken;
    } catch (error) {
        console.error('Error fetching Outbrain token:', error.message);
        throw new Error('Failed to obtain Outbrain token.');
    }
};

// Function to get a valid token (fetch a new one if expired)
const getValidOutbrainToken = async () => {
    if (outbrainToken && Date.now() < tokenExpiryTime) {
        console.log('Using cached Outbrain token.');
        return outbrainToken;
    }
    console.log('Outbrain token expired or missing. Fetching a new token...');
    return await getOutbrainToken();
};

// Helper function to make authenticated API requests to Outbrain
const fetchOutbrainData = async (url, description) => {
    try {
        const token = await getValidOutbrainToken();
        const response = await fetch(url, {
            method: 'GET',
            headers: { Authorization: `OB-TOKEN-V1 ${token}` },
        });

        if (!response.ok) {
            if (response.status === 401) {
                console.error('Authentication error. Refreshing token...');
                outbrainToken = null; // Invalidate token and fetch a new one next time
                throw new Error('Authentication failed. Please check credentials.');
            }
            if (response.status === 404) {
                console.error(`Endpoint not found: ${url}`);
                throw new Error('Invalid API endpoint.');
            }
            console.error(`Error fetching ${description}: ${response.statusText}`);
            throw new Error(`Error fetching ${description}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Error fetching ${description}: ${error.message}`);
        throw new Error(`Unable to fetch ${description.toLowerCase()}.`);
    }
};

// Functions to fetch specific Outbrain performance metrics

// Function to get Campaign Performance Result
export const getOutbrainCampaignPerformanceResult = async (campaignId, from, to) => {
    const requestUrl = `${OUTBRAIN_BASE_URL}/reports/marketers/${OUTBRAIN_MARKETER_ID}/periodic?from=${from}&to=${to}&campaignId=${campaignId}&breakdown=daily&limit=500`;
    console.log('Request URL for campaign performance result:', requestUrl);
    return await fetchOutbrainData(requestUrl, 'Campaign Performance Result');
};

// Function to get performance by country
export const getOutbrainPerformanceByCountry = async (campaignId, from, to) => {
    const requestUrl = `${OUTBRAIN_BASE_URL}/reports/marketers/${OUTBRAIN_MARKETER_ID}/geo?from=${from}&to=${to}&campaignId=${campaignId}&breakdown=country&limit=500`;
    console.log("Request URL for Country performance:", requestUrl);
    return await fetchOutbrainData(requestUrl, 'Performance by Country');
};

// Function to get performance by OS
export const getOutbrainPerformanceByOS = async (campaignId, from, to) => {
    const requestUrl = `${OUTBRAIN_BASE_URL}/reports/marketers/${OUTBRAIN_MARKETER_ID}/platforms?from=${from}&to=${to}&campaignId=${campaignId}&breakdown=os&limit=500`;
    console.log("Request URL for OS performance:", requestUrl);
    return await fetchOutbrainData(requestUrl, 'Performance by OS');
};

// Function to get performance by Browser
export const getOutbrainPerformanceByBrowser = async (campaignId, from, to) => {
    const requestUrl = `${OUTBRAIN_BASE_URL}/reports/marketers/${OUTBRAIN_MARKETER_ID}/platforms?from=${from}&to=${to}&campaignId=${campaignId}&breakdown=browser&limit=500`;
    console.log("Request URL for Browser performance:", requestUrl);
    return await fetchOutbrainData(requestUrl, 'Performance by Browser');
};

// Function to get performance by Region
export const getOutbrainPerformanceByRegion = async (campaignId, from, to) => {
    const requestUrl = `${OUTBRAIN_BASE_URL}/reports/marketers/${OUTBRAIN_MARKETER_ID}/geo?from=${from}&to=${to}&campaignId=${campaignId}&breakdown=region&limit=500`;
    console.log("Request URL for Region performance:", requestUrl);
    return await fetchOutbrainData(requestUrl, 'Performance by Region');
};

// Function to get performance by Domain
export const getOutbrainPerformanceByDomain = async (campaignId, from, to) => {
    const requestUrl = `${OUTBRAIN_BASE_URL}/reports/marketers/${OUTBRAIN_MARKETER_ID}/publishers?from=${from}&to=${to}&campaignId=${campaignId}&breakdown=domain&limit=500`;
    console.log("Request URL for Domain performance:", requestUrl);
    return await fetchOutbrainData(requestUrl, 'Performance by Domain');
};

// Function to get performance by Ads
export const getOutbrainPerformanceByAds = async (campaignId, from, to) => {
    const requestUrl = `${OUTBRAIN_BASE_URL}/reports/marketers/${OUTBRAIN_MARKETER_ID}/promotedContent?from=${from}&to=${to}&campaignId=${campaignId}&breakdown=ad&limit=500`;
    console.log("Request URL for Ads performance:", requestUrl);
    return await fetchOutbrainData(requestUrl, 'Performance by Ads');
};
