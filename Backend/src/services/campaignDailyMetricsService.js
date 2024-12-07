import { connectToMongo } from '../config/db.js';

const getNumber = (value) => Number(value) || 0;

async function storeDailyMetricsForClient(clientEmail, specificRoNumber = null) {
    let client;
    try {
        client = await connectToMongo();
        const db = client.db('campaignAnalytics');

        const clientData = await db.collection('clients').findOne({ email: clientEmail });
        if (!clientData) throw new Error(`Client not found: ${clientEmail}`);

        // Modify query based on whether roNumber is provided
        const roQuery = specificRoNumber ? 
            { clientEmail: { $in: [clientEmail] }, roNumber: specificRoNumber } :
            { clientEmail: { $in: [clientEmail] } };

        const releaseOrders = await db.collection('releaseOrders')
            .find(roQuery)
            .toArray();

        if (!releaseOrders.length) {
            throw new Error(specificRoNumber ? 
                `No release order found with RO number: ${specificRoNumber}` :
                `No release orders found for client: ${clientEmail}`
            );
        }

        const results = [];
        for (const ro of releaseOrders) {
            const campaigns = await db.collection('campaigns')
                .find({ roNumber: ro.roNumber })
                .toArray();

            if (!campaigns.length) continue;

            const dateRange = getAdjustedDateRange(campaigns);
            if (!dateRange.startDate || !dateRange.endDate) continue;

            const existingMetrics = await db.collection('clientDailyMetrics').findOne({
                clientEmail,
                roNumber: ro.roNumber
            });

            const campaignMetrics = await processCampaigns(
                db, 
                campaigns, 
                dateRange, 
                existingMetrics?.dailyMetrics
            );
            
            const roMetrics = {
                clientEmail,
                clientName: clientData.name,
                roNumber: ro.roNumber,
                campaigns: campaigns.map(c => ({
                    campaignId: c.campaignId,
                    startDate: new Date(c.startDate),
                    endDate: new Date(c.endDate)
                })),
                startDate: new Date(dateRange.startDate),
                endDate: new Date(dateRange.endDate),
                dailyMetrics: campaignMetrics,
                lastUpdated: new Date()
            };

            await db.collection('clientDailyMetrics').updateOne(
                { clientEmail, roNumber: ro.roNumber },
                { $set: roMetrics },
                { upsert: true }
            );

            results.push(roMetrics);
        }

        return results;
    } finally {
        if (client) await client.close();
    }
}

function getAdjustedDateRange(campaigns) {
    const validDates = campaigns
        .filter(c => c.startDate && c.endDate)
        .flatMap(c => [new Date(c.startDate), new Date(c.endDate)])
        .filter(date => !isNaN(date));

    if (!validDates.length) return { startDate: null, endDate: null };

    const startDate = new Date(Math.min(...validDates));
    const endDate = new Date(Math.min(new Date(), Math.max(...validDates)));

    return {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
    };
}

async function processCampaigns(db, campaigns, dateRange, existingMetrics = []) {
    const metricsMap = initializeDateRange(dateRange, existingMetrics);

    for (const campaign of campaigns) {
        const [taboolaData, outbrainData] = await Promise.all([
            db.collection('taboolaData').findOne({ campaignId: campaign.campaignId }),
            db.collection('outbrainNewDataFormat').findOne({ campaignId: campaign.campaignId })
        ]);

        if (taboolaData) processTaboolaData(metricsMap, taboolaData, dateRange);
        if (outbrainData) processOutbrainData(metricsMap, outbrainData, dateRange);
    }

    return Array.from(metricsMap.entries())
        .map(([date, metrics]) => ({
            date: new Date(date),
            ...calculateMetrics(metrics)
        }))
        .sort((a, b) => a.date - b.date);
}

function initializeDateRange(dateRange, existingMetrics = []) {
    const metricsMap = new Map();
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    
    // Initialize with existing metrics if available
    existingMetrics.forEach(metric => {
        const dateStr = new Date(metric.date).toISOString().split('T')[0];
        if (new Date(dateStr) >= start && new Date(dateStr) <= end) {
            metricsMap.set(dateStr, {
                amountSpent: metric.amountSpent,
                impressions: metric.impressions,
                clicks: metric.clicks
            });
        }
    });

    // Fill in missing dates
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        const dateStr = date.toISOString().split('T')[0];
        if (!metricsMap.has(dateStr)) {
            metricsMap.set(dateStr, {
                amountSpent: 0,
                impressions: 0,
                clicks: 0
            });
        }
    }
    return metricsMap;
}

function calculateMetrics(metrics) {
    return {
        ...metrics,
        avgCpc: metrics.clicks > 0 ? metrics.amountSpent / metrics.clicks : 0,
        ctr: metrics.impressions > 0 ? (metrics.clicks / metrics.impressions) : 0
    };
}

function processTaboolaData(metricsMap, taboolaData, dateRange) {
    const results = taboolaData?.campaignPerformanceResult?.results || [];
    results
        .filter(metric => isDateInRange(metric.date, dateRange))
        .forEach(metric => {
            updateMetrics(metricsMap, metric.date, {
                spent: metric.spent,
                impressions: metric.impressions,
                clicks: metric.clicks
            });
        });
}

function processOutbrainData(metricsMap, outbrainData, dateRange) {
    const results = outbrainData?.campaignPerformanceResult?.results || [];
    results
        .filter(result => result.metrics && isDateInRange(result.metadata.fromDate, dateRange))
        .forEach(result => {
            updateMetrics(metricsMap, result.metadata.fromDate, {
                spent: result.metrics.spend,
                impressions: result.metrics.impressions,
                clicks: result.metrics.clicks
            });
        });
}

function isDateInRange(dateStr, dateRange) {
    const date = new Date(dateStr);
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    return date >= start && date <= end;
}

function updateMetrics(metricsMap, date, newMetrics) {
    const dateStr = new Date(date).toISOString().split('T')[0];
    const existing = metricsMap.get(dateStr);
    if (!existing) return;

    existing.amountSpent += getNumber(newMetrics.spent || newMetrics.spend);
    existing.impressions += getNumber(newMetrics.impressions);
    existing.clicks += getNumber(newMetrics.clicks);
}

function updateDimensionMetrics(taboolaData, outbrainData, dimensionMaps) {
    const dimensions = ['Browser', 'OS', 'Country', 'Region'];
    
    dimensions.forEach(dimension => {
        const map = dimensionMaps[dimension];
        
        // Process Taboola data
        const taboolaResults = taboolaData?.[`performanceBy${dimension}`]?.results || [];
        taboolaResults.forEach(item => {
            const key = dimension === 'Region' ? item.region : item[dimension.toLowerCase()] || 'Unknown';
            aggregateDimensionMetrics(map, key, item);
        });

        // Process Outbrain data
        const outbrainResults = outbrainData?.data?.[`${dimension.toLowerCase()}Performance`]?.results || [];
        outbrainResults.forEach(result => {
            const key = dimension === 'Region' ? 
                result.metadata?.region : 
                result.metadata?.name || result.metadata?.code || 'Unknown';
            if (result.metrics) {
                aggregateDimensionMetrics(map, key, {
                    spent: result.metrics.spend,
                    impressions: result.metrics.impressions,
                    clicks: result.metrics.clicks
                });
            }
        });
    });
}

function aggregateDimensionMetrics(map, key, metrics) {
    const existing = map.get(key) || {
        clicks: 0,
        impressions: 0,
        spent: 0,
        ctr: 0,
        cpc: 0
    };

    existing.clicks += getNumber(metrics.clicks);
    existing.impressions += getNumber(metrics.impressions);
    existing.spent += getNumber(metrics.spent || metrics.spend);
    existing.ctr = existing.impressions > 0 ? (existing.clicks / existing.impressions) * 100 : 0;
    existing.cpc = existing.clicks > 0 ? existing.spent / existing.clicks : 0;

    map.set(key, existing);
}

function formatDimensionMetrics(map, dimensionKey) {
    const keyMap = {
        'os': 'osFamily',
        'browser': 'browser',
        'country': 'country',
        'region': 'region'
    };

    return Array.from(map.entries()).map(([key, metrics]) => ({
        [keyMap[dimensionKey] || dimensionKey]: key || 'Unknown',
        ...metrics
    }));
}

export { storeDailyMetricsForClient };