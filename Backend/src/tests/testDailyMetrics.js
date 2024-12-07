import { connectToMongo } from '../config/db.js';
import { storeDailyMetricsForClient } from '../services/campaignDailyMetricsService.js';
import assert from 'assert';

async function validateMetricsConsistency(metrics) {
    assert(metrics.date instanceof Date, 'Date should be Date object');
    assert(typeof metrics.amountSpent === 'number', 'amountSpent should be number');
    assert(typeof metrics.impressions === 'number', 'impressions should be number');
    assert(typeof metrics.clicks === 'number', 'clicks should be number');
    assert(typeof metrics.avgCpc === 'number', 'avgCpc should be number');
    assert(typeof metrics.ctr === 'number', 'ctr should be number');
    
    // Validate calculations
    if (metrics.clicks > 0) {
        assert(Math.abs(metrics.avgCpc - metrics.amountSpent / metrics.clicks) < 0.01, 'Invalid avgCpc calculation');
    }
    if (metrics.impressions > 0) {
        assert(Math.abs(metrics.ctr - metrics.clicks / metrics.impressions) < 0.01, 'Invalid CTR calculation');
    }
}

async function validateDateRange(campaigns, dailyMetrics) {
    const dates = dailyMetrics.map(m => m.date.getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);

    campaigns.forEach(campaign => {
        const startDate = new Date(campaign.startDate).getTime();
        const endDate = new Date(campaign.endDate).getTime();
        assert(startDate >= minDate && startDate <= maxDate, 'Campaign start date outside metrics range');
        assert(endDate >= minDate && endDate <= maxDate, 'Campaign end date outside metrics range');
    });
}

async function testClientMetrics() {
    let client;
    try {
        client = await connectToMongo();
        const db = client.db('campaignAnalytics');
        
        // Get test client
        const testClient = await db.collection('clients').findOne({});
        if (!testClient) throw new Error('No clients found in database');

        console.log(`Testing with client: ${testClient.email}`);

        const results = await storeDailyMetricsForClient(testClient.email);
        assert(Array.isArray(results), 'Results should be array');

        for (const ro of results) {
            console.log(`\nValidating RO: ${ro.roNumber}`);
            
            // Basic structure validation
            assert(ro.clientEmail === testClient.email, 'Client email mismatch');
            assert(ro.startDate instanceof Date, 'Invalid start date');
            assert(ro.endDate instanceof Date, 'Invalid end date');
            assert(Array.isArray(ro.campaigns), 'Campaigns should be array');
            assert(Array.isArray(ro.dailyMetrics), 'Daily metrics should be array');

            // Date range validation
            await validateDateRange(ro.campaigns, ro.dailyMetrics);

            // Metrics validation
            ro.dailyMetrics.forEach(validateMetricsConsistency);

            // Database validation
            const storedMetrics = await db.collection('clientDailyMetrics').findOne({
                clientEmail: ro.clientEmail,
                roNumber: ro.roNumber
            });
            assert(storedMetrics, 'Metrics not stored in database');

            console.log(`- Validated ${ro.dailyMetrics.length} daily metrics`);
            console.log(`- Date range: ${ro.startDate.toISOString().split('T')[0]} to ${ro.endDate.toISOString().split('T')[0]}`);
        }

        console.log('\nAll tests passed successfully!');
        return results;

    } catch (error) {
        console.error('Test failed:', error);
        throw error;
    } finally {
        if (client) await client.close();
    }
}

testClientMetrics()
    .then(results => {
        console.log(`\nProcessed ${results.length} ROs`);
        process.exit(0);
    })
    .catch(error => {
        console.error(error);
        process.exit(1);
    });