import { connectToMongo } from '../config/db.js';

class MgidTopStates {
    static async getMgidTop7StatesByClicks(campaignId) {
        console.log('Connecting to MongoDB...');
        const client = await connectToMongo();
        if (!client) {
            console.error('Failed to connect to MongoDB');
            throw new Error('Failed to connect to MongoDB');
        }

        const db = client.db('campaignAnalytics');
        const mgidCollection = db.collection('mgid_transformed_data');

        console.log(`Fetching MGID campaign data for campaignId: ${campaignId}`);
        // Find the specific campaign by ID
        const campaign = await mgidCollection.findOne({ campaignId });
        console.log('MGID Campaign Data:', campaign);

        if (!campaign || !campaign.performanceByRegion) {
            console.error(`Campaign not found or malformed data for campaignId: ${campaignId}`);
            throw new Error('Campaign data not found or malformed');
        }

        // Get the results from performance by region
        const dateKey = Object.keys(campaign.performanceByRegion)[0]; // Assumes one date exists
        const results = campaign.performanceByRegion[dateKey];
        console.log('MGID Campaign Performance by Region Results:', results);

        if (!results || results.length === 0) {
            console.error('No performance results found for campaignId:', campaignId);
            throw new Error('No performance results found');
        }

        // Sort results by clicks in descending order
        console.log('Sorting results by clicks...');
        const sortedResults = results.sort((a, b) => parseInt(b.Clicks, 10) - parseInt(a.Clicks, 10));

        // Extract the top 7 states by clicks
        console.log('Extracting top 7 states by clicks...');
        const top7States = sortedResults.slice(0, 7);

        // Aggregate the clicks for all remaining states as "Other"
        console.log('Aggregating clicks for other states...');
        const otherStates = sortedResults.slice(7);
        const otherStateTotals = otherStates.reduce((acc, state) => {
            acc.clicks += parseInt(state.Clicks || 0, 10);
            return acc;
        }, {
            clicks: 0,
        });

        // Prepare the data for the chart
        console.log('Preparing top 7 clicks data...');
        const top7ClicksData = top7States.map(s => ({
            state: s.Region, // Assuming each result has a 'Region' field
            clicks: parseInt(s.Clicks || 0, 10)
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
            acc += parseInt(result.Clicks || 0, 10);
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

export default MgidTopStates;
