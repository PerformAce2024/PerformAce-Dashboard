import { storeDailyMetricsForClient } from '../services/campaignDailyMetricsService.js';
import { connectToMongo } from '../config/db.js';

export const getPerformanceByBrowser = async (req, res) => {
    const { clientEmail, startDate, endDate } = req.query;
    let client;
    try {
        client = await connectToMongo();
        const db = client.db('campaignAnalytics');
        
        const data = await db.collection('clientDailyMetrics').findOne({ 
            clientEmail, startDate, endDate 
        });
        
        res.json(data?.performanceByBrowser || []);
    } catch (error) {
        res.status(500).json({ message: error.message });
    } finally {
        if (client) await client.close();
    }
};

export const getPerformanceByOS = async (req, res) => {
    const { clientEmail, startDate, endDate } = req.query;
    let client;
    try {
        client = await connectToMongo();
        const db = client.db('campaignAnalytics');
        
        const data = await db.collection('clientDailyMetrics').findOne({ 
            clientEmail, startDate, endDate 
        });
        
        // The data will now have osFamily instead of os in each record
        res.json(data?.performanceByOS || []);
    } catch (error) {
        res.status(500).json({ message: error.message });
    } finally {
        if (client) await client.close();
    }
};

export const getPerformanceByRegion = async (req, res) => {
    const { clientEmail, startDate, endDate } = req.query;
    let client;
    try {
        client = await connectToMongo();
        const db = client.db('campaignAnalytics');
        
        const data = await db.collection('clientDailyMetrics').findOne({ 
            clientEmail, startDate, endDate 
        });
        
        const regionData = data?.performanceByRegion || [];
        
        const response = {
            totalClicks: regionData.reduce((sum, item) => sum + item.clicks, 0),
            totalImpressions: regionData.reduce((sum, item) => sum + item.impressions, 0),
            allStatesData: regionData.map(item => ({
                state: item.region,
                clicks: item.clicks,
                impressions: item.impressions
            }))
        };
        
        res.json(response);
    } catch (error) {
        res.status(500).json({ message: error.message });
    } finally {
        if (client) await client.close();
    }
};

export const getTop3Clicks = async (req, res) => {
    const { clientEmail, startDate, endDate } = req.query;
    let client;
    try {
        client = await connectToMongo();
        const db = client.db('campaignAnalytics');
        
        const data = await db.collection('clientDailyMetrics').findOne({ 
            clientEmail, startDate, endDate 
        });

        const regionData = data?.performanceByRegion || [];
        const totalClicks = regionData.reduce((sum, item) => sum + item.clicks, 0);
        const sortedData = [...regionData].sort((a, b) => b.clicks - a.clicks);
        
        const top3 = sortedData.slice(0, 3);
        const otherClicks = sortedData.slice(3)
            .reduce((sum, item) => sum + item.clicks, 0);

        const result = {
            totalClicks: { clicks: totalClicks },
            top3ClicksData: [
                ...top3.map(item => ({
                    state: item.region,
                    clicks: item.clicks
                }))
            ]
        };

        if (otherClicks > 0) {
            result.top3ClicksData.push({ state: "Other", clicks: otherClicks });
        }

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    } finally {
        if (client) await client.close();
    }
};

export const getTop7States = async (req, res) => {
    const { clientEmail, startDate, endDate } = req.query;
    let client;
    try {
        client = await connectToMongo();
        const db = client.db('campaignAnalytics');
        
        const data = await db.collection('clientDailyMetrics').findOne({ 
            clientEmail, startDate, endDate 
        });

        const regionData = data?.performanceByRegion || [];
        const totalClicks = regionData.reduce((sum, item) => sum + item.clicks, 0);
        const sortedData = [...regionData].sort((a, b) => b.clicks - a.clicks);
        
        const top7 = sortedData.slice(0, 7);
        const otherClicks = sortedData.slice(7)
            .reduce((sum, item) => sum + item.clicks, 0);

        const result = {
            totalClicks,
            top7ClicksData: [
                ...top7.map(item => ({
                    state: item.region,
                    clicks: item.clicks
                }))
            ]
        };

        if (otherClicks > 0) {
            result.top7ClicksData.push({ state: "Other", clicks: otherClicks });
        }

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    } finally {
        if (client) await client.close();
    }
};
export const getCampaignDailyMetrics = async (req, res) => {
    const { clientEmail, startDate, endDate } = req.query;
    let client;
    try {
        client = await connectToMongo();
        const db = client.db('campaignAnalytics');
        
        const data = await db.collection('clientDailyMetrics').findOne({ 
            clientEmail, startDate, endDate 
        });

        if (!data) {
            return res.json({
                campaignId: "",
                dailyMetrics: []
            });
        }

        // Format data for response
        const response = {
            campaignId: data.campaignId || "",
            dailyMetrics: data.dailyMetrics.map(metric => ({
                date: metric.date,
                amountSpent: metric.amountSpent,
                impressions: metric.impressions,
                clicks: metric.clicks,
                avgCpc: metric.avgCpc,
                ctr: metric.ctr
            }))
        };

        res.json(response);
    } catch (error) {
        res.status(500).json({ message: error.message });
    } finally {
        if (client) await client.close();
    }
};

export const getNativeHubMetrics = async (req, res) => {
    const { clientEmail, startDate, endDate } = req.query;
    let client;
    try {
        client = await connectToMongo();
        const db = client.db('campaignAnalytics');
        
        const data = await db.collection('clientDailyMetrics').findOne({ 
            clientEmail, startDate, endDate 
        });

        if (!data) {
            return res.json({
                startDate,
                endDate,
                currentDate: new Date().toISOString().split('T')[0],
                totalClicks: 0,
                totalImpressions: 0,
                totalSpent: 0,
                averageCTR: "0.00",
                clicksData: []
            });
        }

        const totalClicks = data.dailyMetrics.reduce((sum, day) => sum + day.clicks, 0);
        const totalImpressions = data.dailyMetrics.reduce((sum, day) => sum + day.impressions, 0);
        const totalSpent = data.dailyMetrics.reduce((sum, day) => sum + day.amountSpent, 0);

        const response = {
            startDate,
            endDate,
            currentDate: new Date().toISOString().split('T')[0],
            totalClicks,
            totalImpressions,
            totalSpent,
            averageCTR: totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0.00",
            clicksData: data.dailyMetrics.map(day => ({
                date: `${day.date} 00:00:00.0`,
                clicks: day.clicks
            })).reverse()
        };

        res.json(response);
    } catch (error) {
        res.status(500).json({ message: error.message });
    } finally {
        if (client) await client.close();
    }
};

export const getTotalMetrics = async (req, res) => {
    const { clientEmail, startDate, endDate } = req.query;
    let client;
    try {
        client = await connectToMongo();
        const db = client.db('campaignAnalytics');
        
        const data = await db.collection('clientDailyMetrics').findOne({ 
            clientEmail, startDate, endDate 
        });

        if (!data) {
            return res.json({
                totalClicks: 0,
                totalImpressions: 0,
                totalSpent: 0,
                averageCTR: "0.00",
                clicksData: []
            });
        }

        const response = {
            totalClicks: data.dailyMetrics.reduce((sum, day) => sum + day.clicks, 0),
            totalImpressions: data.dailyMetrics.reduce((sum, day) => sum + day.impressions, 0),
            totalSpent: data.dailyMetrics.reduce((sum, day) => sum + day.amountSpent, 0),
            averageCTR: calculateAverageCTR(data.dailyMetrics),
            clicksData: data.dailyMetrics.map(day => ({
                date: `${day.date} 00:00:00.0`,
                clicks: day.clicks
            })).reverse()
        };

        res.json(response);
    } catch (error) {
        res.status(500).json({ message: error.message });
    } finally {
        if (client) await client.close();
    }
};

function calculateAverageCTR(metrics) {
    const totalClicks = metrics.reduce((sum, day) => sum + day.clicks, 0);
    const totalImpressions = metrics.reduce((sum, day) => sum + day.impressions, 0);
    return totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0.00";
}