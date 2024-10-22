import { connectToMongo } from '../config/db.js';

class CampaignAggregatesRepo {
    static async getCampaignRegionAggregates(campaignId) {
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

        if (!campaign || !campaign.campaignPerformanceResult || !campaign.campaignPerformanceResult.results) {
            console.error(`Campaign not found or malformed data for campaignId: ${campaignId}`);
            throw new Error('Campaign data not found or malformed');
        }

        // Aggregating totals for clicks, impressions, spent, ctr, and cpm
        const results = campaign.performanceByRegion.results;
        console.log('Campaign Performance Results:', results);

        if (!results || results.length === 0) {
            console.error('No performance results found for campaignId:', campaignId);
            throw new Error('No performance results found');
        }

        // Sort results by clicks in descending order
        console.log('Sorting results by clicks...');
        const sortedResults = results.sort((a, b) => b.clicks - a.clicks);

        // Extract the top 3 states by clicks
        console.log('Extracting top 3 states by clicks...');
        const top3States = sortedResults.slice(0, 3);

        // Aggregate the clicks for all remaining states as "Other"
        console.log('Aggregating clicks for other states...');
        const otherStates = sortedResults.slice(3);
        const otherStateTotals = otherStates.reduce((acc, state) => {
            acc.clicks += state.clicks || 0;
            return acc;
        }, {
            clicks: 0,
        });

        // Prepare the data for the chart
        console.log('Preparing top 3 clicks data...');
        const top3ClicksData = top3States.map(s => ({
            state: s.region, // Assuming each result has a 'region' or 'state' field
            clicks: s.clicks || 0
        }));

        // Add the aggregated "Other" states
        top3ClicksData.push({
            state: 'Other',
            clicks: otherStateTotals.clicks
        });

        console.log('Top 3 Clicks Data with Other:', top3ClicksData);

        // Calculate the total clicks across all regions
        console.log('Calculating total clicks...');
        const clicksData = campaign.campaignPerformanceResult.results;
        const totalClicks = clicksData.reduce((acc, result) => {
            acc.clicks += result.clicks || 0;
            return acc;
        }, {
            clicks: 0,
        });

        // Log totalClicks for debugging
        console.log('Total Clicks:', totalClicks);

        // Return the aggregated data
        return {
            totalClicks,  // Return total clicks here
            top3ClicksData, // Data for top 3 states and "Other"
        };
    }
}

export default CampaignAggregatesRepo;
