// outbrain.route.js

import express from 'express';
import {
    getCampaignPerformanceResult,
    getPerformanceByCountry,
    getPerformanceByOS,
    getPerformanceByBrowser,
    getPerformanceByRegion,
    getPerformanceByDomain,
    getPerformanceByAds
} from '../controllers/outbrainController.js';
import { fetchAndStoreOutbrainCampaignData } from '../services/fetchAllOutbrainServices.js';

const router = express.Router();

// Route to get Campaign Performance Result
router.get('/campaign-performance/:campaignId', getCampaignPerformanceResult);

// Route to get Performance by Country
router.get('/performance-country/:campaignId', getPerformanceByCountry);

// Route to get Performance by OS
router.get('/performance-os/:campaignId', getPerformanceByOS);

// Route to get Performance by Browser
router.get('/performance-browser/:campaignId', getPerformanceByBrowser);

// Route to get Performance by Region
router.get('/performance-region/:campaignId', getPerformanceByRegion);

// Route to get Performance by Domain
router.get('/performance-domain/:campaignId', getPerformanceByDomain);

// Route to get Performance by Ads
router.get('/performance-ads/:campaignId', getPerformanceByAds);

// Route to fetch and store outbrain campaign data
router.post('/outbrain/fetch-store-campaign', async (req, res) => {
    const { campaignId, from, to } = req.body;
    console.log('POST /outbrain/fetch-store-campaign route hit');
    console.log('Request body:', req.body);

    // Validate that required parameters are provided
    if (!campaignId || !from || !to) {
        console.error('Missing required parameters: campaignId, from or to');
        return res.status(400).json({ message: 'Missing required parameters: campaignId, from or to' });
    }

    try {
        console.log(`Fetching and storing Outbrain campaign data for Campaign ID: ${campaignId}`);
        await fetchAndStoreOutbrainCampaignData(campaignId, from, to);
        console.log('Campaign data successfully fetched and stored');
        return res.status(200).json({ message: 'Campaign data successfully fetched and stored' });
    } catch (error) {
        console.error('Error fetching and storing campaign data:', error);
        return res.status(500).json({ message: 'Failed to fetch and store campaign data', error: error.message });
    }
});

export default router;
