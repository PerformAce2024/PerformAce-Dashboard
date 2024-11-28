import dotenv from 'dotenv';
import { connectToMongo } from '../config/db.js';
import {
    getOutbrainCampaignPerformanceResult,
    getOutbrainPerformanceByCountry,
    getOutbrainPerformanceByOS,
    getOutbrainPerformanceByBrowser,
    getOutbrainPerformanceByRegion,
    getOutbrainPerformanceByDomain,
    getOutbrainPerformanceByAds,
} from './outbrainService.js';

dotenv.config();

const dbName = 'campaignAnalytics';
const collectionName = 'outbrainData';

export const fetchAndStoreOutbrainCampaignData = async (campaignId, from, to) => {
    let client;
    try {
        console.log(`Fetching Outbrain campaign data for campaignId: ${campaignId}, from: ${from}, to: ${to}`);

        // Fetch all data with Promise.allSettled to handle partial failures
        const results = await Promise.allSettled([
            getOutbrainCampaignPerformanceResult(campaignId, from, to),
            getOutbrainPerformanceByCountry(campaignId, from, to),
            getOutbrainPerformanceByOS(campaignId, from, to),
            getOutbrainPerformanceByBrowser(campaignId, from, to),
            getOutbrainPerformanceByRegion(campaignId, from, to),
            getOutbrainPerformanceByDomain(campaignId, from, to),
            getOutbrainPerformanceByAds(campaignId, from, to),
        ]);

        // Process results
        const [
            campaignPerformanceResult,
            performanceByCountry,
            performanceByOS,
            performanceByBrowser,
            performanceByRegion,
            performanceByDomain,
            performanceByAds,
        ] = results.map((result, index) => {
            if (result.status === 'fulfilled') {
                return {
                    status: 'success',
                    data: result.value
                };
            } else {
                console.error(`Failed to fetch data for endpoint ${index}:`, result.reason);
                return {
                    status: 'error',
                    error: result.reason.message
                };
            }
        });

        // Connect to MongoDB
        console.log('Connecting to MongoDB...');
        client = await connectToMongo();
        if (!client) {
            throw new Error('MongoDB connection failed');
        }

        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        // Prepare campaign data document
        const campaignData = {
            campaignId,
            from,
            to,
            metadata: {
                dateStored: new Date(),
                lastUpdated: new Date(),
                status: results.every(r => r.status === 'fulfilled') ? 'complete' : 'partial'
            },
            metrics: {
                campaignPerformance: {
                    status: campaignPerformanceResult.status,
                    data: campaignPerformanceResult.data,
                    error: campaignPerformanceResult.error
                },
                countryPerformance: {
                    status: performanceByCountry.status,
                    data: performanceByCountry.data,
                    error: performanceByCountry.error
                },
                osPerformance: {
                    status: performanceByOS.status,
                    data: performanceByOS.data,
                    error: performanceByOS.error
                },
                browserPerformance: {
                    status: performanceByBrowser.status,
                    data: performanceByBrowser.data,
                    error: performanceByBrowser.error
                },
                regionPerformance: {
                    status: performanceByRegion.status,
                    data: performanceByRegion.data,
                    error: performanceByRegion.error
                },
                domainPerformance: {
                    status: performanceByDomain.status,
                    data: performanceByDomain.data,
                    error: performanceByDomain.error
                },
                adsPerformance: {
                    status: performanceByAds.status,
                    data: performanceByAds.data,
                    error: performanceByAds.error
                }
            }
        };

        console.log('Saving campaign data to MongoDB...');

        // Format dates consistently
        const formattedFrom = String(from);
        const formattedTo = String(to);

        // Upsert the data
        const result = await collection.updateOne(
            {
                campaignId,
                from: formattedFrom,
                to: formattedTo
            },
            {
                $set: campaignData
            },
            {
                upsert: true
            }
        );

        console.log('MongoDB update result:', {
            matched: result.matchedCount,
            modified: result.modifiedCount,
            upserted: result.upsertedId ? true : false
        });

        // Verify storage
        const storedData = await collection.findOne({
            campaignId,
            from: formattedFrom,
            to: formattedTo
        });

        if (!storedData) {
            throw new Error('Data verification failed - document not found after storage');
        }

        console.log('Campaign data successfully saved to MongoDB.');
        return {
            success: true,
            status: campaignData.metadata.status,
            metrics: Object.keys(campaignData.metrics).reduce((acc, key) => {
                acc[key] = campaignData.metrics[key].status;
                return acc;
            }, {})
        };

    } catch (error) {
        console.error('Error in fetchAndStoreOutbrainCampaignData:', error);
        throw error;
    } finally {
        if (client) {
            await client.close();
            console.log('MongoDB connection closed');
        }
    }
};

// Test function
export const testOutbrainDataFetch = async () => {
    try {
        const campaignId = '00166070f8884f88a1c72511c0efaaf804';
        const from = '2024-03-01';
        const to = '2024-03-20';

        console.log(`Testing Outbrain data fetch and store...`);
        const result = await fetchAndStoreOutbrainCampaignData(campaignId, from, to);
        console.log('Test result:', result);
        
    } catch (error) {
        console.error('Test failed:', error);
        throw error;
    }
};