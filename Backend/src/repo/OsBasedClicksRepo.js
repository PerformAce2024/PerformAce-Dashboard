import { connectToMongo } from '../config/db.js';

class CampaignPerformanceByOSRepo {
    static async getClicksByOS(campaignId) {
        console.log('Connecting to MongoDB...');
        const client = await connectToMongo();
        if (!client) {
            console.error('Failed to connect to MongoDB');
            throw new Error('Failed to connect to MongoDB');
        }

        const db = client.db('campaignAnalytics');
        const campaignCollection = db.collection('campaignperformances');

        console.log(`Fetching campaign data for campaignId: ${campaignId}`);
        const campaign = await campaignCollection.findOne({ campaignId });

        if (!campaign || !campaign.performanceByOS) {
            console.error(`Campaign data or performanceByOS not found for campaignId: ${campaignId}`);
            throw new Error('Campaign data or performanceByOS not found');
        }

        const osResults = campaign.performanceByOS.results;

        if (!osResults || osResults.length === 0) {
            console.error('No OS performance data found');
            throw new Error('No OS performance data found');
        }

        // Map the results to only include the OS family and the clicks
        const clicksByOS = osResults.map(result => ({
            osFamily: result.os_family,
            clicks: result.clicks
        }));

        console.log('OS Clicks Data:', clicksByOS);

        return clicksByOS;
    }
}

export default CampaignPerformanceByOSRepo;