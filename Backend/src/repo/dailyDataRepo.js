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

    static async getAdminCampaignDailyMetrics(campaignId) {
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

    static async getClientCampaignDailyMetrics(campaignId, clientName) {
        console.log('Connecting to MongoDB...');
        const client = await connectToMongo();
        if (!client) {
            console.error('Failed to connect to MongoDB');
            throw new Error('Failed to connect to MongoDB');
        }
    
        const db = client.db('campaignAnalytics');
        const campaignCollection = db.collection('campaignperformances');
        const releaseOrdersCollection = db.collection('releaseOrders');
    
        console.log(`Fetching daily metrics for campaignId: ${campaignId}`);
        
        // Retrieve campaign data by ID
        const campaign = await campaignCollection.findOne({ campaignId });
        console.log('Campaign Data:', campaign);
    
        if (!campaign || !campaign.campaignPerformanceResult) {
            console.error(`Campaign data not found or malformed for campaignId: ${campaignId}`);
            throw new Error('Campaign data not found or malformed');
        }
    
        // Retrieve client-specific data from `releaseOrders`
        console.log(`Fetching client data for clientName: ${clientName}`);
        const clientData = await releaseOrdersCollection.findOne({ client: clientName });
        console.log('Client Data:', clientData);
    
        if (!clientData) {
            console.error(`Client data not found for clientName: ${clientName}`);
            throw new Error('Client data not found');
        }
    
        // Extract the array of daily results from the campaign data
        const results = campaign.campaignPerformanceResult.results;
    
        if (!results || results.length === 0) {
            console.error('No performance results found for campaignId:', campaignId);
            throw new Error('No performance results found');
        }
    
        // Get the CPC from the client data
        const clientCPC = parseFloat(clientData.cpc); // Ensure clientCPC is a number
    
        // Map results to include date, amount spent, impressions, clicks, avg CPC, and CTR
        console.log('Mapping daily metrics...');
        const dailyMetrics = results.map(result => {
            let date = new Date(result.date);
            date = date.toISOString().split('T')[0]; // Format the date to 'YYYY-MM-DD'

            const clicks = result.clicks || 0;
            const impressions = result.impressions || 0;
            const amountSpent = clicks > 0 ? clicks * clientCPC : 0;;
            const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    
            return {
                date,
                clicks,
                impressions,
                amountSpent,
                ctr,
                
            };
        });
        console.log('Daily Metrics:', dailyMetrics);
    
        // Return daily metrics
        return {
            campaignId: campaignId, // Return campaignId for reference
            dailyMetrics: dailyMetrics, // Array of daily metrics data
            clientCPC: clientCPC // Client-specific CPC
        };
    }    
}

export default CampaignDailyDataRepo;
