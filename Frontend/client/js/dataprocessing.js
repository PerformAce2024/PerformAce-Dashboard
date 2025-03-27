export const aggregateMultiPlatformData = (performanceData) => {
  // Initialize aggregation object
  const aggregated = {
    totalClicks: 0,
    totalImpressions: 0,
    totalVisibleImpressions: 0,
    totalSpent: 0,
    averageCTR: 0,
    dailyPerformance: {},
    osPerformance: {},
    browserPerformance: {},
    regionPerformance: {},
    platformStats: {
      taboola: { clicks: 0, impressions: 0, spent: 0 },
      outbrain: { clicks: 0, impressions: 0, spent: 0 },
      dspOutbrain: { clicks: 0, impressions: 0, spent: 0 },
      mgid: { clicks: 0, impressions: 0, spent: 0 },
    },
  };

  // Process each platform's data
  Object.entries(performanceData).forEach(([platform, platformData]) => {
    platformData.forEach((campaign) => {
      if (!campaign) return;

      // Handle different data structures for different platforms
      // For this example, we'll assume a similar structure across platforms
      // In a real implementation, you'd need to adapt for each platform's data format

      let results = [];
      let browserResults = [];
      let regionResults = [];
      let osResults = [];

      // Extract the performance results for this campaign based on platform
      if (platform === "taboola" && campaign.campaignPerformanceResult) {
        results = campaign.campaignPerformanceResult.results || [];
        browserResults = campaign.performanceByBrowser?.results || [];
        regionResults = campaign.performanceByRegion?.results || [];
        osResults = campaign.performanceByOS?.results || [];
      } else if (platform === "outbrain" && campaign.campaignData) {
        // Example structure for Outbrain - adjust as needed
        results = campaign.campaignData.dailyStats || [];
        browserResults = campaign.campaignData.browserStats || [];
        regionResults = campaign.campaignData.regionStats || [];
        osResults = campaign.campaignData.osStats || [];
      } else if (platform === "dspOutbrain" && campaign.performanceData) {
        // Example structure for DSP Outbrain - adjust as needed
        results = campaign.performanceData.dailyBreakdown || [];
        browserResults = campaign.performanceData.browserBreakdown || [];
        regionResults = campaign.performanceData.regionBreakdown || [];
        osResults = campaign.performanceData.osBreakdown || [];
      } else if (platform === "mgid" && campaign.statistics) {
        // Example structure for MGID - adjust as needed
        results = campaign.statistics.daily || [];
        browserResults = campaign.statistics.browsers || [];
        regionResults = campaign.statistics.regions || [];
        osResults = campaign.statistics.os || [];
      }

      // Aggregate daily performance data
      results.forEach((day) => {
        // Handle different field names for different platforms
        const clicks = day.clicks || day.totalClicks || 0;
        const impressions = day.impressions || day.totalImpressions || 0;
        const visibleImpressions =
          day.visible_impressions || day.viewableImpressions || 0;
        const spent = day.spent || day.totalSpent || day.cost || 0;

        // Update platform stats
        aggregated.platformStats[platform].clicks += clicks;
        aggregated.platformStats[platform].impressions += impressions;
        aggregated.platformStats[platform].spent += spent;

        // Update overall stats
        aggregated.totalClicks += clicks;
        aggregated.totalImpressions += impressions;
        aggregated.totalVisibleImpressions += visibleImpressions;
        aggregated.totalSpent += spent;

        // Extract date in YYYY-MM-DD format
        const dateKey = day.date
          ? day.date.split(" ")[0] // Taboola format: "2025-01-01 00:00:00.0"
          : day.date_string || day.dateString || day.day; // Other platforms may use these fields

        if (!dateKey) return; // Skip if we can't determine the date

        if (!aggregated.dailyPerformance[dateKey]) {
          aggregated.dailyPerformance[dateKey] = {
            clicks: 0,
            impressions: 0,
            spent: 0,
            platform: {}, // Track contribution by platform
          };
        }

        // Initialize platform data for this date if needed
        if (!aggregated.dailyPerformance[dateKey].platform[platform]) {
          aggregated.dailyPerformance[dateKey].platform[platform] = {
            clicks: 0,
            impressions: 0,
            spent: 0,
            platform: {},
          };
        }
        if (!aggregated.dailyPerformance[dateKey].platform[platform]) {
          aggregated.dailyPerformance[dateKey].platform[platform] = {
            clicks: 0,
            impressions: 0,
            spent: 0,
          };
        }
        // Update daily metrics
        aggregated.dailyPerformance[dateKey].clicks += clicks;
        aggregated.dailyPerformance[dateKey].impressions += impressions;
        aggregated.dailyPerformance[dateKey].spent += spent;

        // Update daily metrics per platform
        aggregated.dailyPerformance[dateKey].platform[platform].clicks +=
          clicks;
        aggregated.dailyPerformance[dateKey].platform[platform].impressions +=
          impressions;
        aggregated.dailyPerformance[dateKey].platform[platform].spent += spent;
      });
      osResults.forEach((os) => {
        // Handle different field names for different platforms
        const osFamily =
          os.os_family || os.osFamily || os.operatingSystem || "Unknown";
        const platformName = os.platform_name || os.deviceType || "Unknown";
        const key = `${platformName}-${osFamily}`; // Create a unique key for this OS+platform combination

        const clicks = os.clicks || os.totalClicks || 0;
        const impressions = os.impressions || os.totalImpressions || 0;
        const spent = os.spent || os.totalSpent || os.cost || 0;

        if (!aggregated.osPerformance[key]) {
          aggregated.osPerformance[key] = {
            clicks: 0,
            impressions: 0,
            spent: 0,
            platform: {}, // Track contribution by platform
          };
        }

        // Initialize platform data for this OS if needed
        if (!aggregated.osPerformance[key].platform[platform]) {
          aggregated.osPerformance[key].platform[platform] = {
            clicks: 0,
            impressions: 0,
            spent: 0,
          };
        }

        // Update OS metrics
        aggregated.osPerformance[key].clicks += clicks;
        aggregated.osPerformance[key].impressions += impressions;
        aggregated.osPerformance[key].spent += spent;

        // Update OS metrics per platform
        aggregated.osPerformance[key].platform[platform].clicks += clicks;
        aggregated.osPerformance[key].platform[platform].impressions +=
          impressions;
        aggregated.osPerformance[key].platform[platform].spent += spent;
      });
      // Process browser performance data
      browserResults.forEach((browser) => {
        // Handle different field names for different platforms
        const browserName = browser.browser || browser.browserName || "Unknown";
        const platformName =
          browser.platform_name || browser.deviceType || "Unknown";
        const key = `${platformName}-${browserName}`;

        const clicks = browser.clicks || browser.totalClicks || 0;
        const impressions =
          browser.impressions || browser.totalImpressions || 0;
        const spent = browser.spent || browser.totalSpent || browser.cost || 0;

        if (!aggregated.browserPerformance[key]) {
          aggregated.browserPerformance[key] = {
            clicks: 0,
            impressions: 0,
            spent: 0,
            platform: {}, // Track contribution by platform
          };
        }

        // Initialize platform data for this browser if needed
        if (!aggregated.browserPerformance[key].platform[platform]) {
          aggregated.browserPerformance[key].platform[platform] = {
            clicks: 0,
            impressions: 0,
            spent: 0,
          };
        }

        // Update browser metrics
        aggregated.browserPerformance[key].clicks += clicks;
        aggregated.browserPerformance[key].impressions += impressions;
        aggregated.browserPerformance[key].spent += spent;

        // Update browser metrics per platform
        aggregated.browserPerformance[key].platform[platform].clicks += clicks;
        aggregated.browserPerformance[key].platform[platform].impressions +=
          impressions;
        aggregated.browserPerformance[key].platform[platform].spent += spent;
      });

      // Process region performance data
      regionResults.forEach((region) => {
        // Handle different field names for different platforms
        const regionName =
          region.region || region.regionName || region.country || "Unknown";
        const key = regionName;

        const clicks = region.clicks || region.totalClicks || 0;
        const impressions = region.impressions || region.totalImpressions || 0;
        const spent = region.spent || region.totalSpent || region.cost || 0;

        if (!aggregated.regionPerformance[key]) {
          aggregated.regionPerformance[key] = {
            clicks: 0,
            impressions: 0,
            spent: 0,
            platform: {}, // Track contribution by platform
          };
        }

        // Initialize platform data for this region if needed
        if (!aggregated.regionPerformance[key].platform[platform]) {
          aggregated.regionPerformance[key].platform[platform] = {
            clicks: 0,
            impressions: 0,
            spent: 0,
          };
        }

        // Update region metrics
        aggregated.regionPerformance[key].clicks += clicks;
        aggregated.regionPerformance[key].impressions += impressions;
        aggregated.regionPerformance[key].spent += spent;

        // Update region metrics per platform
        aggregated.regionPerformance[key].platform[platform].clicks += clicks;
        aggregated.regionPerformance[key].platform[platform].impressions +=
          impressions;
        aggregated.regionPerformance[key].platform[platform].spent += spent;
      });
    });
  });

  // Calculate averages and other derived metrics
  if (aggregated.totalImpressions > 0) {
    aggregated.averageCTR =
      (aggregated.totalClicks / aggregated.totalImpressions) * 100;
  }

  // Sort daily performance by date
  aggregated.dailyPerformance = Object.fromEntries(
    Object.entries(aggregated.dailyPerformance).sort(
      ([a], [b]) => new Date(a) - new Date(b)
    )
  );

  aggregated.osPerformance = Object.fromEntries(
    Object.entries(aggregated.osPerformance).sort(
      ([, a], [, b]) => b.clicks - a.clicks
    )
  );

  // Sort regions by clicks (descending)
  aggregated.regionPerformance = Object.fromEntries(
    Object.entries(aggregated.regionPerformance).sort(
      ([, a], [, b]) => b.clicks - a.clicks
    )
  );

  // Sort browsers by clicks (descending)
  aggregated.browserPerformance = Object.fromEntries(
    Object.entries(aggregated.browserPerformance).sort(
      ([, a], [, b]) => b.clicks - a.clicks
    )
  );

  return aggregated;
};
