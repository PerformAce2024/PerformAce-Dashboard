import express from 'express';
import { storeDailyMetricsForClient } from '../controllers/campaignMetrics.controller.js';
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

// All routes now support clientEmail & roNumber filtering with optional date range
router.get('/browser', getPerformanceByBrowser);
router.get('/os', getPerformanceByOS);
router.get('/region', getPerformanceByRegion);
router.get('/top3-clicks', getTop3Clicks);
router.get('/top7-states', getTop7States);
router.get('/campaign-daily', getCampaignDailyMetrics);
router.get('/native-hub', getNativeHubMetrics);
router.get('/total-metrics', getTotalMetrics);
router.post('/store-metrics', storeDailyMetricsForClient);

export default router;