import { connectToMongo } from '../config/db.js';

class MgidPerformanceByOSRepo {
    static async getMgidClicksByOS(campaignId) {
        console.log('Connecting to MongoDB...');
        const client = await connectToMongo();
        if (!client) {
            console.error('Failed to connect to MongoDB');
            throw new Error('Failed to connect to MongoDB');
        }

        const db = client.db('campaignAnalytics');
        const mgidCollection = db.collection('mgid_transformed_data');

        console.log(`Fetching MGID campaign data for campaignId: ${campaignId}`);
        const campaign = await mgidCollection.findOne({ campaignId });
        console.log('MGID Campaign Data:', campaign);

        if (!campaign || !campaign.performanceByOS) {
            console.error(`Campaign data or performanceByOS not found for campaignId: ${campaignId}`);
            throw new Error('Campaign data or performanceByOS not found');
        }

        // Get the first available date key and extract results
        const dateKey = Object.keys(campaign.performanceByOS)[0]; // Assumes one date exists
        const osResults = campaign.performanceByOS[dateKey];
        console.log('OS Performance Data:', osResults);

        if (!osResults || osResults.length === 0) {
            console.error('No OS performance data found');
            throw new Error('No OS performance data found');
        }

        // Map the results to only include the OS family and the clicks
        const clicksByOS = osResults.map(result => ({
            osFamily: result['Operating system'], // Assumes 'Operating system' is the field name
            clicks: parseInt(result.Clicks || 0, 10) // Ensure clicks are parsed as integers
        }));

        console.log('OS Clicks Data:', clicksByOS);

        return clicksByOS;
    }
}

export default MgidPerformanceByOSRepo;
