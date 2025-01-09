import MetricsRepository from '../repo/metricsRepository.js';

import { storeDailyMetricsForClient as storeMetrics } from '../services/campaignDailyMetricsService.js';

export const storeDailyMetricsForClient = async (req, res) => {
    const { clientEmail, roNumber } = req.body;
    
    // Validate required fields
    if (!clientEmail) {
        return res.status(400).json({ 
            success: false, 
            message: 'Client email is required'
        });
    }

    try {
        let results;
        if (roNumber) {
            // Store metrics for specific RO
            results = await storeMetrics(clientEmail, roNumber);
        } else {
            // Store metrics for all ROs
            results = await storeMetrics(clientEmail);
        }
        
        res.json({
            success: true,
            message: roNumber ? 
                `Metrics stored successfully for RO: ${roNumber}` : 
                'Metrics stored successfully for all ROs',
            data: results
        });
    } catch (error) {
        console.error('Error storing metrics:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error storing metrics',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};
// Helper function to wrap your existing service
async function storeDailyMetricsService(clientEmail) {
    return await import('../services/campaignDailyMetricsService.js')
        .then(module => module.storeDailyMetricsForClient(clientEmail));
}
export const getCampaignDailyMetrics = async (req, res) => {
    const { clientEmail, roNumber, startDate, endDate } = req.query;
    try {
        const metrics = await MetricsRepository.findMetrics({ 
            clientEmail, roNumber, startDate, endDate 
        });

        if (!metrics) {
            return res.json({
                roNumber: roNumber || "",
                dailyMetrics: []
            });
        }

        res.json({
            roNumber: metrics.roNumber,
            clientName: metrics.clientName,
            dailyMetrics: metrics.dailyMetrics.map(metric => ({
                date: metric.date,
                amountSpent: metric.amountSpent,
                impressions: metric.impressions,
                clicks: metric.clicks,
                avgCpc: metric.avgCpc,
                ctr: metric.ctr
            }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getPerformanceByBrowser = async (req, res) => {
    try {
        const browserMetrics = await MetricsRepository.getDimensionMetrics({
            ...req.query,
            dimension: 'Browser'
        });
        res.json(browserMetrics);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getPerformanceByOS = async (req, res) => {
    try {
        const osMetrics = await MetricsRepository.getDimensionMetrics({
            ...req.query,
            dimension: 'OS'
        });
        res.json(osMetrics);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getPerformanceByRegion = async (req, res) => {
    try {
        const { regions, totalClicks, totalImpressions, totalCTR } = 
            await MetricsRepository.getRegionStats(req.query);

        res.json({
            totalClicks,
            totalImpressions,
            totalCTR,
            allStatesData: regions.map(region => ({
                state: region.region,
                clicks: region.clicks,
                impressions: region.impressions,
                ctr: region.ctr
            }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getTop3Clicks = async (req, res) => {
    try {
        const { regions, totalClicks, otherClicks } = 
            await MetricsRepository.getRegionStats({ ...req.query, limit: 3 });

        const response = {
            totalClicks: { clicks: totalClicks },
            top3ClicksData: regions.map(region => ({
                state: region.region,
                clicks: region.clicks
            }))
        };

        if (otherClicks > 0) {
            response.top3ClicksData.push({ state: "Other", clicks: otherClicks });
        }

        res.json(response);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getTop7States = async (req, res) => {
    try {
        const { regions, totalClicks, otherClicks, totalCTR } = 
            await MetricsRepository.getRegionStats({ ...req.query, limit: 7 });

        const response = {
            totalClicks,
            totalCTR,
            top7ClicksData: regions.map(region => ({
                state: region.region,
                clicks: region.clicks,
                ctr: region.ctr
            }))
        };

        if (otherClicks > 0) {
            response.top7ClicksData.push({ 
                state: "Other", 
                clicks: otherClicks,
                ctr: "0.00"
            });
        }

        res.json(response);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const getTotalMetrics = async (req, res) => {
    try {
        const metrics = await MetricsRepository.findMetrics(req.query);

        if (!metrics) {
            return res.json({
                totalClicks: 0,
                totalImpressions: 0,
                totalSpent: 0,
                averageCTR: 0.00, // Changed from string to numeric format
                clicksData: []
            });
        }

        // Log the data to verify structure
        console.log('Daily Metrics Sample:', {
            date: metrics.dailyMetrics[0]?.date,
            spent: metrics.dailyMetrics[0]?.spent
        });

        const totals = MetricsRepository.calculateTotalMetrics(metrics.dailyMetrics);

        res.json({
            totalClicks: totals.totalClicks,
            totalImpressions: totals.totalImpressions,
            totalSpent: totals.totalSpent,
            averageCTR: totals.totalImpressions > 0 ? 
                parseFloat(((totals.totalClicks / totals.totalImpressions) * 100).toFixed(2)) : 
                0.00, // Changed from string to numeric format
            clicksData: totals.clicksData
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map(data => ({
                    date: data.date,
                    clicks: data.clicks,
                    impressions: data.impressions,
                    spent: data.spent
                }))
        });
    } catch (error) {
        console.error('Error in getTotalMetrics:', error);
        res.status(500).json({ message: error.message });
    }
};


export const getNativeHubMetrics = async (req, res) => {
    try {
        const metrics = await MetricsRepository.findMetrics(req.query);

        if (!metrics) {
            return res.json({
                startDate: req.query.startDate,
                endDate: req.query.endDate,
                currentDate: new Date().toISOString().split('T')[0],
                totalClicks: 0,
                totalImpressions: 0,
                totalSpent: 0,
                averageCTR: "0.00",
                clicksData: []
            });
        }

        const totals = MetricsRepository.calculateTotalMetrics(metrics.dailyMetrics);
        const startDate = metrics.dailyMetrics[0]?.date;
        const endDate = metrics.dailyMetrics[metrics.dailyMetrics.length - 1]?.date;

        res.json({
            startDate: startDate ? new Date(startDate).toISOString().split('T')[0] : null,
            endDate: endDate ? new Date(endDate).toISOString().split('T')[0] : null,
            currentDate: new Date().toISOString().split('T')[0],
            totalClicks: totals.totalClicks,
            totalImpressions: totals.totalImpressions,
            totalSpent: totals.totalSpent,
            averageCTR: totals.totalImpressions > 0 ?
                ((totals.totalClicks / totals.totalImpressions) * 100).toFixed(2) :
                "0.00",
            clicksData: totals.clicksData
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map(data => ({
                    date: data.date,
                    clicks: data.clicks,
                    impressions: data.impressions,
                    spent: data.spent
                }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getPerformanceBySite = async (req, res) => {
    try {
        const siteMetrics = await MetricsRepository.getDimensionMetrics({
            ...req.query,
            dimension: 'Site'
        });
        res.json(siteMetrics);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getTop10Sites = async (req, res) => {
    try {
        const { sites, totalClicks, otherClicks, totalCTR } = 
            await MetricsRepository.getSiteStats({ ...req.query, limit: 10 });

        const response = {
            totalClicks,
            totalCTR,
            top10SitesData: sites.map(site => ({
                siteName: site.site_name,
                clicks: site.clicks,
                impressions: site.impressions,
                spent: site.spent,
                ctr: site.ctr
            }))
        };

        if (otherClicks > 0) {
            response.top10SitesData.push({
                siteName: "Other",
                clicks: otherClicks,
                impressions: 0,
                spent: 0,
                ctr: "0.00"
            });
        }

        res.json(response);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
