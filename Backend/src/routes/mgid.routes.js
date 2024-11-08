import { Router } from 'express';
const router = Router();
import { getMgidTransformedData } from '../controllers/mgidController.js';
import MgidTotalRepo from '../repo/mgidTotalRepo.js';
import MgidAggregatesRepo from '../repo/mgidAggregatesRepo.js';
import MgidTopStates from '../repo/mgidTopStatesRepo.js';
import MgidPerformanceByOSRepo from '../repo/mgidOsBasedClicksRepo.js';
import MgidNativeHubRepo from '../repo/mgidNativeHubRepo.js';
import MgidDailyDataRepo from '../repo/mgidDailyDataRepo.js';
import MgidPerformanceByBrowserRepo from '../repo/mgidBrowserBasedClicksRepo.js';

// Transform MGID data into ideal format
router.get('/mgid-data', getMgidTransformedData);

// Get total campaign performance by campaignId
router.get('/mgid/getCampaignTotals/:campaignId', async (req, res) => {
    const { campaignId } = req.params;
    console.log('GET /mgid/getCampaignTotals/:campaignId route hit');
    console.log('Request Params:', req.params);

    try {
        console.log('Fetching mgid total campaign performance for campaignId:', campaignId);
        const campaignTotals = await MgidTotalRepo.getMgidCampaignPerformanceTotals(campaignId);
        console.log('MGID campaign totals extracted successfully.');
        res.json(campaignTotals);
    } catch (error) {
        console.error('Error fetching campaign totals:', error);
        res.status(500).send('An error occurred while fetching campaign totals.');
    }
});

// Get aggregated campaign data by campaignId
router.get('/mgid/getCampaignAggregates/:campaignId', async (req, res) => {
    const { campaignId } = req.params;
    console.log('GET /mgid/getCampaignAggregates/:campaignId route hit');
    console.log('Request Params:', req.params);

    try {
        console.log('Fetching mgid campaign aggregates for campaignId:', campaignId);
        const campaignAggregates = await MgidAggregatesRepo.getMgidCampaignRegionAggregates(campaignId);
        console.log('MGID campaign aggregates extracted successfully.');
        res.json(campaignAggregates);
    } catch (error) {
        console.error('Error fetching campaign aggregates:', error);
        res.status(500).send('An error occurred while fetching campaign aggregates.');
    }
});

router.get('/mgid/getCampaignDetailsNativeHub/:campaignId', async (req, res) => {
    const { campaignId } = req.params;
    console.log('GET /mgid/getCampaignDetailsNativeHub/:campaignId route hit');
    console.log('Request Params:', req.params);

    try {
        console.log('Fetching mgid campaign performance for nativeHub - campaignId:', campaignId);
        const campaignNativeHub = await MgidNativeHubRepo.getMgidCampaignPerformanceNativeHub(campaignId);
        console.log('MGID nativeHub Campaign totals extracted successfully.');
        res.json(campaignNativeHub);
    } catch (error) {
        console.error('Error fetching campaign totals:', error);
        res.status(500).send('An error occurred while fetching campaign totals.');
    }
});

router.get('/mgid/getCampaignDailyData/:campaignId', async (req, res) => {
    const { campaignId } = req.params;
    console.log('GET /mgid/getCampaignDailyData/:campaignId route hit');
    console.log('Request Params:', req.params);

    try {
        console.log('Fetching mgid daily clicks and impressions for campaignId:', campaignId);
        const campaignDailyData = await MgidDailyDataRepo.getMgidCampaignDailyData(campaignId);
        console.log('MGID nativeHub Campaign totals extracted successfully.');
        res.json(campaignDailyData);
    } catch (error) {
        console.error('Error fetching campaign daily clicks and impressions:', error);
        res.status(500).send('An error occurred while fetching campaign daily clicks and impressions.');
    }
});

// Route to get the top 7 states by clicks for a given campaign
router.get('/mgid/getTop7States/:campaignId', async (req, res) => {
    const { campaignId } = req.params;
    console.log('GET /mgid/getTop7States/:campaignId route hit');
    console.log('Request Params:', req.params);

    try {
        console.log(`Fetching mgid top 7 states by clicks for campaignId: ${campaignId}`);
        const top7StatesData = await MgidTopStates.getMgidTop7StatesByClicks(campaignId);  // Using the new repo function
        console.log('MGID top 7 States data fetched successfully.');
        res.json(top7StatesData);
    } catch (error) {
        console.error('Error fetching top 7 states data:', error);
        res.status(500).send('An error occurred while fetching top 7 states data.');
    }
});

// Get clicks by OS for a specific campaignId
router.get('/mgid/getClicksByOS/:campaignId', async (req, res) => {
    const { campaignId } = req.params;
    console.log('GET /mgid/getClicksByOS/:campaignId route hit');
    console.log('Request Params:', req.params);

    try {
        console.log(`Fetching mgid clicks by OS for campaignId: ${campaignId}`);
        const clicksByOSData = await MgidPerformanceByOSRepo.getMgidClicksByOS(campaignId);
        console.log('MGID clicks by OS data fetched successfully.');
        res.json(clicksByOSData);
    } catch (error) {
        console.error('Error fetching clicks by OS:', error);
        res.status(500).send('An error occurred while fetching clicks by OS.');
    }
});

// Route to fetch clicks by browser for a given campaign
router.get('/mgid/getClicksByBrowser/:campaignId', async (req, res) => {
    const { campaignId } = req.params;
    console.log('GET /mgid/getClicksByBrowser/:campaignId route hit');
    console.log('Request Params:', req.params);

    try {
        console.log(`Fetching mgid clicks by browser for campaignId: ${campaignId}`);
        const clicksByBrowser = await MgidPerformanceByBrowserRepo.getMgidClicksByBrowser(campaignId);
        console.log('MGID clicks by browser fetched successfully.');
        res.json(clicksByBrowser);
    } catch (error) {
        console.error('Error fetching clicks by browser:', error);
        res.status(500).send('An error occurred while fetching clicks by browser.');
    }
});

export default router;
