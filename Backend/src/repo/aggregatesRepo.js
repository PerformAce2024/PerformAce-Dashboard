import { connectToMongo } from '../config/db.js';

class CampaignAggregatesRepo {
    static async getCampaignRegionAggregates(campaignId) {
        const client = await connectToMongo();
        if (!client) {
            console.error("Failed to connect to MongoDB");
        }

        const db = client.db('campaignAnalytics');
        const campaignCollection = db.collection('campaignperformances');

        // Find the specific campaign by ID
        const campaign = await campaignCollection.findOne({ campaignId });
        console.log("Campaign Data:", campaign);

        if (!campaign || !campaign.campaignPerformanceResult || !campaign.campaignPerformanceResult.results) {
            console.error("Campaign not found for campaignId:", campaignId);
            throw new Error('Campaign data not found or malformed');
        }

        // Aggregating totals for clicks, impressions, spent, ctr, and cpm
        const results = campaign.performanceByRegion.results;
        console.log("Campaign Performance Results:", results);

        // Sort results by clicks in descending order
        const sortedResults = results.sort((a, b) => b.clicks - a.clicks);

        // Extract the top 3 states by clicks
        const top3States = sortedResults.slice(0, 3);

        // Aggregate the clicks for all remaining states as "Other"
        const otherStates = sortedResults.slice(3);
        const otherStateTotals = otherStates.reduce((acc, state) => {
            acc.clicks += state.clicks || 0;
            return acc;
        }, {
            clicks: 0,
        });

        // Prepare the data for the chart
        const top3ClicksData = top3States.map(s => ({
            state: s.region, // Assuming each result has a 'region' or 'state' field
            clicks: s.clicks || 0
        }));

        // Add the aggregated "Other" states
        top3ClicksData.push({
            state: 'Other',
            clicks: otherStateTotals.clicks
        });

        const clicksData = campaign.campaignPerformanceResult.results;
        console.log("Campaign Performance Clicks:", clicksData);

        const totalClicks = clicksData.reduce((acc, result) => {
            acc.clicks += result.clicks || 0;
            return acc;
        }, {
            clicks: 0,
        });        

        // Log totalClicks for debugging
        console.log('Total Clicks:', totalClicks);

        return {
            totalClicks,  // Return totalClicks here
            top3ClicksData, // Data for top 3 states and "Other"
        };
    }
}

export default CampaignAggregatesRepo;
