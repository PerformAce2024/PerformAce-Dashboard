import { connectToMongo } from '../config/db.js';
import moment from 'moment'; // Optional, for date formatting

class CampaignDailyDataRepo {
    // Function to fetch daily clicks and impressions for a specific campaign
    static async getCampaignDailyData(campaignId) {
        console.log('Connecting to MongoDB...');
        const client = await connectToMongo();
        if (!client) {
            console.error('Failed to connect to MongoDB');
            throw new Error('Failed to connect to MongoDB');
        }

        const db = client.db('campaignAnalytics');
        const campaignCollection = db.collection('campaignperformances');

        console.log(`Fetching daily performance data for campaignId: ${campaignId}`);

        // Retrieve campaign data by ID
        const campaign = await campaignCollection.findOne({ campaignId });
        console.log('Campaign Data:', campaign);

        if (!campaign || !campaign.campaignPerformanceResult) {
            console.error(`Campaign data not found or malformed for campaignId: ${campaignId}`);
            throw new Error('Campaign data not found or malformed');
        }

        // Extract the array of daily results
        const results = campaign.campaignPerformanceResult.results;

        if (!results || results.length === 0) {
            console.error('No performance results found for campaignId:', campaignId);
            throw new Error('No performance results found');
        }

        // Map results to daily clicks and impressions
        console.log('Mapping daily clicks and impressions...');
        const dailyData = results.map(result => ({
            date: result.date, // Date of the data point
            clicks: result.clicks || 0, // Daily clicks
            impressions: result.impressions || 0 // Daily impressions
        }));
        console.log('Daily Clicks and Impressions Data:', dailyData);

        // Return daily data
        return {
            campaignId: campaignId, // Return campaignId for reference
            dailyData: dailyData // Array of daily clicks and impressions
        };
    }

    static async getCampaignDailyMetrics(campaignId) {
        console.log('Connecting to MongoDB...');
        const client = await connectToMongo();
        if (!client) {
            console.error('Failed to connect to MongoDB');
            throw new Error('Failed to connect to MongoDB');
        }

        const db = client.db('campaignAnalytics');
        const campaignCollection = db.collection('campaignperformances');

        console.log(`Fetching daily metrics for campaignId: ${campaignId}`);

        // Retrieve campaign data by ID
        const campaign = await campaignCollection.findOne({ campaignId });
        console.log('Campaign Data:', campaign);

        if (!campaign || !campaign.campaignPerformanceResult) {
            console.error(`Campaign data not found or malformed for campaignId: ${campaignId}`);
            throw new Error('Campaign data not found or malformed');
        }

        // Extract the array of daily results
        const results = campaign.campaignPerformanceResult.results;

        if (!results || results.length === 0) {
            console.error('No performance results found for campaignId:', campaignId);
            throw new Error('No performance results found');
        }

        // Map results to include date, amount spent, impressions, clicks, avg CPC, and CTR
        console.log('Mapping daily metrics...');
        const dailyMetrics = results.map(result => {
            // Convert date to 'YYYY-MM-DD' format
            let date = new Date(result.date);
            date = date.toISOString().split('T')[0]; // Format the date to 'YYYY-MM-DD'
            
            const amountSpent = result.spent || 0;
            const impressions = result.impressions || 0;
            const clicks = result.clicks || 0;
            const avgCpc = clicks > 0 ? amountSpent / clicks : 0;
            const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

            return {
                date,
                amountSpent,
                impressions,
                clicks,
                avgCpc,
                ctr
            };
        });
        console.log('Daily Metrics:', dailyMetrics);

        // Return daily metrics
        return {
            campaignId: campaignId, // Return campaignId for reference
            dailyMetrics: dailyMetrics // Array of daily metrics data
        };
    }
}

export default CampaignDailyDataRepo;
