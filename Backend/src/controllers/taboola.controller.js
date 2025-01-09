import {
    getTaboolaCampaignPerformanceResult,
    getTaboolaPerformanceByCountry,
    getTaboolaPerformanceByOS,
    getTaboolaPerformanceByBrowser,
    getTaboolaPerformanceByRegion,
    getTaboolaPerformanceBySite
} from '../services/taboolaService.js';

export const fetchCampaignPerformance = async (req, res) => {
    const { campaignId, startDate, endDate } = req.query;

    if (!campaignId || !startDate || !endDate) {
        return res.status(400).json({ message: 'Missing required parameters' });
    }

    try {
        const result = await getTaboolaCampaignPerformanceResult(campaignId, startDate, endDate);
        res.json(result);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: error.message });
    }
};

export const fetchPerformanceByCountry = async (req, res) => {
    const { campaignId, startDate, endDate } = req.query;
    try {
        const data = await getTaboolaPerformanceByCountry(campaignId, startDate, endDate);
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const fetchPerformanceByOS = async (req, res) => {
    const { campaignId, startDate, endDate } = req.query;
    try {
        const data = await getTaboolaPerformanceByOS(campaignId, startDate, endDate);
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const fetchPerformanceByBrowser = async (req, res) => {
    const { campaignId, startDate, endDate } = req.query;
    try {
        const data = await getTaboolaPerformanceByBrowser(campaignId, startDate, endDate);
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const fetchPerformanceByRegion = async (req, res) => {
    const { campaignId, startDate, endDate } = req.query;
    try {
        const data = await getTaboolaPerformanceByRegion(campaignId, startDate, endDate);
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const fetchPerformanceBySite = async (req, res, next) => {
    try {
        const { campaignId, startDate, endDate } = req.query;
        const siteData = await getTaboolaPerformanceBySite(campaignId, startDate, endDate);
        res.json(siteData);
    } catch (error) {
        next(error);
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