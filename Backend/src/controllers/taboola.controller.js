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
    console.log('GET /campaign-performance request received');
    console.log('Received query parameters:', req.query);

    const { campaignId, startDate, endDate } = req.query;

    // Validate required parameters
    if (!campaignId || !startDate || !endDate) {
        console.error('Missing required parameters: campaignId, startDate, or endDate');
        return res.status(400).json({ message: 'Missing required parameters: campaignId, startDate, or endDate' });
    }

    try {
        console.log(`Fetching campaign performance for campaignId: ${campaignId}`);
        const result = await getTaboolaCampaignPerformanceResult(campaignId, startDate, endDate);
        console.log('Campaign performance fetched successfully');
        res.json(result);
    } catch (error) {
        console.error('Error fetching campaign performance:', error);
        res.status(500).json({ message: error.message });
    }
};

// Controller to get performance by country
export const fetchPerformanceByCountry = async (req, res) => {
    console.log('GET /performance-country request received');
    const { campaignId, startDate, endDate } = req.query;

    try {
        console.log(`Fetching performance by country for campaignId: ${campaignId}`);
        const countryPerformanceData = await getTaboolaPerformanceByCountry(campaignId, startDate, endDate);
        console.log('Country performance fetched successfully');
        res.json(countryPerformanceData);
    } catch (error) {
        console.error('Error fetching performance by country:', error);
        res.status(500).json({ message: error.message });
    }
};

// Controller to get performance by OS
export const fetchPerformanceByOS = async (req, res) => {
    console.log('GET /performance-os request received');
    const { campaignId, startDate, endDate } = req.query;

    try {
        console.log(`Fetching performance by OS for campaignId: ${campaignId}`);
        const osPerformanceData = await getTaboolaPerformanceByOS(campaignId, startDate, endDate);
        console.log('OS performance fetched successfully');
        res.json(osPerformanceData);
    } catch (error) {
        console.error('Error fetching performance by OS:', error);
        res.status(500).json({ message: error.message });
    }
};

// Controller to get performance by browser
export const fetchPerformanceByBrowser = async (req, res) => {
    console.log('GET /performance-browser request received');
    const { campaignId, startDate, endDate } = req.query;

    try {
        console.log(`Fetching performance by browser for campaignId: ${campaignId}`);
        const browserPerformanceData = await getTaboolaPerformanceByBrowser(campaignId, startDate, endDate);
        console.log('Browser performance fetched successfully');
        res.json(browserPerformanceData);
    } catch (error) {
        console.error('Error fetching performance by browser:', error);
        res.status(500).json({ message: error.message });
    }
};

// Controller to get performance by region
export const fetchPerformanceByRegion = async (req, res) => {
    console.log('GET /performance-region request received');
    const { campaignId, startDate, endDate } = req.query;

    try {
        console.log(`Fetching performance by region for campaignId: ${campaignId}`);
        const regionPerformanceData = await getTaboolaPerformanceByRegion(campaignId, startDate, endDate);
        console.log('Region performance fetched successfully');
        res.json(regionPerformanceData);
    } catch (error) {
        console.error('Error fetching performance by region:', error);
        res.status(500).json({ message: error.message });
    }
};

// // Controller to get performance by domain
// export const fetchPerformanceByDomain = async (req, res) => {
//     console.log('GET /performance-domain request received');
//     const { campaignId, startDate, endDate } = req.query;

//     try {
//         console.log(`Fetching performance by domain for campaignId: ${campaignId}`);
//         const domainPerformanceData = await getTaboolaPerformanceByDomain(campaignId, startDate, endDate);
//         console.log('Domain performance fetched successfully');
//         res.json(domainPerformanceData);
//     } catch (error) {
//         console.error('Error fetching performance by domain:', error);
//         res.status(500).json({ message: error.message });
//     }
// };

// // Controller to get performance by Ads
// export const fetchPerformanceByAds = async (req, res) => {
//     console.log('GET /performance-ads request received');
//     const { campaignId, startDate, endDate } = req.query;

//     try {
//         console.log(`Fetching performance by Ads for campaignId: ${campaignId}`);
//         const adsPerformanceData = await getTaboolaPerformanceByAds(campaignId, startDate, endDate);
//         console.log('Ads performance fetched successfully');
//         res.json(adsPerformanceData);
//     } catch (error) {
//         console.error('Error fetching performance by Ads:', error);
//         res.status(500).json({ message: error.message });
//     }
// };