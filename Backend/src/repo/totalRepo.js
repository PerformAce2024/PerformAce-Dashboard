import { connectToMongo } from '../config/db.js';

class CampaignTotalRepo {
    static async getCampaignPerformanceTotals(campaignId) {
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

        // // Extracting start and end date
        // const startDate = campaign.startDate;
        // console.log('Start Date: ', startDate);

        // const endDate = campaign.endDate;
        // console.log('End Date: ', endDate);

        // // Extracting last-used-rawdata-update-time
        // const lastUsedRawDataUpdateTime = campaign.campaignPerformanceResult['last-used-rawdata-update-time'];

        // Aggregating totals for clicks, impressions, spent, ctr, and cpm
        const results = campaign.campaignPerformanceResult.results;
        console.log("Campaign Performance Results:", campaign.campaignPerformanceResult.results);

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

        // Averaging CTR and CPM over the number of result entries
        totals.ctr = totals.clicks / totals.impressions;

        // Extracting clicks per date for the line chart
        const clicksData = results.map(result => ({
            date: result.date, // Each result has a date
            clicks: result.clicks || 0 // Number of clicks for that date
        }));

        return {
            totalClicks: totals.clicks,
            totalImpressions: totals.impressions,
            totalSpent: totals.spent,
            averageCTR: totals.ctr.toFixed(2),
            // startDate: startDate,
            // endDate: endDate,
            // lastUsedRawDataUpdateTime: lastUsedRawDataUpdateTime,
            clicksData: clicksData // Include clicks data for charting
        };
    }
}

export default CampaignTotalRepo;
