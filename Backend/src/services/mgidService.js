import { connectToMongo } from '../config/db.js';
import { ObjectId } from 'mongodb';

export async function transformMgidData(campaignId, startDate, endDate) {
    let client;
    try {
        client = await connectToMongo();
        const collection = client.db('campaignAnalytics').collection('mgidData');

        const query = {
            campaign_id: campaignId,
            $or: [
                {
                    "date_range.from": startDate,
                    "date_range.to": endDate
                },
                {
                    date_value: {
                        $gte: startDate,
                        $lte: endDate
                    }
                }
            ]
        };

        const mgidData = await collection.find(query).toArray();
        
        if (mgidData.length === 0) {
            throw new Error(`No data found for campaign ${campaignId} between ${startDate} and ${endDate}`);
        }

        // Process Summary data with aggregation
        const summaryData = mgidData
            .filter(record => record.category === 'Summary')
            .reduce((acc, curr) => {
                const dateKey = curr[" Date"];
                if (!acc[dateKey]) {
                    acc[dateKey] = {
                        date: dateKey,
                        impressions: 0,
                        clicks: 0,
                        spent: 0,
                        actions: 0
                    };
                }
                
                acc[dateKey].impressions += parseInt(curr["                         Imps                          "]) || 0;
                acc[dateKey].clicks += parseInt(curr["Clicks"]) || 0;
                acc[dateKey].spent += parseFloat(curr["Spent, INR"]) || 0;
                acc[dateKey].actions += parseInt(curr["Actions"]) || 0;
                acc[dateKey].ctr = ((acc[dateKey].clicks / acc[dateKey].impressions) * 100).toFixed(2);
                acc[dateKey].cpc = (acc[dateKey].spent / acc[dateKey].clicks).toFixed(2);
                
                return acc;
            }, {});

        const transformedData = {
            endDate,
            startDate,
            campaignId,
            campaignPerformanceResult: {
                "last-used-rawdata-update-time": `${endDate} 11:30:00.0`,
                "last-used-rawdata-update-time-gmt-millisec": new Date(endDate).getTime(),
                timezone: "IST",
                results: Object.values(summaryData),
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

        // Process other categories
        const categoryMap = {
            'Browser': 'performanceByBrowser',
            'Country': 'performanceByCountry',
            'OS': 'performanceByOS',
            'region': 'performanceByRegion',
            'Ads': 'performanceByAds',
            'Domain': 'performanceByDomain'
        };

        mgidData.forEach(record => {
            if (record.category !== 'Summary' && categoryMap[record.category]) {
                const key = categoryMap[record.category];
                const dateKey = record.date_value || record[" Date"];
                
                if (!transformedData[key][dateKey]) {
                    transformedData[key][dateKey] = [];
                }
                
                const { category, campaign_id, date_range, ...rest } = record;
                transformedData[key][dateKey].push(rest);
            }
        });

        const transformedCollection = client.db('campaignAnalytics').collection('mgid_transformed_data');
        
        const existingDoc = await transformedCollection.findOne({
            campaignId,
            startDate,
            endDate
        });

        let result;
        if (existingDoc) {
            await transformedCollection.updateOne(
                { _id: existingDoc._id },
                { $set: transformedData }
            );
            result = { ...transformedData, _id: existingDoc._id };
        } else {
            const newDoc = { ...transformedData, _id: new ObjectId() };
            await transformedCollection.insertOne(newDoc);
            result = newDoc;
        }

        return result;

    } catch (error) {
        console.error('Error in transformMgidData:', error);
        throw error;
    } finally {
        if (client) {
            await client.close();
        }
    }
}