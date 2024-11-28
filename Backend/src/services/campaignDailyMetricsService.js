import { connectToMongo } from '../config/db.js';

const getNumber = (value) => Number(value) || 0;

function generateDateRange(startDate, endDate) {
    const dates = [];
    let currentDate = new Date(startDate);
    const end = new Date(endDate);
    
    while (currentDate <= end) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
}

async function storeDailyMetricsForClient(clientEmail, startDate, endDate) {
    let client;
    try {
        client = await connectToMongo();
        const db = client.db('campaignAnalytics');

        const [clientData, releaseOrders] = await Promise.all([
            db.collection('clients').findOne({ email: clientEmail }),
            db.collection('releaseOrders').find({ clientEmail: { $in: [clientEmail] } }).toArray()
        ]);

        if (!clientData) throw new Error(`Client not found: ${clientEmail}`);

        // Generate all dates in range
        const dateRange = generateDateRange(startDate, endDate);
        
        // Initialize metrics maps with default values for all dates
        const dailyMetricsMap = new Map(
            dateRange.map(date => [date, {
                date,
                amountSpent: 0,
                impressions: 0,
                clicks: 0,
                avgCpc: 0,
                ctr: 0
            }])
        );

        const dimensionMaps = {
            Browser: new Map(),
            OS: new Map(),
            Country: new Map(),
            Region: new Map()
        };

        const allCampaigns = [];
        for (const ro of releaseOrders) {
            const campaigns = await db.collection('campaigns')
                .find({ roName: ro.roNumber })
                .toArray();

            for (const campaign of campaigns) {
                const [taboolaData, outbrainData] = await Promise.all([
                    db.collection('taboolaData').findOne({
                        campaignId: campaign.campaignId,
                        startDate: { $lte: endDate },
                        endDate: { $gte: startDate }
                    }),
                    db.collection('outbrainNewDataFormat').findOne({
                        campaignId: campaign.campaignId,
                        'dateRange.from': startDate,
                        'dateRange.to': endDate
                    })
                ]);

                if (taboolaData?.campaignPerformanceResult?.results?.[0]) {
                    const metrics = taboolaData.campaignPerformanceResult.results[0];
                    updateDailyMetrics(dailyMetricsMap, taboolaData.startDate, {
                        spent: metrics.spent,
                        impressions: metrics.impressions,
                        clicks: metrics.clicks
                    });
                }

                if (outbrainData?.data?.campaignPerformance?.results?.[0]?.metrics) {
                    const metrics = outbrainData.data.campaignPerformance.results[0].metrics;
                    updateDailyMetrics(dailyMetricsMap, outbrainData.dateRange.from, {
                        spent: metrics.spend,
                        impressions: metrics.impressions,
                        clicks: metrics.clicks
                    });
                }

                // Aggregate dimension metrics
                updateDimensionMetrics(taboolaData, outbrainData, dimensionMaps);
            }
        }

        const document = {
            clientEmail,
            clientName: clientData.name,
            startDate,
            endDate,
            dailyMetrics: Array.from(dailyMetricsMap.values()),
            performanceByBrowser: formatDimensionMetrics(dimensionMaps.Browser, 'browser'),
            performanceByOS: formatDimensionMetrics(dimensionMaps.OS, 'os'),
            performanceByCountry: formatDimensionMetrics(dimensionMaps.Country, 'country'),
            performanceByRegion: formatDimensionMetrics(dimensionMaps.Region, 'region'),
            lastUpdated: new Date()
        };

        await db.collection('clientDailyMetrics').updateOne(
            { clientEmail, startDate, endDate },
            { $set: document },
            { upsert: true }
        );

        return document;
    } finally {
        if (client) await client.close();
    }
}

function updateDailyMetrics(metricsMap, date, metrics) {
    const existing = metricsMap.get(date);
    if (existing) {
        existing.amountSpent += getNumber(metrics.spent || metrics.spend);
        existing.impressions += getNumber(metrics.impressions);
        existing.clicks += getNumber(metrics.clicks);
        existing.avgCpc = existing.clicks > 0 ? existing.amountSpent / existing.clicks : 0;
        existing.ctr = existing.impressions > 0 ? (existing.clicks / existing.impressions) : 0;
    }
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
        'os': 'osFamily',  // Map 'os' to 'osFamily'
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