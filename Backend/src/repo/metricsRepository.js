import { connectToMongo } from '../config/db.js';

class MetricsRepository {
    static async findMetrics({ clientEmail, roNumber, startDate, endDate }) {
        let client;
        try {
            client = await connectToMongo();
            const db = client.db('campaignAnalytics');

            // Base query to find document by clientEmail and roNumber
            const query = {
                clientEmail,
                roNumber
            };

            // Find the document
            const document = await db.collection('clientDailyMetrics').findOne(query);
            
            if (!document) return null;

            // If no dates provided, return data up to current date
            if (!startDate || !endDate) {
                const currentDate = new Date();
                const filteredMetrics = document.dailyMetrics.filter(metric => 
                    new Date(metric.date) <= currentDate
                );
                return {
                    ...document,
                    dailyMetrics: filteredMetrics
                };
            }

            // If dates provided, filter metrics within range
            const startDateTime = new Date(startDate);
            const endDateTime = new Date(endDate);
            const currentDate = new Date();

            // If campaign is ongoing, limit to current date
            const effectiveEndDate = endDateTime > currentDate ? currentDate : endDateTime;

            const filteredMetrics = document.dailyMetrics.filter(metric => {
                const metricDate = new Date(metric.date);
                return metricDate >= startDateTime && metricDate <= effectiveEndDate;
            });

            return {
                ...document,
                dailyMetrics: filteredMetrics
            };
        } finally {
            if (client) await client.close();
        }
    }

    static async getDimensionMetrics({ clientEmail, roNumber, startDate, endDate, dimension }) {
        const metrics = await this.findMetrics({ clientEmail, roNumber, startDate, endDate });
        if (!metrics) return [];

        const dimensionKey = `performanceBy${dimension}`;
        return metrics[dimensionKey] || [];
    }

    static calculateTotalMetrics(dailyMetrics) {
        const totalClicks = dailyMetrics.reduce((sum, metric) => sum + metric.clicks, 0);
        const totalImpressions = dailyMetrics.reduce((sum, metric) => sum + metric.impressions, 0);
        const totalSpent = dailyMetrics.reduce((sum, metric) => sum + metric.amountSpent, 0);

        const clicksData = dailyMetrics.map(metric => ({
            date: metric.date,
            clicks: metric.clicks,
            impressions: metric.impressions  // Ensure impressions are included here
        }));

        return {
            totalClicks,
            totalImpressions,
            totalSpent,
            clicksData
        };
    }

    static async getRegionStats({ clientEmail, roNumber, startDate, endDate, limit }) {
        const metrics = await this.findMetrics({ clientEmail, roNumber, startDate, endDate });
        if (!metrics || !metrics.performanceByRegion) {
            return {
                regions: [],
                totalClicks: 0,
                totalImpressions: 0,
                otherClicks: 0
            };
        }

        const sortedRegions = [...metrics.performanceByRegion]
            .sort((a, b) => b.clicks - a.clicks);

        const topRegions = limit ? sortedRegions.slice(0, limit) : sortedRegions;
        const otherClicks = limit ? 
            sortedRegions.slice(limit)
                .reduce((sum, region) => sum + region.clicks, 0) : 0;

        return {
            regions: topRegions,
            totalClicks: sortedRegions.reduce((sum, r) => sum + r.clicks, 0),
            totalImpressions: sortedRegions.reduce((sum, r) => sum + r.impressions, 0),
            otherClicks
        };
    }
}

export default MetricsRepository;