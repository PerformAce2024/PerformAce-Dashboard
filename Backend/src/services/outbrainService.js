import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const OUTBRAIN_BASE_URL = process.env.OUTBRAIN_API_BASE_URL?.trim();
const OUTBRAIN_MARKETER_ID = process.env.OUTBRAIN_MARKETER_ID?.trim();

// Static token from your provided value
const OUTBRAIN_TOKEN = 'MTczMTM4OTY0NjkyMzoyOGNkZDg4MGM2NDI4NTAwYTJlYzBkNWFmZTUzNWM0NmY1N2IzMDY5M2ZmZTNiZjAwY2Q0ZGRjYzgxYjNlNzAyOnsiY2FsbGVyQXBwbGljYXRpb24iOiJBbWVsaWEiLCJpcEFkZHJlc3MiOiIvMTAuMjEyLjQ0LjEwNDozNTc1OCIsImJ5cGFzc0FwaUF1dGgiOiJmYWxzZSIsInVzZXJOYW1lIjoiQXBpQHBlcmZvcm1hY2VtZWRpYS5jb20iLCJ1c2VySWQiOiIxMDc5NDE5NSIsImRhdGFTb3VyY2VUeXBlIjoiTVlfT0JfQ09NIn06YTkxNWQ3ZDgzOTgwODI4ZjRmMzNlYzAyYmEwMzY5NDk5NzJkYjFhMTViNzhkZTk0YTU5ZTk3ZTNkNTNiMzdhNTFhYzdhOGFiYjcyZWVjYzdjZjg0NWM2YWU3MDY0MTI5YmE5NGVhYjM2M2FhMzA4NmRkZDI4YWMwMDJhNjQ1M2E=';

const fetchOutbrainData = async (url, description) => {
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'OB-TOKEN-V1': OUTBRAIN_TOKEN,
                'Accept': 'application/json'
            }
        });

        console.log('Request Headers:', {
            'OB-TOKEN-V1': base64AuthString,
        });
        console.log('Login URL:', OUTBRAIN_LOGIN_URL);

        const responseBody = await response.text();
        console.log('Token Fetch Response:', responseBody);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch ${description}: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error fetching ${description}:`, error.message);
        throw error;
    }
};

// API endpoint functions matching the schema
export const getOutbrainCampaignPerformanceResult = async (campaignId, from, to) => {
    try {
        const url = `${OUTBRAIN_BASE_URL}/reports/marketers/${OUTBRAIN_MARKETER_ID}/periodic?from=${from}&to=${to}&campaignId=${campaignId}&breakdown=daily&limit=500`;
        const result = await fetchOutbrainData(url, 'Campaign Performance Result');
        return result;
    } catch (error) {
        console.error('Error in getOutbrainCampaignPerformanceResult:', error);
        throw error;
    }
};

export const getOutbrainPerformanceByCountry = async (campaignId, from, to) => {
    try {
        const url = `${OUTBRAIN_BASE_URL}/reports/marketers/${OUTBRAIN_MARKETER_ID}/geo?from=${from}&to=${to}&campaignId=${campaignId}&breakdown=country&limit=500`;
        const result = await fetchOutbrainData(url, 'Performance by Country');
        return result;
    } catch (error) {
        console.error('Error in getOutbrainPerformanceByCountry:', error);
        throw error;
    }
};

export const getOutbrainPerformanceByOS = async (campaignId, from, to) => {
    try {
        const url = `${OUTBRAIN_BASE_URL}/reports/marketers/${OUTBRAIN_MARKETER_ID}/platforms?from=${from}&to=${to}&campaignId=${campaignId}&breakdown=os&limit=500`;
        const result = await fetchOutbrainData(url, 'Performance by OS');
        return result;
    } catch (error) {
        console.error('Error in getOutbrainPerformanceByOS:', error);
        throw error;
    }
};

export const getOutbrainPerformanceByBrowser = async (campaignId, from, to) => {
    try {
        const url = `${OUTBRAIN_BASE_URL}/reports/marketers/${OUTBRAIN_MARKETER_ID}/platforms?from=${from}&to=${to}&campaignId=${campaignId}&breakdown=browser&limit=500`;
        const result = await fetchOutbrainData(url, 'Performance by Browser');
        return result;
    } catch (error) {
        console.error('Error in getOutbrainPerformanceByBrowser:', error);
        throw error;
    }
};

export const getOutbrainPerformanceByRegion = async (campaignId, from, to) => {
    try {
        const url = `${OUTBRAIN_BASE_URL}/reports/marketers/${OUTBRAIN_MARKETER_ID}/geo?from=${from}&to=${to}&campaignId=${campaignId}&breakdown=region&limit=500`;
        const result = await fetchOutbrainData(url, 'Performance by Region');
        return result;
    } catch (error) {
        console.error('Error in getOutbrainPerformanceByRegion:', error);
        throw error;
    }
};

export const getOutbrainPerformanceByDomain = async (campaignId, from, to) => {
    try {
        const url = `${OUTBRAIN_BASE_URL}/reports/marketers/${OUTBRAIN_MARKETER_ID}/publishers?from=${from}&to=${to}&campaignId=${campaignId}&breakdown=domain&limit=500`;
        const result = await fetchOutbrainData(url, 'Performance by Domain');
        return result;
    } catch (error) {
        console.error('Error in getOutbrainPerformanceByDomain:', error);
        throw error;
    }
};

export const getOutbrainPerformanceByAds = async (campaignId, from, to) => {
    try {
        const url = `${OUTBRAIN_BASE_URL}/reports/marketers/${OUTBRAIN_MARKETER_ID}/promotedContent?from=${from}&to=${to}&campaignId=${campaignId}&breakdown=ad&limit=500`;
        const result = await fetchOutbrainData(url, 'Performance by Ads');
        return result;
    } catch (error) {
        console.error('Error in getOutbrainPerformanceByAds:', error);
        throw error;
    }
};