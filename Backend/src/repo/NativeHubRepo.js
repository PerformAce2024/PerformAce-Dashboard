import { connectToMongo } from '../config/db.js';
import moment from 'moment'; // Optional, for date formatting

class CampaignNativeHubRepo {
    static async getCampaignPerformanceNativeHub(campaignId) {
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

        if (!campaign || !campaign.campaignPerformanceResult) {
            console.error(`Campaign data not found or malformed for campaignId: ${campaignId}`);
            throw new Error('Campaign data not found or malformed');
        }

        // Fetching startDate, endDate from the campaign document
        const startDate = campaign.startDate;
        const endDate = campaign.endDate;

        // If startDate or endDate is not present, handle error
        if (!startDate || !endDate) {
            console.error('Start date or End date is missing in campaign data');
            throw new Error('Start date or End date is missing');
        }

        // Use current date for today
        const currentDate = moment().format('YYYY-MM-DD'); // Or use new Date() if you don't want moment.js

        console.log(`Start Date: ${startDate}, End Date: ${endDate}, Current Date: ${currentDate}`);

        // Now let's fetch the performance results within the date range
        const results = campaign.campaignPerformanceResult.results;

        if (!results || results.length === 0) {
            console.error('No performance results found for campaignId:', campaignId);
            throw new Error('No performance results found');
        }

        // Aggregating totals for clicks, impressions, spent, and ctr
        console.log('NativeHub totals for clicks, impressions, and spent...');
        const totals = results.reduce((acc, result) => {
            acc.clicks += result.clicks || 0;
            acc.impressions += result.impressions || 0;
            acc.spent += result.spent || 0;
            return acc;
        }, {
            clicks: 0,
            impressions: 0,
            spent: 0,
            ctr: 0,
        });

        // Calculate CTR
        totals.ctr = totals.clicks / (totals.impressions || 1);
        console.log(`Total Clicks: ${totals.clicks}, Total Impressions: ${totals.impressions}, Total Spent: ${totals.spent}, CTR: ${totals.ctr}`);

        // Extracting clicks per date for the line chart
        console.log('Extracting clicks per date for the chart...');
        const clicksData = results.map(result => ({
            date: result.date, // Each result has a date
            clicks: result.clicks || 0 // Number of clicks for that date
        }));
        console.log('Clicks Data:', clicksData);

        // Return aggregated totals and clicks data
        return {
            startDate: startDate, // From campaign data
            endDate: endDate, // From campaign data
            currentDate: currentDate, // Today's date
            totalClicks: totals.clicks,
            totalImpressions: totals.impressions,
            totalSpent: totals.spent,
            averageCTR: totals.ctr.toFixed(2),
            clicksData: clicksData, // Include clicks data for charting
        };
    }
}

export default CampaignNativeHubRepo;
