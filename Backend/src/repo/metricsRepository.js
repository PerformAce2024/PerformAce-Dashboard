import { connectToMongo, getDb } from "../config/db.js";

class MetricsRepository {
  static async findMetrics({ clientEmail, roNumber, startDate, endDate }) {
    let client;
    try {
      client = await getDb();
      const query = { clientEmail, roNumber };
      const document = await client
        .collection("clientDailyMetrics")
        .findOne(query);

      if (!document) return null;

      if (!startDate || !endDate) {
        const currentDate = new Date();
        const filteredMetrics = document.dailyMetrics.filter(
          (metric) => new Date(metric.date) <= currentDate
        );
        return {
          ...document,
          dailyMetrics: filteredMetrics,
        };
      }

      const startDateTime = new Date(startDate);
      const endDateTime = new Date(endDate);
      const currentDate = new Date();
      const effectiveEndDate =
        endDateTime > currentDate ? currentDate : endDateTime;

      const filteredMetrics = document.dailyMetrics.filter((metric) => {
        const metricDate = new Date(metric.date);
        return metricDate >= startDateTime && metricDate <= effectiveEndDate;
      });

      return {
        ...document,
        dailyMetrics: filteredMetrics,
      };
    } catch (e) {
      console.log("Error", e);
    }
  }

  static async getDimensionMetrics({
    clientEmail,
    roNumber,
    startDate,
    endDate,
    dimension,
  }) {
    const metrics = await this.findMetrics({
      clientEmail,
      roNumber,
      startDate,
      endDate,
    });
    if (!metrics) return [];

    const dimensionMappings = {
      Browser: "performanceByBrowser",
      OS: "performanceByOS",
      Site: "performanceBySite",
    };

    const dimensionKey = dimensionMappings[dimension];
    const dimensionMetrics = metrics[dimensionKey] || [];

    return dimensionMetrics.map((metric) => ({
      ...metric,
      ctr:
        metric.impressions > 0
          ? ((metric.clicks / metric.impressions) * 100).toFixed(2)
          : 0,
    }));
  }

  static async getSiteStats({
    clientEmail,
    roNumber,
    startDate,
    endDate,
    limit = 10,
  }) {
    const metrics = await this.findMetrics({
      clientEmail,
      roNumber,
      startDate,
      endDate,
    });

    if (!metrics || !metrics.performanceBySite) {
      return {
        sites: [],
        totalClicks: 0,
        totalImpressions: 0,
        otherClicks: 0,
        totalCTR: 0,
      };
    }

    const sitesWithCTR = metrics.performanceBySite.map((site) => ({
      ...site,
      ctr:
        site.impressions > 0
          ? ((site.clicks / site.impressions) * 100).toFixed(2)
          : 0,
    }));

    const sortedSites = [...sitesWithCTR].sort((a, b) => b.clicks - a.clicks);
    const totalClicks = sortedSites.reduce((sum, site) => sum + site.clicks, 0);
    const totalImpressions = sortedSites.reduce(
      (sum, site) => sum + site.impressions,
      0
    );
    const totalCTR =
      totalImpressions > 0
        ? ((totalClicks / totalImpressions) * 100).toFixed(2)
        : 0;

    const topSites = sortedSites.slice(0, limit);
    const otherClicks = limit
      ? sortedSites.slice(limit).reduce((sum, site) => sum + site.clicks, 0)
      : 0;

    return {
      sites: topSites,
      totalClicks,
      totalImpressions,
      otherClicks,
      totalCTR,
    };
  }

  static calculateTotalMetrics(dailyMetrics) {
    const totalClicks = dailyMetrics.reduce(
      (sum, metric) => sum + metric.clicks,
      0
    );
    const totalImpressions = dailyMetrics.reduce(
      (sum, metric) => sum + metric.impressions,
      0
    );
    const totalSpent = dailyMetrics.reduce(
      (sum, metric) => sum + (metric.spent || 0),
      0
    );
    const totalCTR =
      totalImpressions > 0
        ? ((totalClicks / totalImpressions) * 100).toFixed(2)
        : 0;

    const clicksData = dailyMetrics.map((metric) => ({
      date: metric.date,
      clicks: metric.clicks,
      impressions: metric.impressions,
      spent: metric.spent || 0,
      ctr:
        metric.impressions > 0
          ? ((metric.clicks / metric.impressions) * 100).toFixed(2)
          : 0,
    }));

    return {
      totalClicks,
      totalImpressions,
      totalSpent,
      totalCTR,
      clicksData,
    };
  }

  static async getRegionStats({
    clientEmail,
    roNumber,
    startDate,
    endDate,
    limit,
  }) {
    const metrics = await this.findMetrics({
      clientEmail,
      roNumber,
      startDate,
      endDate,
    });
    if (!metrics || !metrics.performanceByRegion) {
      return {
        regions: [],
        totalClicks: 0,
        totalImpressions: 0,
        otherClicks: 0,
        totalCTR: 0,
      };
    }

    const regionsWithCTR = metrics.performanceByRegion.map((region) => ({
      ...region,
      ctr:
        region.impressions > 0
          ? ((region.clicks / region.impressions) * 100).toFixed(2)
          : 0,
    }));

    const sortedRegions = [...regionsWithCTR].sort(
      (a, b) => b.clicks - a.clicks
    );
    const topRegions = limit ? sortedRegions.slice(0, limit) : sortedRegions;
    const otherClicks = limit
      ? sortedRegions
          .slice(limit)
          .reduce((sum, region) => sum + region.clicks, 0)
      : 0;

    const totalClicks = sortedRegions.reduce((sum, r) => sum + r.clicks, 0);
    const totalImpressions = sortedRegions.reduce(
      (sum, r) => sum + r.impressions,
      0
    );
    const totalCTR =
      totalImpressions > 0
        ? ((totalClicks / totalImpressions) * 100).toFixed(2)
        : 0;

    return {
      regions: topRegions,
      totalClicks,
      totalImpressions,
      otherClicks,
      totalCTR,
    };
  }
}

export default MetricsRepository;
