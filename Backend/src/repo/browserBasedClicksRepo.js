import { connectToMongo } from '../config/db.js';

class CampaignPerformanceByBrowserRepo {
    static async getClicksByBrowser(campaignId) {
        console.log('Starting to fetch browser performance data for campaignId:', campaignId);
        
        // Step 1: Connect to MongoDB
        console.log('Connecting to MongoDB...');
        const client = await connectToMongo();
        if (!client) {
            console.error('Failed to connect to MongoDB');
            throw new Error('Failed to connect to MongoDB');
        }
        console.log('Successfully connected to MongoDB.');

        const db = client.db('campaignAnalytics');
        const campaignCollection = db.collection('taboolaData');

        // Step 2: Fetch campaign data
        console.log(`Fetching campaign data for campaignId: ${campaignId}`);
        const campaign = await campaignCollection.findOne({ campaignId });
        if (!campaign) {
            console.error('Campaign data not found');
            throw new Error('Campaign data not found');
        }
        console.log('Campaign Data:', campaign);

        // Step 3: Check if performanceByBrowser exists
        const performanceByBrowser = campaign.performanceByBrowser;
        if (!performanceByBrowser || !performanceByBrowser.results) {
            console.error('performanceByBrowser or its results not found');
            throw new Error('performanceByBrowser or its results not found');
        }
        console.log('performanceByBrowser Data:', performanceByBrowser);

        // Step 4: Extract the browser results
        const browserResults = performanceByBrowser.results;
        console.log(`Found ${browserResults.length} browsers in the results.`);

        // Step 5: Map the browser results to extract clicks and impressions
        const clicksAndImpressionsByBrowser = browserResults.map((browser, index) => {
            console.log(`Processing browser ${index + 1}:`, browser);
            const browserName = browser.browser || 'Unknown'; // Default to 'Unknown' if browser name is missing
            const clicks = browser.clicks !== undefined ? browser.clicks : 0;  // Default to 0 if clicks is missing
            const impressions = browser.impressions !== undefined ? browser.impressions : 0; // Default to 0 if impressions is missing

            // Log the final values being processed
            console.log(`Browser: ${browserName}, Clicks: ${clicks}, Impressions: ${impressions}`);
            
            return {
                browser: browserName,
                clicks: clicks,
                impressions: impressions
            };
        });

        // Step 6: Log final mapped data
        console.log('Final Clicks and Impressions by Browser:', clicksAndImpressionsByBrowser);

        // Step 7: Return the mapped results
        return clicksAndImpressionsByBrowser;
    }
}

export default CampaignPerformanceByBrowserRepo;
