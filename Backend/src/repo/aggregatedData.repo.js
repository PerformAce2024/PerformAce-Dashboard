import express from 'express';
import {
    getCombinedPerformanceTotals,
    getTop7States,
    getClicksByOS,
    getClicksByBrowser,
    getDailyMetrics
} from '../controllers/aggregatedData.controller.js';

const router = express.Router();

// Get combined performance totals
router.get('/getCombinedPerformanceTotals', (req, res, next) => {
    console.log('GET /aggregated/getCombinedPerformanceTotals route hit');
    getCombinedPerformanceTotals(req, res, next)
        .then(() => console.log('Combined performance totals fetched successfully'))
        .catch(error => {
            console.error('Error fetching combined performance totals:', error);
            next(error);
        });
});

// Get top 7 states
router.get('/getTop7States', (req, res, next) => {
    console.log('GET /aggregated/getTop7States route hit');
    getTop7States(req, res, next)
        .then(() => console.log('Top 7 states fetched successfully'))
        .catch(error => {
            console.error('Error fetching top 7 states:', error);
            next(error);
        });
});

// Get clicks by OS
router.get('/getClicksByOS', (req, res, next) => {
    console.log('GET /aggregated/getClicksByOS route hit');
    getClicksByOS(req, res, next)
        .then(() => console.log('Clicks by OS fetched successfully'))
        .catch(error => {
            console.error('Error fetching clicks by OS:', error);
            next(error);
        });
});

// Get clicks by browser
router.get('/getClicksByBrowser', (req, res, next) => {
    console.log('GET /aggregated/getClicksByBrowser route hit');
    getClicksByBrowser(req, res, next)
        .then(() => console.log('Clicks by browser fetched successfully'))
        .catch(error => {
            console.error('Error fetching clicks by browser:', error);
            next(error);
        });
});

// Get daily metrics
router.get('/getDailyMetrics', (req, res, next) => {
    console.log('GET /aggregated/getDailyMetrics route hit');
    getDailyMetrics(req, res, next)
        .then(() => console.log('Daily metrics fetched successfully'))
        .catch(error => {
            console.error('Error fetching daily metrics:', error);
            next(error);
        });
});

export default router;