import { connectToMongo } from '../config/db.js';



async function storeDailyMetricsForClient(clientEmail, specificRoNumber = null) {
    let client;
    try {
        client = await connectToMongo();
        const db = client.db('campaignAnalytics');

        // Step 1: Get client and RO numbers
        console.log(`\nFetching data for client: ${clientEmail}`);
        const clientData = await db.collection('clients').findOne({ email: clientEmail });
        if (!clientData) throw new Error(`Client not found: ${clientEmail}`);

        const roQuery = specificRoNumber ? 
            { clientEmail: { $in: [clientEmail] }, roNumber: specificRoNumber } :
            { clientEmail: { $in: [clientEmail] } };
        
        const releaseOrders = await db.collection('releaseOrders').find(roQuery).toArray();
        console.log(`Found ROs: ${releaseOrders.map(ro => ro.roNumber).join(', ')}`);

        const results = [];
        for (const ro of releaseOrders) {
            // Step 2: Get all campaignIds for this RO
            const campaigns = await db.collection('campaigns')
                .find({ roNumber: ro.roNumber })
                .toArray();

            console.log(`\nProcessing RO ${ro.roNumber}`);
            console.log(`Found campaigns: ${campaigns.map(c => c.campaignId).join(', ')}`);

            if (campaigns.length > 0) {
                const processedData = await processRoCampaigns(db, campaigns, ro, clientData);
                await db.collection('clientDailyMetrics').updateOne(
                    { clientEmail, roNumber: ro.roNumber },
                    { $set: processedData },
                    { upsert: true }
                );
                results.push(processedData);
            }
        }

        return results;
    } finally {
        if (client) await client.close();
    }
}

async function processRoCampaigns(db, campaigns, ro, clientData) {
    // Get data for all campaigns
    const campaignData = await Promise.all(
        campaigns.map(async (campaign) => {
            const [taboola, outbrain, mgid, dv360] = await Promise.all([
                db.collection('taboolaData').find({ campaignId: campaign.campaignId }).toArray(),
                db.collection('outbrainNewDataFormat').find({ campaignId: campaign.campaignId }).toArray(),
                db.collection('mgid_transformed_data').find({ campaignId: campaign.campaignId }).toArray(),
                db.collection('dv360Data').find({ campaignId: campaign.campaignId }).toArray()
            ]);
            return { campaign, data: { taboola, outbrain, mgid, dv360 } };
        })
    );

    // Get date range and initialize metrics
    const dateRange = getDateRange(campaigns);
    console.log(`Date range: ${dateRange.startDate} to ${dateRange.endDate}`);

    const dailyMetrics = generateDailyMetrics(dateRange);
    const dimensionMetrics = {
        performanceByBrowser: [],
        performanceByOS: [],
        performanceByRegion: [],
        performanceByCountry: []
    };

    // Process all campaign data
    campaignData.forEach(({ campaign, data }) => {
        console.log(`\nProcessing campaign ${campaign.campaignId}:`);

        Object.entries(data).forEach(([platform, documents]) => {
            console.log(`${platform}: ${documents.length} documents`);

            documents.forEach(doc => {
                // Process daily metrics
                if (doc?.campaignPerformanceResult?.results) {
                    processDailyMetrics(dailyMetrics, doc.campaignPerformanceResult.results, platform);
                }

                // Process dimension metrics with proper type conversion
                if (doc?.performanceByBrowser?.[dateRange.startDate]) {
                    processPlatformDimension(
                        dimensionMetrics.performanceByBrowser,
                        doc.performanceByBrowser,
                        platform
                    );
                }

                if (doc?.performanceByOS?.[dateRange.startDate]) {
                    processPlatformDimension(
                        dimensionMetrics.performanceByOS,
                        doc.performanceByOS,
                        platform
                    );
                }

                // Special handling for region metrics
                if (doc?.performanceByRegion) {
                    processDimensionMetrics(dimensionMetrics, platform, doc);
                }

                if (doc?.performanceByCountry?.[dateRange.startDate]) {
                    processPlatformDimension(
                        dimensionMetrics.performanceByCountry,
                        doc.performanceByCountry,
                        platform
                    );
                }
            });
        });
    });

    // Format and return results
    return {
        roNumber: ro.roNumber,
        clientEmail: clientData.email,
        clientName: clientData.name,
        startDate: new Date(dateRange.startDate),
        endDate: new Date(dateRange.endDate),
        lastUpdated: new Date(),
        dailyMetrics: Object.entries(dailyMetrics)
            .map(([date, data]) => ({
                date: new Date(date),
                amountSpent: data.spent,
                impressions: data.impressions,
                clicks: data.clicks,
                platforms: data.platforms,
                avgCpc: data.clicks > 0 ? data.spent / data.clicks : 0,
                ctr: data.impressions > 0 ? (data.clicks / data.impressions) : 0
            }))
            .sort((a, b) => a.date - b.date),
        performanceByBrowser: dimensionMetrics.performanceByBrowser,
        performanceByOS: dimensionMetrics.performanceByOS,
        performanceByRegion: dimensionMetrics.performanceByRegion,
        performanceByCountry: dimensionMetrics.performanceByCountry
    };
}

function processDailyMetrics(metricsMap, results, platform) {
    results.forEach(result => {
        const dateStr = formatDate(result.date);
        if (!dateStr || !metricsMap[dateStr]) return;

        const dayMetrics = metricsMap[dateStr];
        dayMetrics.spent += getNumber(result.spent || result.spend || result.total_cost);
        dayMetrics.impressions += getNumber(result.impressions || result.total_impressions);
        dayMetrics.clicks += getNumber(result.clicks || result.total_clicks);
        if (!dayMetrics.platforms.includes(platform)) {
            dayMetrics.platforms.push(platform);
        }

        console.log(`${dateStr} - ${platform}: spent=${dayMetrics.spent}, clicks=${dayMetrics.clicks}, impressions=${dayMetrics.impressions}`);
    });
}

function processDimensionMetrics(dimensionMetrics, platform, document) {
    if (!document) return;

    // Process region metrics if available
    if (document.performanceByRegion) {
        processRegionMetrics(dimensionMetrics, platform, document.performanceByRegion);
    }

    // Process browser metrics
    if (document.performanceByBrowser) {
        processBrowserMetrics(dimensionMetrics, platform, document.performanceByBrowser);
    }

    // Process OS metrics
    if (document.performanceByOS) {
        processOSMetrics(dimensionMetrics, platform, document.performanceByOS);
    }
}

function processOSMetrics(dimensionMetrics, platform, osData) {
    // Initialize standard OS categories
    const standardOS = {
        'Windows': { clicks: 0, impressions: 0, spent: 0, visible_impressions: 0 },
        'Linux': { clicks: 0, impressions: 0, spent: 0, visible_impressions: 0 },
        'Mac OS X': { clicks: 0, impressions: 0, spent: 0, visible_impressions: 0 },
        'Android': { clicks: 0, impressions: 0, spent: 0, visible_impressions: 0 },
        'Unknown': { clicks: 0, impressions: 0, spent: 0, visible_impressions: 0 }
    };

    const metrics = platform === 'mgid' ? 
        Object.values(osData).flat() : 
        Array.isArray(osData) ? osData : Object.values(osData).flat();

    metrics.forEach(metric => {
        if (!metric) return;

        const osName = mapOperatingSystem(metric['Operating system'] || metric.os_family);
        const targetOS = standardOS[osName];

        // Accumulate metrics
        targetOS.clicks += getNumber(metric.clicks || metric.Clicks);
        targetOS.impressions += getNumber(metric.impressions);
        targetOS.spent += getNumber(metric.spent || metric['Spent, INR']);
        targetOS.visible_impressions += getNumber(metric.visible_impressions || 0);
    });

    // Convert accumulated data to final format
    dimensionMetrics.performanceByOS = Object.entries(standardOS)
        .filter(([_, data]) => data.clicks > 0 || data.impressions > 0 || data.spent > 0)
        .map(([os_family, data]) => ({
            os_family,
            platform: 'DESK',
            platform_name: 'Desktop',
            ...data,
            ctr: data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0,
            cpc: data.clicks > 0 ? data.spent / data.clicks : 0
        }));
}


function processRegionMetrics(dimensionMetrics, platform, regionData) {
    const metrics = platform === 'mgid' ? 
        Object.values(regionData).flat() : 
        Array.isArray(regionData) ? regionData : Object.values(regionData).flat();

    metrics.forEach(metric => {
        if (!metric) return;

        const regionName = metric.Region || metric.region;
        if (!regionName) return;

        const existingMetric = dimensionMetrics.performanceByRegion.find(
            m => m.region === regionName
        );

        const newMetrics = {
            clicks: getNumber(metric.clicks || metric.Clicks),
            impressions: getNumber(metric.impressions),
            spent: getNumber(metric.spent || metric['Spent, INR']),
            visible_impressions: getNumber(metric.visible_impressions || 0)
        };

        if (existingMetric) {
            existingMetric.clicks += newMetrics.clicks;
            existingMetric.impressions += newMetrics.impressions;
            existingMetric.spent += newMetrics.spent;
            existingMetric.visible_impressions += newMetrics.visible_impressions;
            
            existingMetric.ctr = existingMetric.impressions > 0 ? 
                (existingMetric.clicks / existingMetric.impressions) * 100 : 0;
            existingMetric.cpc = existingMetric.clicks > 0 ? 
                existingMetric.spent / existingMetric.clicks : 0;
        } else {
            dimensionMetrics.performanceByRegion.push({
                region: regionName,
                country: "India",
                country_code: "IN",
                ...newMetrics,
                ctr: newMetrics.impressions > 0 ? 
                    (newMetrics.clicks / newMetrics.impressions) * 100 : 0,
                cpc: newMetrics.clicks > 0 ? 
                    newMetrics.spent / newMetrics.clicks : 0
            });
        }
    });
}


function mapBrowserName(browserName) {
    if (!browserName) return 'Other';
    
    const browserMap = {
        'chrome': 'Chrome',
        'edge': 'Edge',
        'firefox': 'Firefox',
        'safari': 'Safari',
        'opera': 'Opera',
        'samsung': 'Samsung Browser',
        'chromium': 'Chromium',
        'yandex': 'Yandex',
        'internet explorer': 'Internet Explorer',
        'ie': 'Internet Explorer'
    };

    const normalizedName = browserName.toLowerCase();
    for (const [key, value] of Object.entries(browserMap)) {
        if (normalizedName.includes(key)) return value;
    }
    return 'Other';
}

function mapOperatingSystem(osName) {
    if (!osName) return 'Unknown';
    const osLower = osName.toLowerCase();
    
    if (osLower.includes('windows')) return 'Windows';
    if (osLower.includes('linux')) return 'Linux';
    if (osLower.includes('mac') || osLower.includes('ios')) return 'Mac OS X';
    if (osLower.includes('android')) return 'Android';
    return 'Unknown';
}

function getNumber(value) {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const cleanValue = value.replace(/[^0-9.-]+/g, '').trim();
        return cleanValue.includes('.') ? parseFloat(cleanValue) : parseInt(cleanValue) || 0;
    }
    return 0;
}
function processTaboolaDimensions(document, browserMetrics, osMetrics) {
    if (document.results && Array.isArray(document.results)) {
        document.results.forEach(result => {
            const browserKey = mapBrowserName(result.browser, 'taboola');
            const osKey = mapOperatingSystem(result.os_family, 'taboola');

            if (browserMetrics[browserKey]) {
                addMetrics(browserMetrics[browserKey], result);
            }
            if (osMetrics[osKey]) {
                addMetrics(osMetrics[osKey], result);
            }
        });
    }
}

function processMgidDimensions(document, browserMetrics, osMetrics) {
    if (document.performanceByBrowser) {
        Object.values(document.performanceByBrowser).forEach(dateMetrics => {
            if (Array.isArray(dateMetrics)) {
                dateMetrics.forEach(metric => {
                    const browserKey = mapBrowserName(metric.Browser, 'mgid');
                    if (browserMetrics[browserKey]) {
                        addMgidMetrics(browserMetrics[browserKey], metric);
                    }
                });
            }
        });
    }

    if (document.performanceByOS) {
        Object.values(document.performanceByOS).forEach(dateMetrics => {
            if (Array.isArray(dateMetrics)) {
                dateMetrics.forEach(metric => {
                    const osKey = mapOperatingSystem(metric['Operating system'], 'mgid');
                    if (osMetrics[osKey]) {
                        addMgidMetrics(osMetrics[osKey], metric);
                    }
                });
            }
        });
    }
}

function processOutbrainDimensions(document, browserMetrics, osMetrics) {
    // Process Outbrain's specific format
    if (document.performanceByBrowser) {
        Object.entries(document.performanceByBrowser).forEach(([date, metrics]) => {
            metrics.forEach(metric => {
                const browserKey = mapBrowserName(metric.browser || metric.Browser, 'outbrain');
                if (browserMetrics[browserKey]) {
                    addOutbrainMetrics(browserMetrics[browserKey], metric);
                }
            });
        });
    }

    if (document.performanceByOS) {
        Object.entries(document.performanceByOS).forEach(([date, metrics]) => {
            metrics.forEach(metric => {
                const osKey = mapOperatingSystem(metric.os || metric.operatingSystem, 'outbrain');
                if (osMetrics[osKey]) {
                    addOutbrainMetrics(osMetrics[osKey], metric);
                }
            });
        });
    }
}

function processDV360Dimensions(document, browserMetrics, osMetrics) {
    // Process DV360's specific format
    if (document.browserBreakdown) {
        document.browserBreakdown.forEach(metric => {
            const browserKey = mapBrowserName(metric.browserType, 'dv360');
            if (browserMetrics[browserKey]) {
                addDV360Metrics(browserMetrics[browserKey], metric);
            }
        });
    }

    if (document.osBreakdown) {
        document.osBreakdown.forEach(metric => {
            const osKey = mapOperatingSystem(metric.operatingSystem, 'dv360');
            if (osMetrics[osKey]) {
                addDV360Metrics(osMetrics[osKey], metric);
            }
        });
    }
}

function addOutbrainMetrics(target, source) {
    target.clicks += getNumber(source.clicks);
    target.impressions += getNumber(source.impressions);
    target.spent += getNumber(source.spend);
    // Add Outbrain-specific fields if needed
}

function addDV360Metrics(target, source) {
    target.clicks += getNumber(source.clicks);
    target.impressions += getNumber(source.impressions);
    target.spent += getNumber(source.revenue);
    // Add DV360-specific fields if needed
}

// Helper functions for metrics initialization and calculations
function initializeBrowserMetrics() {
    return {
        'Chrome': createMetricTemplate('Chrome'),
        'Edge': createMetricTemplate('Edge'),
        'Firefox': createMetricTemplate('Firefox'),
        'Safari': createMetricTemplate('Safari'),
        'Opera': createMetricTemplate('Opera'),
        'Samsung Browser': createMetricTemplate('Samsung Browser'),
        'Chromium': createMetricTemplate('Chromium'),
        'Yandex': createMetricTemplate('Yandex'),
        'Internet Explorer': createMetricTemplate('Internet Explorer'),
        'Other': createMetricTemplate('Other')
    };
}

function initializeOSMetrics() {
    return {
        'Windows': createMetricTemplate('Windows', true),
        'Linux': createMetricTemplate('Linux', true),
        'Mac OS X': createMetricTemplate('Mac OS X', true),
        'Android': createMetricTemplate('Android', true),
        'Unknown': createMetricTemplate('Unknown', true)
    };
}

function createMetricTemplate(name, isOS = false) {
    return {
        [isOS ? 'os_family' : 'browser']: name,
        platform: 'DESK',
        platform_name: 'Desktop',
        clicks: 0,
        impressions: 0,
        visible_impressions: 0,
        spent: 0,
        conversions_value: 0,
        roas: 0,
        roas_clicks: 0,
        roas_views: 0,
        ctr: 0,
        vctr: 0,
        cpm: 0,
        vcpm: 0,
        cpc: 0
    };
}



function updateCalculatedMetrics(metrics) {
    metrics.ctr = metrics.impressions > 0 ? (metrics.clicks / metrics.impressions) * 100 : 0;
    metrics.cpc = metrics.clicks > 0 ? metrics.spent / metrics.clicks : 0;
    metrics.cpm = metrics.impressions > 0 ? (metrics.spent / metrics.impressions) * 1000 : 0;
}

function addMetrics(target, source) {
    target.clicks += getNumber(source.clicks);
    target.impressions += getNumber(source.impressions);
    target.visible_impressions += getNumber(source.visible_impressions);
    target.spent += getNumber(source.spent);
    target.conversions_value += getNumber(source.conversions_value);
}

function addMgidMetrics(target, source) {
    target.clicks += getNumber(source.Clicks);
    target.impressions += getNumber(source.impressions || 0);
    target.spent += getNumber(source['Spent, INR']);
}

// Maps for standardizing data across platforms
const BROWSER_MAPPINGS = {
    // Standard browsers
    'chrome': 'Chrome',
    'google chrome': 'Chrome',
    'edge': 'Edge',
    'microsoft edge': 'Edge',
    'firefox': 'Firefox',
    'mozilla firefox': 'Firefox',
    'safari': 'Safari',
    'opera': 'Opera',
    'samsung browser': 'Samsung Browser',
    'samsung': 'Samsung Browser',
    'chromium': 'Chromium',
    'yandex': 'Yandex',
    'internet explorer': 'Internet Explorer',
    'ie': 'Internet Explorer',
    
    // Mobile browsers
    'android browser': 'Chrome',
    'chrome mobile': 'Chrome',
    'mobile safari': 'Safari',
    'webview': 'Chrome',
    'facebook': 'Other',
    'instagram': 'Other'
};

const OS_MAPPINGS = {
    // Desktop OS
    'windows': 'Windows',
    'linux': 'Linux',
    'mac os': 'Mac OS X',
    'macos': 'Mac OS X',
    
    // Mobile OS
    'android': 'Android',
    'ios': 'Mac OS X',  // Group iOS with Mac OS
    'mobile android': 'Android'
};

// Standard metric template for consistency across platforms

function mapToOSFamily(osName) {
    osName = osName.toLowerCase();
    
    if (osName.includes('android') || osName.includes('mobile android')) {
        return 'Android';
    }
    if (osName.includes('linux')) {
        return 'Linux';
    }
    if (osName.includes('windows')) {
        return 'Windows';
    }
    if (osName.includes('mac') || osName.includes('ios')) {
        return 'Mac OS X';
    }
    return 'Unknown';
}

function getDateRange(campaigns) {
    const allDates = campaigns.flatMap(c => [
        new Date(c.startDate),
        new Date(c.endDate)
    ]).filter(d => !isNaN(d.getTime()));

    return {
        startDate: new Date(Math.min(...allDates)).toISOString().split('T')[0],
        endDate: new Date(Math.max(...allDates)).toISOString().split('T')[0]
    };
}

function generateDailyMetrics(dateRange) {
    const metrics = {};
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        const dateStr = date.toISOString().split('T')[0];
        metrics[dateStr] = {
            spent: 0,
            impressions: 0,
            clicks: 0,
            platforms: []
        };
    }

    return metrics;
}


function processPlatformDimension(dimensionArray, data, platform) {
    if (!data) return;

    const metrics = Array.isArray(data) ? data : Object.values(data).flat();
    metrics.forEach(metric => {
        if (!metric) return;

        if (platform === 'mgid') {
            // Convert MGID string values to numbers
            dimensionArray.push({
                ...metric,
                Clicks: getNumber(metric.Clicks),
                'Spent, INR': getNumber(metric['Spent, INR']),
                Percent: getNumber(metric.Percent),
                clicks: getNumber(metric.Clicks),
                impressions: getNumber(metric.impressions || 0),
                spent: getNumber(metric['Spent, INR']),
                ctr: getNumber(metric.Percent),
                cpc: getNumber(metric['Spent, INR']) / getNumber(metric.Clicks)
            });
        } else {
            // Process other platforms normally
            dimensionArray.push({
                ...metric,
                clicks: getNumber(metric.clicks || metric.Clicks),
                impressions: getNumber(metric.impressions),
                spent: getNumber(metric.spent || metric['Spent, INR']),
                ctr: getNumber(metric.ctr),
                cpc: getNumber(metric.cpc)
            });
        }
    });
}


function formatDate(dateStr) {
    if (!dateStr) return null;
    
    try {
        if (dateStr.includes('/')) {
            const [day, month, year] = dateStr.split('/');
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        
        const date = new Date(dateStr);
        return date.toISOString().split('T')[0];
    } catch (error) {
        console.error(`Error formatting date: ${dateStr}`, error);
        return null;
    }
}

function createStandardMetric(name) {
    return {
        platform: 'DESK',
        platform_name: 'Desktop',
        browser: name,
        clicks: 0,
        impressions: 0,
        visible_impressions: 0,
        spent: 0,
        conversions_value: 0,
        roas: 0,
        roas_clicks: 0,
        roas_views: 0,
        ctr: 0,
        vctr: 0,
        cpm: 0,
        vcpm: 0,
        cpc: 0,
        cpa: 0,
        cpa_clicks: 0,
        cpa_views: 0,
        cpa_actions_num: 0,
        cpa_actions_num_from_clicks: 0,
        cpa_actions_num_from_views: 0,
        cpa_conversion_rate: 0,
        cpa_conversion_rate_clicks: 0,
        cpa_conversion_rate_views: 0
    };
}

function processBrowserMetrics(dimensionMetrics, platform, browserData) {
    // Initialize standard browser categories if not exists
    const standardBrowsers = {
        'Chrome': { clicks: 0, impressions: 0, spent: 0, visible_impressions: 0 },
        'Edge': { clicks: 0, impressions: 0, spent: 0, visible_impressions: 0 },
        'Firefox': { clicks: 0, impressions: 0, spent: 0, visible_impressions: 0 },
        'Safari': { clicks: 0, impressions: 0, spent: 0, visible_impressions: 0 },
        'Opera': { clicks: 0, impressions: 0, spent: 0, visible_impressions: 0 },
        'Samsung Browser': { clicks: 0, impressions: 0, spent: 0, visible_impressions: 0 },
        'Chromium': { clicks: 0, impressions: 0, spent: 0, visible_impressions: 0 },
        'Yandex': { clicks: 0, impressions: 0, spent: 0, visible_impressions: 0 },
        'Internet Explorer': { clicks: 0, impressions: 0, spent: 0, visible_impressions: 0 },
        'Other': { clicks: 0, impressions: 0, spent: 0, visible_impressions: 0 }
    };

    const metrics = platform === 'mgid' ? 
        Object.values(browserData).flat() : 
        Array.isArray(browserData) ? browserData : Object.values(browserData).flat();

    metrics.forEach(metric => {
        if (!metric) return;

        const browserName = mapBrowserName(metric.Browser || metric.browser);
        const targetBrowser = standardBrowsers[browserName] || standardBrowsers['Other'];

        // Accumulate metrics
        targetBrowser.clicks += getNumber(metric.clicks || metric.Clicks);
        targetBrowser.impressions += getNumber(metric.impressions);
        targetBrowser.spent += getNumber(metric.spent || metric['Spent, INR']);
        targetBrowser.visible_impressions += getNumber(metric.visible_impressions || 0);
    });

    // Convert accumulated data to final format
    dimensionMetrics.performanceByBrowser = Object.entries(standardBrowsers)
        .filter(([_, data]) => data.clicks > 0 || data.impressions > 0 || data.spent > 0)
        .map(([browser, data]) => ({
            browser,
            platform: 'DESK',
            platform_name: 'Desktop',
            ...data,
            ctr: data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0,
            cpc: data.clicks > 0 ? data.spent / data.clicks : 0
        }));
}



async function testWithRealData() {
    let client;
    try {
        client = await connectToMongo();
        const clientEmail = 'test@gmail.com';
        
        console.log('\n=== Starting Data Integrity Test ===');
        console.log(`Testing for client: ${clientEmail}`);

        // Process metrics
        const results = await storeDailyMetricsForClient(clientEmail);
        
        // Test results for each RO
        for (const ro of results) {
            console.log(`\n=== Testing RO: ${ro.roNumber} ===`);
            
            // Get source data for verification
            const sourceData = await getSourceData(client.db('campaignAnalytics'), ro);
            
            // Test Daily Metrics
            console.log('\n--- Daily Metrics Verification ---');
            testDailyMetrics(ro.dailyMetrics, sourceData);

            // Test Browser Metrics
            console.log('\n--- Browser Metrics Verification ---');
            testBrowserMetrics(ro.performanceByBrowser, sourceData);

            // Test OS Metrics
            console.log('\n--- OS Metrics Verification ---');
            testOSMetrics(ro.performanceByOS, sourceData);

            // Test Region Metrics
            console.log('\n--- Region Metrics Verification ---');
            testRegionMetrics(ro.performanceByRegion, sourceData);
        }

        return true;
    } catch (error) {
        console.error('Test failed:', error);
        throw error;
    } finally {
        if (client) await client.close();
    }
}

async function getSourceData(db, ro) {
    const campaigns = await db.collection('campaigns')
        .find({ roNumber: ro.roNumber })
        .toArray();

    const sourceData = {
        daily: {},
        browser: {},
        os: {},
        region: {},
        platforms: {}
    };

    for (const campaign of campaigns) {
        const [taboola, outbrain, mgid, dv360] = await Promise.all([
            db.collection('taboolaData').find({ campaignId: campaign.campaignId }).toArray(),
            db.collection('outbrainNewDataFormat').find({ campaignId: campaign.campaignId }).toArray(),
            db.collection('mgid_transformed_data').find({ campaignId: campaign.campaignId }).toArray(),
            db.collection('dv360Data').find({ campaignId: campaign.campaignId }).toArray()
        ]);

        // Store platform data for verification
        sourceData.platforms = { taboola, outbrain, mgid, dv360 };

        // Process daily metrics from each platform
        processPlatformData(sourceData, taboola, 'taboola');
        processPlatformData(sourceData, outbrain, 'outbrain');
        processPlatformData(sourceData, mgid, 'mgid');
        processPlatformData(sourceData, dv360, 'dv360');
    }

    return sourceData;
}

function processPlatformData(sourceData, documents, platform) {
    documents.forEach(doc => {
        // Process daily metrics
        if (doc?.campaignPerformanceResult?.results) {
            doc.campaignPerformanceResult.results.forEach(result => {
                const dateStr = formatDate(result.date);
                if (!dateStr) return;

                if (!sourceData.daily[dateStr]) {
                    sourceData.daily[dateStr] = {
                        clicks: 0,
                        impressions: 0,
                        spent: 0,
                        platforms: new Set()
                    };
                }

                const metrics = sourceData.daily[dateStr];
                metrics.clicks += getNumber(result.clicks || result.Clicks);
                metrics.impressions += getNumber(result.impressions);
                metrics.spent += getNumber(result.spent || result['Spent, INR']);
                metrics.platforms.add(platform);
            });
        }

        // Process dimension metrics
        processDimensionData(sourceData, doc, platform);
    });
}

function testDailyMetrics(storedMetrics, sourceData) {
    storedMetrics.forEach(dayMetric => {
        const dateStr = dayMetric.date.toISOString().split('T')[0];
        const sourceMetrics = sourceData.daily[dateStr];

        if (sourceMetrics) {
            console.log(`\nDate: ${dateStr}`);
            
            // Check total metrics
            const clicksMatch = dayMetric.clicks === sourceMetrics.clicks;
            const impressionsMatch = dayMetric.impressions === sourceMetrics.impressions;
            const spentMatch = Math.abs(dayMetric.amountSpent - sourceMetrics.spent) < 0.01;

            console.log(`Clicks: ${clicksMatch ? '✅' : '❌'} (Stored: ${dayMetric.clicks}, Source: ${sourceMetrics.clicks})`);
            console.log(`Impressions: ${impressionsMatch ? '✅' : '❌'} (Stored: ${dayMetric.impressions}, Source: ${sourceMetrics.impressions})`);
            console.log(`Spent: ${spentMatch ? '✅' : '❌'} (Stored: ${dayMetric.amountSpent}, Source: ${sourceMetrics.spent})`);
            
            // Check platforms
            const platformsMatch = Array.from(sourceMetrics.platforms).every(p => dayMetric.platforms.includes(p));
            console.log(`Platforms: ${platformsMatch ? '✅' : '❌'}`);
            console.log(`Stored: ${dayMetric.platforms.join(', ')}`);
            console.log(`Source: ${Array.from(sourceMetrics.platforms).join(', ')}`);
        }
    });
}

function testBrowserMetrics(storedMetrics, sourceData) {
    const browserMap = new Map();
    Object.values(sourceData.platforms).forEach(platform => {
        platform.forEach(doc => {
            if (doc?.performanceByBrowser) {
                const metrics = Array.isArray(doc.performanceByBrowser) ? 
                    doc.performanceByBrowser : 
                    Object.values(doc.performanceByBrowser).flat();

                metrics.forEach(metric => {
                    const browserName = mapBrowserName(metric.Browser || metric.browser);
                    if (!browserMap.has(browserName)) {
                        browserMap.set(browserName, { clicks: 0, impressions: 0, spent: 0 });
                    }
                    const browser = browserMap.get(browserName);
                    browser.clicks += getNumber(metric.clicks || metric.Clicks);
                    browser.impressions += getNumber(metric.impressions);
                    browser.spent += getNumber(metric.spent || metric['Spent, INR']);
                });
            }
        });
    });

    console.log('\nBrowser Metrics Validation:');
    storedMetrics.forEach(metric => {
        const browserName = metric.browser;
        const sourceMetrics = browserMap.get(browserName);
        
        if (sourceMetrics) {
            console.log(`\n${browserName}:`);
            console.log(`Clicks: ${metric.clicks === sourceMetrics.clicks ? '✅' : '❌'} (${metric.clicks} vs ${sourceMetrics.clicks})`);
            console.log(`Impressions: ${metric.impressions === sourceMetrics.impressions ? '✅' : '❌'} (${metric.impressions} vs ${sourceMetrics.impressions})`);
            console.log(`Spent: ${Math.abs(metric.spent - sourceMetrics.spent) < 0.01 ? '✅' : '❌'} (${metric.spent} vs ${sourceMetrics.spent})`);
        }
    });
}

function processDimensionData(sourceData, doc, platform) {
    // Process Browser metrics
    if (doc.performanceByBrowser) {
        const browserMetrics = Array.isArray(doc.performanceByBrowser) ? 
            doc.performanceByBrowser : 
            Object.values(doc.performanceByBrowser).flat();

        browserMetrics.forEach(metric => {
            const browserName = mapBrowserName(metric.Browser || metric.browser);
            if (!sourceData.browser[browserName]) {
                sourceData.browser[browserName] = {
                    clicks: 0,
                    impressions: 0,
                    spent: 0,
                    platform: platform
                };
            }
            sourceData.browser[browserName].clicks += getNumber(metric.clicks || metric.Clicks);
            sourceData.browser[browserName].impressions += getNumber(metric.impressions);
            sourceData.browser[browserName].spent += getNumber(metric.spent || metric['Spent, INR']);
        });
    }

    // Process OS metrics
    if (doc.performanceByOS) {
        const osMetrics = Array.isArray(doc.performanceByOS) ? 
            doc.performanceByOS : 
            Object.values(doc.performanceByOS).flat();

        osMetrics.forEach(metric => {
            const osName = mapOperatingSystem(metric['Operating system'] || metric.os_family);
            if (!sourceData.os[osName]) {
                sourceData.os[osName] = {
                    clicks: 0,
                    impressions: 0,
                    spent: 0,
                    platform: platform
                };
            }
            sourceData.os[osName].clicks += getNumber(metric.clicks || metric.Clicks);
            sourceData.os[osName].impressions += getNumber(metric.impressions);
            sourceData.os[osName].spent += getNumber(metric.spent || metric['Spent, INR']);
        });
    }

    // Process Region metrics
    if (doc.performanceByRegion) {
        const regionMetrics = Array.isArray(doc.performanceByRegion) ? 
            doc.performanceByRegion : 
            Object.values(doc.performanceByRegion).flat();

        regionMetrics.forEach(metric => {
            const regionName = metric.Region || metric.region;
            if (!regionName) return;

            if (!sourceData.region[regionName]) {
                sourceData.region[regionName] = {
                    clicks: 0,
                    impressions: 0,
                    spent: 0,
                    platform: platform
                };
            }
            sourceData.region[regionName].clicks += getNumber(metric.clicks || metric.Clicks);
            sourceData.region[regionName].impressions += getNumber(metric.impressions);
            sourceData.region[regionName].spent += getNumber(metric.spent || metric['Spent, INR']);
        });
    }
}

function testOSMetrics(storedMetrics, sourceData) {
    console.log('\nOS Metrics Validation:');
    storedMetrics.forEach(metric => {
        const osName = metric.os_family;
        const sourceMetrics = sourceData.os[osName];
        
        if (sourceMetrics) {
            console.log(`\n${osName}:`);
            console.log(`Clicks: ${metric.clicks === sourceMetrics.clicks ? '✅' : '❌'} (${metric.clicks} vs ${sourceMetrics.clicks})`);
            console.log(`Impressions: ${metric.impressions === sourceMetrics.impressions ? '✅' : '❌'} (${metric.impressions} vs ${sourceMetrics.impressions})`);
            console.log(`Spent: ${Math.abs(metric.spent - sourceMetrics.spent) < 0.01 ? '✅' : '❌'} (${metric.spent} vs ${sourceMetrics.spent})`);
        }
    });
}

function testRegionMetrics(storedMetrics, sourceData) {
    console.log('\nRegion Metrics Validation:');
    storedMetrics.forEach(metric => {
        const regionName = metric.region;
        const sourceMetrics = sourceData.region[regionName];
        
        if (sourceMetrics) {
            console.log(`\n${regionName}:`);
            console.log(`Clicks: ${metric.clicks === sourceMetrics.clicks ? '✅' : '❌'} (${metric.clicks} vs ${sourceMetrics.clicks})`);
            console.log(`Impressions: ${metric.impressions === sourceMetrics.impressions ? '✅' : '❌'} (${metric.impressions} vs ${sourceMetrics.impressions})`);
            console.log(`Spent: ${Math.abs(metric.spent - sourceMetrics.spent) < 0.01 ? '✅' : '❌'} (${metric.spent} vs ${sourceMetrics.spent})`);
        }
    });
}

// Similar functions for OS and Region metrics testing...


export { storeDailyMetricsForClient, testWithRealData};