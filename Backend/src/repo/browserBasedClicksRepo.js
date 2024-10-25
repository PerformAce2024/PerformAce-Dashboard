import { connectToMongo } from '../config/db.js';

class CampaignPerformanceByBrowserRepo {
    static async getClicksByBrowser(campaignId) {
        console.log('Connecting to MongoDB...');
        const client = await connectToMongo();
        if (!client) {
            console.error('Failed to connect to MongoDB');
            throw new Error('Failed to connect to MongoDB');
        }

        const db = client.db('campaignAnalytics');
        const campaignCollection = db.collection('campaignperformances');

        console.log(`Fetching campaign data for campaignId: ${campaignId}`);
        // Find the specific campaign by ID
        const campaign = await campaignCollection.findOne({ campaignId });
        console.log('Campaign Data:', campaign);

        // Check if campaign exists and contains performanceByBrowser data
        if (!campaign) {
            console.error('Campaign data not found');
            throw new Error('Campaign data not found');
        }

        const performanceByBrowser = campaign.performanceByBrowser;

        if (!performanceByBrowser || !performanceByBrowser.results) {
            console.error('performanceByBrowser or its results not found');
            throw new Error('performanceByBrowser or its results not found');
        }

        // Extracting the performanceByBrowser results
        const browserResults = performanceByBrowser.results;
        console.log('Browser Performance Results:', browserResults);

        // Map the results to extract browser names and clicks
        const clicksByBrowser = browserResults.map(browser => ({
            browser: browser.browser || 'Unknown', // Use 'Unknown' if browser field is missing
            clicks: browser.clicks || 0 // Use 0 if clicks field is missing
        }));

        // Log for debugging
        console.log('Clicks by Browser:', clicksByBrowser);

        // Return the mapped results
        return clicksByBrowser;
    }
}

export default CampaignPerformanceByBrowserRepo;
