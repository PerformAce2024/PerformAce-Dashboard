import express from 'express';
import { fetchCampaignPerformance, fetchPerformanceByCountry, fetchPerformanceByOS, fetchPerformanceByBrowser, fetchPerformanceByRegion, 
    fetchPerformanceByDomain, fetchPerformanceByAds } from '../controllers/taboola.controller.js';
import { fetchAndStoreTaboolaCampaignData } from '../services/fetchAllServices.js';

const router = express.Router();

router.get('/campaign-performance', fetchCampaignPerformance);
router.get('/performance-country', fetchPerformanceByCountry);
router.get('/performance-os', fetchPerformanceByOS);
router.get('/performance-browser', fetchPerformanceByBrowser);
router.get('/performance-region', fetchPerformanceByRegion);
// router.get('/performance-domain', fetchPerformanceByDomain);
// router.get('/performance-ads', fetchPerformanceByAds);

// Route to fetch and store Taboola campaign data
router.post('/taboola/fetch-store-campaign', async (req, res) => {
    const { campaignId, startDate, endDate } = req.body;

    // Validate that required parameters are provided
    if (!campaignId || !startDate || !endDate) {
        return res.status(400).json({ message: 'Missing required parameters: campaignId, startDate, or endDate' });
    }

    try {
        // Call the function to fetch and store Taboola data
        await fetchAndStoreTaboolaCampaignData(campaignId, startDate, endDate);
        return res.status(200).json({ message: 'Campaign data successfully fetched and stored' });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ message: 'Failed to fetch and store campaign data', error: error.message });
    }
});


export default router;
