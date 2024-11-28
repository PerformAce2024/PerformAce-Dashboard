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
} from '../services/outbrainService.js';  // Fixed import path

dotenv.config();

const testOutbrainData = async () => {
    let client;
    try {
        const campaignId = '00166070f8884f88a1c72511c0efaaf804';
        const from = '2024-10-26';
        const to = '2024-10-26';

        console.log('Starting Outbrain data fetch...');

        // Fetch all data
        const results = await Promise.allSettled([
            getOutbrainCampaignPerformanceResult(campaignId, from, to),
            getOutbrainPerformanceByCountry(campaignId, from, to),
            getOutbrainPerformanceByOS(campaignId, from, to),
            getOutbrainPerformanceByBrowser(campaignId, from, to),
            getOutbrainPerformanceByRegion(campaignId, from, to),
            getOutbrainPerformanceByDomain(campaignId, from, to),
            getOutbrainPerformanceByAds(campaignId, from, to)
        ]);

        // Connect to MongoDB
        client = await connectToMongo();
        const db = client.db('campaignAnalytics');
        const collection = db.collection('outbrainNewDataFormat');

        // Create document
        const document = {
            campaignId,
            dateRange: { from, to },
            lastUpdated: new Date(),
            data: {
                campaignPerformance: results[0].status === 'fulfilled' ? results[0].value : null,
                countryPerformance: results[1].status === 'fulfilled' ? results[1].value : null,
                osPerformance: results[2].status === 'fulfilled' ? results[2].value : null,
                browserPerformance: results[3].status === 'fulfilled' ? results[3].value : null,
                regionPerformance: results[4].status === 'fulfilled' ? results[4].value : null,
                domainPerformance: results[5].status === 'fulfilled' ? results[5].value : null,
                adsPerformance: results[6].status === 'fulfilled' ? results[6].value : null
            },
            status: {
                overall: results.every(r => r.status === 'fulfilled') ? 'success' : 'partial',
                details: {
                    campaign: results[0].status,
                    country: results[1].status,
                    os: results[2].status,
                    browser: results[3].status,
                    region: results[4].status,
                    domain: results[5].status,
                    ads: results[6].status
                }
            }
        };

        // Store in MongoDB
        const result = await collection.updateOne(
            { campaignId, 'dateRange.from': from, 'dateRange.to': to },
            { $set: document },
            { upsert: true }
        );

        console.log('MongoDB Result:', {
            matched: result.matchedCount,
            modified: result.modifiedCount,
            upserted: result.upsertedId ? true : false
        });

        return {
            success: true,
            status: document.status.overall,
            details: document.status.details
        };

    } catch (error) {
        console.error('Error:', error);
        throw error;
    } finally {
        if (client) {
            await client.close();
        }
    }
};

// Run test
console.log('Starting Outbrain test...');
testOutbrainData()
    .then(result => {
        console.log('Test completed:', result);
        process.exit(0);
    })
    .catch(error => {
        console.error('Test failed:', error);
        process.exit(1);
    });