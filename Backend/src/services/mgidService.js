import { connectToMongo } from '../config/db.js';

export async function transformMgidData() {
    try {
        const client = await connectToMongo();
        const collection = client.db('campaignAnalytics').collection('mgidData');
        console.log('Connected to MongoDB for MGID.');

        const mgidData = await collection.find({}).toArray();
        console.log('MGID Data Retrieved:', mgidData);

        // Define start and end dates dynamically based on data
        const startDate = mgidData[0]?.date_value || "2024-11-01";
        const endDate = mgidData[mgidData.length - 1]?.date_value || "2024-11-04";

        // Initialize transformed data structure with one global _id
        const transformedData = {
            _id: mgidData[0]?._id, // Use the first _id or generate a new one as needed
            endDate,
            startDate,
            campaignId: mgidData[0]?.campaign_id || "default_campaign_id",
            campaignPerformanceResult: {
                "last-used-rawdata-update-time": `${endDate} 11:30:00.0`,
                "last-used-rawdata-update-time-gmt-millisec": new Date(endDate).getTime(),
                timezone: "IST",
                results: [], // Only "Summary" category documents go here
                recordCount: mgidData.length,
                metadata: {
                    dateStored: new Date().toISOString()
                }
            },
            performanceByBrowser: {},
            performanceByCountry: {},
            performanceByOS: {},
            performanceByRegion: {},
            performanceByAds: {},
            performanceByDomain: {}
        };

        // Categorize each document
        mgidData.forEach(record => {
            const { category, ...rest } = record;

            if (category === 'Browser') {
                if (!transformedData.performanceByBrowser[rest.date_value]) {
                    transformedData.performanceByBrowser[rest.date_value] = [];
                }
                transformedData.performanceByBrowser[rest.date_value].push(rest);
            } else if (category === 'Country') {
                if (!transformedData.performanceByCountry[rest.date_value]) {
                    transformedData.performanceByCountry[rest.date_value] = [];
                }
                transformedData.performanceByCountry[rest.date_value].push(rest);
            } else if (category === 'OS') {
                if (!transformedData.performanceByOS[rest.date_value]) {
                    transformedData.performanceByOS[rest.date_value] = [];
                }
                transformedData.performanceByOS[rest.date_value].push(rest);
            } else if (category === 'region') {
                if (!transformedData.performanceByRegion[rest.date_value]) {
                    transformedData.performanceByRegion[rest.date_value] = [];
                }
                transformedData.performanceByRegion[rest.date_value].push(rest);
            } else if (category === 'Ads') {
                if (!transformedData.performanceByAds[rest.date_value]) {
                    transformedData.performanceByAds[rest.date_value] = [];
                }
                transformedData.performanceByAds[rest.date_value].push(rest);
            } else if (category === 'Domain') {
                if (!transformedData.performanceByDomain[rest.date_value]) {
                    transformedData.performanceByDomain[rest.date_value] = [];
                }
                transformedData.performanceByDomain[rest.date_value].push(rest);
            } else if (category === 'Summary') {
                // Add "Summary" category documents to campaignPerformanceResult.results
                transformedData.campaignPerformanceResult.results.push(rest);
            }
        });

        // Insert transformed data into a new collection (e.g., mgid_transformed_data)
        const transformedCollection = client.db('campaignAnalytics').collection('mgid_transformed_data');
        await transformedCollection.insertOne(transformedData);
        console.log('Transformed data inserted into mgid_transformed_data collection');

        return transformedData;

    } catch (error) {
        console.error('Error in transformMgidData:', error); // Log error details
        throw error; // Re-throw the error to pass it up to the controller
    }
}
