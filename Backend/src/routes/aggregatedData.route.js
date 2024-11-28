import express from 'express';
import {
    getPerformanceByBrowser,
    getPerformanceByOS,
    getPerformanceByCountry,
    getPerformanceByRegion,
    getCampaignPerformance
} from '../controllers/aggregatedData.controller.js';

const router = express.Router();

router.get('/performance-browser', getPerformanceByBrowser);
router.get('/performance-os', getPerformanceByOS);
router.get('/performance-country', getPerformanceByCountry);
router.get('/performance-region', getPerformanceByRegion);
router.get('/campaign-performance', getCampaignPerformance);

export default router;