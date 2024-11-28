import { connectToMongo } from '../config/db.js';
import { storeDailyMetricsForClient } from '../services/campaignDailyMetricsService.js';

async function testDailyMetrics() {
    try {
        const testParams = {
            clientEmail: "agarwal11srishti@gmail.com",
            startDate: "2024-10-26",
            endDate: "2024-10-27"  // Two days to test missing data handling
        };

        console.log('\nTesting Daily Metrics Aggregation');
        console.log('--------------------------------');

        const storedData = await storeDailyMetricsForClient(
            testParams.clientEmail, 
            testParams.startDate, 
            testParams.endDate
        );

        console.log('\nDaily Metrics for each date:');
        storedData.dailyMetrics.forEach(dayMetric => {
            console.log(`\nDate: ${dayMetric.date}`);
            console.log('Metrics:', {
                clicks: dayMetric.clicks,
                impressions: dayMetric.impressions,
                amountSpent: dayMetric.amountSpent,
                avgCpc: dayMetric.avgCpc,
                ctr: dayMetric.ctr
            });
        });

        console.log('\nDimension Metrics Sample:');
        console.log('\nBrowsers:', storedData.performanceByBrowser.length);
        console.log('OS:', storedData.performanceByOS.length);
        console.log('Countries:', storedData.performanceByCountry.length);
        console.log('Regions:', storedData.performanceByRegion.length);

        const client = await connectToMongo();
        const db = client.db('campaignAnalytics');
        const verifyData = await db.collection('clientDailyMetrics').findOne({
            clientEmail: testParams.clientEmail,
            startDate: testParams.startDate,
            endDate: testParams.endDate
        });

        console.log('\nVerification:', verifyData ? 'Data stored successfully ✓' : 'Storage failed ✗');
        await client.close();

    } catch (error) {
        console.error('Test failed:', error);
    }
}

testDailyMetrics();