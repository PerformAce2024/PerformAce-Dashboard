import { connectToMongo } from '../config/db.js';

class CampaignTopStates {
    static async getTop7StatesByClicks(campaignId) {
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

        // Extract the top 7 states by clicks
        console.log('Extracting top 7 states by clicks...');
        const top7States = sortedResults.slice(0, 7);

        // Aggregate the clicks for all remaining states as "Other"
        console.log('Aggregating clicks for other states...');
        const otherStates = sortedResults.slice(7);
        const otherStateTotals = otherStates.reduce((acc, state) => {
            acc.clicks += state.clicks || 0;
            return acc;
        }, {
            clicks: 0,
        });

        // Prepare the data for the chart
        console.log('Preparing top 7 clicks data...');
        const top7ClicksData = top7States.map(s => ({
            state: s.region, // Assuming each result has a 'region' or 'state' field
            clicks: s.clicks || 0
        }));

        // Add the aggregated "Other" states
        top7ClicksData.push({
            state: 'Other',
            clicks: otherStateTotals.clicks
        });

        console.log('Top 7 Clicks Data with Other:', top7ClicksData);

        // Calculate the total clicks across all regions
        console.log('Calculating total clicks...');
        const totalClicks = results.reduce((acc, result) => {
            acc += result.clicks || 0;
            return acc;
        }, 0);

        // Log totalClicks for debugging
        console.log('Total Clicks:', totalClicks);

        // Return the aggregated data
        return {
            totalClicks,  // Return total clicks here
            top7ClicksData, // Data for top 7 states and "Other"
        };
    }
}

export default CampaignTopStates;
