import express from 'express';
import {
    getPerformanceByBrowser,
    getPerformanceByOS,
    getPerformanceByRegion,
    getTop3Clicks,
    getTop7States,
    getCampaignDailyMetrics,
    getNativeHubMetrics,
    getTotalMetrics
} from '../controllers/campaignMetrics.controller.js';

const router = express.Router();

// Existing routes
router.get('/browser', getPerformanceByBrowser);
router.get('/os', getPerformanceByOS);
router.get('/region', getPerformanceByRegion);
router.get('/top3-clicks', getTop3Clicks);
router.get('/top7-states', getTop7States);

// New routes
router.get('/campaign-daily', getCampaignDailyMetrics);
router.get('/native-hub', getNativeHubMetrics);
router.get('/total-metrics', getTotalMetrics);

export default router;