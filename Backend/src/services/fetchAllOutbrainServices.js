import dotenv from 'dotenv';
import { connectToMongo } from '../config/db.js';
import {
    getOutbrainCampaignPerformanceResult,
    getOutbrainPerformanceByCountry,
    getOutbrainPerformanceByOS,
    getOutbrainPerformanceByBrowser,
    getOutbrainPerformanceByRegion,
    getOutbrainPerformanceByDomain,
    getOutbrainPerformanceByAds
} from './outbrainService.js';

dotenv.config();

const dbName = 'campaignAnalytics';
const collectionName = 'outbrainData';

// Function to fetch all dimensions' data and store in MongoDB
export const fetchAndStoreOutbrainCampaignData = async (campaignId, from, to) => {
    try {
        console.log(`Fetching Outbrain campaign data for campaignId: ${campaignId}, from: ${from}, to: ${to}`);

        // Initiate all API requests in parallel using Promise.all
        const [
            campaignPerformanceResult,
            performanceByCountry,
            performanceByOS,
            performanceByBrowser,
            performanceByRegion,
            performanceByDomain,
            performanceByAds
        ] = await Promise.all([
            getOutbrainCampaignPerformanceResult(campaignId, from, to),
            getOutbrainPerformanceByCountry(campaignId, from, to),
            getOutbrainPerformanceByOS(campaignId, from, to),
            getOutbrainPerformanceByBrowser(campaignId, from, to),
            getOutbrainPerformanceByRegion(campaignId, from, to),
            getOutbrainPerformanceByDomain(campaignId, from, to),
            getOutbrainPerformanceByAds(campaignId, from, to)
        ]);

        // // Log to verify all data fetched successfully
        // console.log('Campaign Performance Data:', campaignPerformanceResult);
        // console.log('Country Performance Data:', performanceByCountry);
        // console.log('OS Performance Data:', performanceByOS);
        // console.log('Browser Performance Data:', performanceByBrowser);
        // console.log('Region Performance Data:', performanceByRegion);
        // console.log('Domain Performance Data:', performanceByDomain);
        // console.log('Ads Performance Data:', performanceByAds);

        // Connect to MongoDB
        console.log('Connecting to MongoDB...');
        const client = await connectToMongo();
        if (!client) {
            throw new Error('MongoDB connection failed');
        }
        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        // Prepare a document to insert all data into MongoDB in one go
        const campaignData = {
            campaignId,
            from,
            to,
            campaignPerformanceResult,
            performanceByCountry,
            performanceByOS,
            performanceByBrowser,
            performanceByRegion,
            performanceByDomain,
            performanceByAds,
            dateStored: new Date()  // Optional: Store the timestamp when data is saved
        };

        console.log('Saving campaign data to MongoDB...');
        // Insert or update the campaign data in MongoDB (upsert to avoid duplicates)
        await collection.updateOne(
            { campaignId, from, to },  // Search by campaignId, startDate, endDate
            { $set: campaignData },     // Update with new data
            { upsert: true }            // Insert if not found
        );

        console.log('Campaign data successfully saved to MongoDB.');
    } catch (error) {
        console.error('Error fetching and storing Outbrain campaign data:', error);
        throw new Error('Failed to fetch and save Outbrain campaign data');
    }
};
