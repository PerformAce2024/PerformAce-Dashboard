import { connectToMongo } from '../config/db.js';

class CampaignRepo {
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

        return {
            totalClicks: totals.clicks,
            totalImpressions: totals.impressions,
            totalSpent: totals.spent,
            averageCTR: totals.ctr.toFixed(2),
        };
    }
}

export default CampaignRepo;
