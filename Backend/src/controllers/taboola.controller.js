import {
    getTaboolaCampaignPerformanceResult,
    getTaboolaPerformanceByCountry,
    getTaboolaPerformanceByOS,
    getTaboolaPerformanceByBrowser,
    getTaboolaPerformanceByRegion,
    // getTaboolaPerformanceByDomain,
    // getTaboolaPerformanceByAds,
} from '../services/taboolaService.js';

// Controller to get campaign performance
export const fetchCampaignPerformance = async (req, res) => {
    console.log('Received query parameters:', req.query);

    const { campaignId, startDate, endDate } = req.query;

    // Validate that all required parameters are present
    if (!campaignId || !startDate || !endDate) {
        return res.status(400).json({ message: 'Missing required parameters: campaignId, startDate, or endDate' });
    }

    try {
        const result = await getTaboolaCampaignPerformanceResult(campaignId, startDate, endDate);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Controller to get performance by country
export const fetchPerformanceByCountry = async (req, res) => {
    const { campaignId, startDate, endDate } = req.query;
    try {
        const countryPerformanceData = await getTaboolaPerformanceByCountry(campaignId, startDate, endDate);
        res.json(countryPerformanceData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Controller to get performance by os
export const fetchPerformanceByOS = async (req, res) => {
    const { campaignId, startDate, endDate } = req.query;
    try {
        const osPerformanceData = await getTaboolaPerformanceByOS(campaignId, startDate, endDate);
        res.json(osPerformanceData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Controller to get performance by browser
export const fetchPerformanceByBrowser = async (req, res) => {
    const { campaignId, startDate, endDate } = req.query;
    try {
        const browserPerformanceData = await getTaboolaPerformanceByBrowser(campaignId, startDate, endDate);
        res.json(browserPerformanceData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Controller to get performance by region
export const fetchPerformanceByRegion = async (req, res) => {
    const { campaignId, startDate, endDate } = req.query;
    try {
        const regionPerformanceData = await getTaboolaPerformanceByRegion(campaignId, startDate, endDate);
        res.json(regionPerformanceData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Controller to get performance by domain
export const fetchPerformanceByDomain = async (req, res) => {
    const { campaignId, startDate, endDate } = req.query;
    try {
        const domainPerformanceData = await getTaboolaPerformanceByDomain(campaignId, startDate, endDate);
        res.json(domainPerformanceData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Controller to get performance by Ads
export const fetchPerformanceByAds = async (req, res) => {
    const { campaignId, startDate, endDate } = req.query;
    try {
        const adsPerformanceData = await getTaboolaPerformanceByAds(campaignId, startDate, endDate);
        res.json(adsPerformanceData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};