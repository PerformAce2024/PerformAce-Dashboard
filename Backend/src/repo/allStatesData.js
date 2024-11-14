import { connectToMongo } from '../config/db.js';

class CampaignAllStates {
    static async getAllStatesByClicks(campaignId) {
        console.log('Connecting to MongoDB...');
        const client = await connectToMongo();
        if (!client) {
            console.error('Failed to connect to MongoDB');
            throw new Error('Failed to connect to MongoDB');
        }

        const db = client.db('campaignAnalytics');
        const campaignCollection = db.collection('taboolaData');
        
        console.log(`Fetching campaign data for campaignId: ${campaignId}`);
        // Find the specific campaign by ID
        const campaign = await campaignCollection.findOne({ campaignId });
        console.log('Campaign Data:', campaign);

        if (!campaign || !campaign.performanceByRegion || !campaign.performanceByRegion.results) {
            console.error(`Campaign not found or malformed data for campaignId: ${campaignId}`);
            throw new Error('Campaign data not found or malformed');
        }

        // Get the results from performance by region
        const results = campaign.performanceByRegion.results;
        console.log('Campaign Performance Results:', results);

        if (!results || results.length === 0) {
            console.error('No performance results found for campaignId:', campaignId);
            throw new Error('No performance results found');
        }

        // Sort results by clicks in descending order
        console.log('Sorting results by clicks...');
        const sortedResults = results.sort((a, b) => b.clicks - a.clicks);

        // Prepare the data for all states including both clicks and impressions
        console.log('Preparing clicks and impressions data for all states...');
        const allStatesData = sortedResults.map(s => ({
            state: s.region, // Assuming each result has a 'region' or 'state' field
            clicks: s.clicks || 0,
            impressions: s.impressions || 0 // Added impressions data
        }));

        console.log('All States Data (Clicks and Impressions):', allStatesData);

        // Calculate the total clicks and total impressions across all regions
        console.log('Calculating total clicks and total impressions...');
        const totalClicks = results.reduce((acc, result) => acc + (result.clicks || 0), 0);
        const totalImpressions = results.reduce((acc, result) => acc + (result.impressions || 0), 0);

        // Log totalClicks and totalImpressions for debugging
        console.log('Total Clicks:', totalClicks);
        console.log('Total Impressions:', totalImpressions);

        // Return the aggregated data
        return {
            totalClicks,  // Return total clicks here
            totalImpressions, // Return total impressions here
            allStatesData, // Data for all states (with clicks and impressions)
        };
    }
}

export default CampaignAllStates;
