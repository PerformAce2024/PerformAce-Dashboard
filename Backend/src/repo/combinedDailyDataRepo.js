import { connectToMongo } from '../config/db.js';
import CampaignDailyDataRepo from './dailyDataRepo.js';
import MgidDailyDataRepo from './mgidDailyDataRepo.js';

class CombinedDailyDataRepo {
    static async getCombinedDailyData(taboolaCampaignId) {
        console.log('Connecting to MongoDB for campaign mapping...');
        const client = await connectToMongo();
        if (!client) {
            console.error('Failed to connect to MongoDB');
            throw new Error('Failed to connect to MongoDB');
        }

        const db = client.db('campaignAnalytics');
        const campaignMappingCollection = db.collection('campaignMappings');

        // Fetch the mapping for the given Taboola campaign ID
        const mapping = await campaignMappingCollection.findOne({ taboolaCampaignId });
        if (!mapping || !mapping.mgidCampaignId) {
            console.error(`No matching MGID campaign ID found for Taboola campaign ID: ${taboolaCampaignId}`);
            throw new Error('No matching MGID campaign ID found');
        }

        const mgidCampaignId = mapping.mgidCampaignId;
        console.log(`Found mapping: Taboola ID ${taboolaCampaignId} -> MGID ID ${mgidCampaignId}`);

        // Fetch data from both Taboola and MGID repositories
        console.log('Fetching Taboola daily data...');
        const taboolaData = await CampaignDailyDataRepo.getCampaignDailyData(taboolaCampaignId);
        console.log('Taboola Daily Data:', taboolaData);

        console.log('Fetching MGID daily data...');
        const mgidData = await MgidDailyDataRepo.getMgidCampaignDailyData(mgidCampaignId);
        console.log('MGID Daily Data:', mgidData);

        // Combine daily data from both platforms
        const dailyDataMap = new Map();
        const mergeDailyData = (data) => {
            data.forEach(entry => {
                if (dailyDataMap.has(entry.date)) {
                    const existing = dailyDataMap.get(entry.date);
                    existing.clicks += entry.clicks;
                    existing.impressions += entry.impressions;
                    dailyDataMap.set(entry.date, existing);
                } else {
                    dailyDataMap.set(entry.date, { ...entry });
                }
            });
        };

        mergeDailyData(taboolaData.dailyData);
        mergeDailyData(mgidData.dailyData);

        const combinedDailyData = Array.from(dailyDataMap, ([date, data]) => ({
            date,
            clicks: data.clicks,
            impressions: data.impressions,
        }));

        console.log('Combined Daily Data:', combinedDailyData);

        return {
            campaignId: taboolaCampaignId, // Return Taboola campaign ID for reference
            dailyData: combinedDailyData, // Combined daily clicks and impressions
        };
    }
}

export default CombinedDailyDataRepo;
