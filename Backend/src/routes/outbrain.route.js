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

export default router;
