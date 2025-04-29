export const aggregateMultiPlatformData = (performanceData) => {
  console.log(
    "Starting aggregation with data:",
    JSON.stringify(performanceData || {}).substring(0, 100) + "..."
  );

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

  if (!performanceData) {
    console.error("Performance data is null or undefined");
    return aggregated;
  }

  // Process each platform's data
  Object.entries(performanceData).forEach(([platform, platformData]) => {
    console.log(
      `Processing platform: ${platform}, data count: ${
        platformData?.length || 0
      }`
    );

    if (!platformData || !Array.isArray(platformData)) {
      console.error(`Invalid platform data for ${platform}, expected an array`);
      return;
    }

    platformData.forEach((campaign, index) => {
      console.log(`Processing campaign ${index} for ${platform}`);

      if (!campaign) {
        console.log("Campaign is null or undefined, skipping");
        return;
      }

      // Handle different data structures for different platforms
      let results = [];
      let browserResults = [];
      let regionResults = [];
      let osResults = [];

      // Extract the performance results for this campaign based on platform
      if (platform === "taboola" && campaign.campaignPerformanceResult) {
        console.log("Processing Taboola data");
        results = campaign.campaignPerformanceResult.results || [];
        browserResults = campaign.performanceByBrowser?.results || [];
        regionResults = campaign.performanceByRegion?.results || [];
        osResults = campaign.performanceByOS?.results || [];
      } else if (platform === "outbrain" && campaign.campaignData) {
        console.log("Processing Outbrain data");
        results = campaign.campaignData.dailyStats || [];
        browserResults = campaign.campaignData.browserStats || [];
        regionResults = campaign.campaignData.regionStats || [];
        osResults = campaign.campaignData.osStats || [];
      } else if (platform === "dspOutbrain") {
        console.log("Processing dspOutbrain data");
        console.log("Campaign structure:", Object.keys(campaign));

        // For dspOutbrain, we need to check both structures (from the schema and from the mongoose model)
        if (campaign.campaignPerformanceResult) {
          if (Array.isArray(campaign.campaignPerformanceResult)) {
            // This matches the mongoose schema structure you provided
            console.log("Found campaignPerformanceResult as array");
            results = campaign.campaignPerformanceResult.map((item) => ({
              clicks: parseInt(item.Clicks || "0", 10),
              impressions: parseInt(item.Impressions || "0", 10),
              visible_impressions: parseInt(
                item["Viewable Impressions"] || "0",
                10
              ),
              spent: parseFloat(
                (item["Total Spend"] || "0")
                  .toString()
                  .replace(/[^0-9.-]+/g, "")
              ),
              date: new Date().toISOString().split("T")[0], // Use current date as fallback
            }));
          } else if (campaign.campaignPerformanceResult.results) {
            // This matches the JSON schema structure
            console.log("Found campaignPerformanceResult with results array");
            results = campaign.campaignPerformanceResult.results || [];
          } else {
            console.log(
              "campaignPerformanceResult exists but in unexpected format:",
              typeof campaign.campaignPerformanceResult
            );
          }
        } else {
          console.log("No campaignPerformanceResult found");
        }

        // Similar approach for other performance metrics
        if (campaign.performanceByRegion) {
          if (Array.isArray(campaign.performanceByRegion)) {
            // Mongoose schema structure
            console.log("Found performanceByRegion as array");
            regionResults = campaign.performanceByRegion.map((region) => ({
              region:
                region["State / Region Name"] ||
                region["State / Region"] ||
                "Unknown",
              clicks: parseInt(region.Clicks || "0", 10),
              impressions: parseInt(region.Impressions || "0", 10),
              spent: parseFloat(
                (region["Total Spend"] || "0")
                  .toString()
                  .replace(/[^0-9.-]+/g, "")
              ),
            }));
          } else if (campaign.performanceByRegion.results) {
            // JSON schema structure
            console.log("Found performanceByRegion with results array");
            regionResults = campaign.performanceByRegion.results || [];
          }
        }

        if (campaign.performanceByOS) {
          if (Array.isArray(campaign.performanceByOS)) {
            // Mongoose schema structure
            console.log("Found performanceByOS as array");
            osResults = campaign.performanceByOS.map((os) => ({
              os_family:
                os["Operating System Name"] ||
                os["Operating System"] ||
                "Unknown",
              platform_name: os.Device || os["Device Name"] || "Unknown",
              clicks: parseInt(os.Clicks || "0", 10),
              impressions: parseInt(os.Impressions || "0", 10),
              spent: parseFloat(
                (os["Total Spend"] || "0").toString().replace(/[^0-9.-]+/g, "")
              ),
            }));
          } else if (campaign.performanceByOS.results) {
            // JSON schema structure
            console.log("Found performanceByOS with results array");
            osResults = campaign.performanceByOS.results || [];
          }
        }

        if (campaign.performanceByBrowser) {
          if (Array.isArray(campaign.performanceByBrowser)) {
            // If your mongoose schema includes browser information
            browserResults = []; // Add mapper here if available
          } else if (campaign.performanceByBrowser.results) {
            console.log("Found performanceByBrowser with results array");
            browserResults = campaign.performanceByBrowser.results || [];
          }
        }

        if (
          campaign.performanceByCountry &&
          campaign.performanceByCountry.results
        ) {
          console.log("Found performanceByCountry with results");
          const countryResults = campaign.performanceByCountry.results || [];
          regionResults = regionResults.concat(
            countryResults.map((country) => ({
              ...country,
              region: country.country,
              region_code: country.country_code,
            }))
          );
        }
      } else if (platform === "mgid" && campaign.statistics) {
        console.log("Processing MGID data");
        results = campaign.statistics.daily || [];
        browserResults = campaign.statistics.browsers || [];
        regionResults = campaign.statistics.regions || [];
        osResults = campaign.statistics.os || [];
      }

      console.log(
        `After extraction: results=${results?.length || 0}, regionResults=${
          regionResults?.length || 0
        }, osResults=${osResults?.length || 0}, browserResults=${
          browserResults?.length || 0
        }`
      );

      // Ensure results arrays are actual arrays
      results = Array.isArray(results) ? results : [];
      regionResults = Array.isArray(regionResults) ? regionResults : [];
      osResults = Array.isArray(osResults) ? osResults : [];
      browserResults = Array.isArray(browserResults) ? browserResults : [];

      // Aggregate daily performance data
      results.forEach((day) => {
        if (!day) return;

        console.log("Processing day:", Object.keys(day).join(", "));

        // Handle different field names for different platforms
        let clicks, impressions, visibleImpressions, spent, dateKey;

        if (platform === "taboola") {
          clicks = parseInt(day.clicks || 0, 10);
          impressions = parseInt(day.impressions || 0, 10);
          visibleImpressions = parseInt(day.visible_impressions || 0, 10);
          spent = parseFloat(day.spent || 0);
          dateKey = day.date ? day.date.split(" ")[0] : null; // Taboola format: "2025-01-01 00:00:00.0"
        } else if (platform === "dspOutbrain") {
          // Handle both potential formats for dspOutbrain
          clicks = parseInt(day.clicks || day.Clicks || 0, 10);
          impressions = parseInt(day.impressions || day.Impressions || 0, 10);
          visibleImpressions = parseInt(
            day.visible_impressions || day["Viewable Impressions"] || 0,
            10
          );

          // Handle different spend formats
          if (day.spent !== undefined) {
            spent = parseFloat(day.spent || 0);
          } else if (day["Total Spend"] !== undefined) {
            spent = parseFloat(
              day["Total Spend"].toString().replace(/[^0-9.-]+/g, "") || 0
            );
          } else {
            spent = 0;
          }

          // Handle different date formats
          dateKey =
            day.date ||
            day.date_end_period ||
            new Date().toISOString().split("T")[0];
        } else {
          // Generic handling for other platforms
          clicks = parseInt(day.clicks || day.totalClicks || 0, 10);
          impressions = parseInt(
            day.impressions || day.totalImpressions || 0,
            10
          );
          visibleImpressions = parseInt(
            day.visible_impressions || day.viewableImpressions || 0,
            10
          );
          spent = parseFloat(day.spent || day.totalSpent || day.cost || 0);
          dateKey = day.date_string || day.dateString || day.day || day.date;
        }

        console.log(
          `Extracted day data: clicks=${clicks}, impressions=${impressions}, dateKey=${dateKey}`
        );

        // Update platform stats
        aggregated.platformStats[platform].clicks += clicks;
        aggregated.platformStats[platform].impressions += impressions;
        aggregated.platformStats[platform].spent += spent;

        // Update overall stats
        aggregated.totalClicks += clicks;
        aggregated.totalImpressions += impressions;
        aggregated.totalVisibleImpressions += visibleImpressions;
        aggregated.totalSpent += spent;

        if (!dateKey) {
          console.log("No dateKey found, skipping daily aggregation");
          return; // Skip if we can't determine the date
        }

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

      // Process OS results
      osResults.forEach((os) => {
        if (!os) return;

        console.log("Processing OS:", Object.keys(os).join(", "));

        // Handle different field names for different platforms
        let osFamily, platformName, clicks, impressions, spent;

        if (platform === "taboola") {
          osFamily = os.os_family || "Unknown";
          platformName = os.platform_name || "Unknown";
          clicks = parseInt(os.clicks || 0, 10);
          impressions = parseInt(os.impressions || 0, 10);
          spent = parseFloat(os.spent || 0);
        } else if (platform === "dspOutbrain") {
          // Handle both possible formats for dspOutbrain
          if (os.os_family !== undefined) {
            osFamily = os.os_family;
          } else if (os["Operating System Name"] !== undefined) {
            osFamily = os["Operating System Name"];
          } else if (os["Operating System"] !== undefined) {
            osFamily = os["Operating System"];
          } else {
            osFamily = "Unknown";
          }

          if (os.platform_name !== undefined) {
            platformName = os.platform_name;
          } else if (os.Device !== undefined) {
            platformName = os.Device;
          } else if (os.platform !== undefined) {
            platformName = os.platform;
          } else {
            platformName = "Unknown";
          }

          clicks = parseInt(os.clicks || os.Clicks || 0, 10);
          impressions = parseInt(os.impressions || os.Impressions || 0, 10);

          if (os.spent !== undefined) {
            spent = parseFloat(os.spent || 0);
          } else if (os["Total Spend"] !== undefined) {
            spent = parseFloat(
              os["Total Spend"].toString().replace(/[^0-9.-]+/g, "") || 0
            );
          } else {
            spent = 0;
          }
        } else {
          // Generic handling for other platforms
          osFamily =
            os.os_family || os.osFamily || os.operatingSystem || "Unknown";
          platformName = os.platform_name || os.deviceType || "Unknown";
          clicks = parseInt(os.clicks || os.totalClicks || 0, 10);
          impressions = parseInt(
            os.impressions || os.totalImpressions || 0,
            10
          );
          spent = parseFloat(os.spent || os.totalSpent || os.cost || 0);
        }

        console.log(
          `Extracted OS data: osFamily=${osFamily}, platformName=${platformName}, clicks=${clicks}`
        );

        const key = `${platformName}-${osFamily}`; // Create a unique key for this OS+platform combination

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
        if (!browser) return;

        console.log("Processing browser:", Object.keys(browser).join(", "));

        // Handle different field names for different platforms
        let browserName, platformName, clicks, impressions, spent;

        if (platform === "taboola") {
          browserName = browser.browser || "Unknown";
          platformName = browser.platform_name || "Unknown";
          clicks = parseInt(browser.clicks || 0, 10);
          impressions = parseInt(browser.impressions || 0, 10);
          spent = parseFloat(browser.spent || 0);
        } else if (platform === "dspOutbrain") {
          browserName = browser.browser || "Unknown";
          platformName = browser.platform_name || "Unknown";
          clicks = parseInt(browser.clicks || 0, 10);
          impressions = parseInt(browser.impressions || 0, 10);
          spent = parseFloat(browser.spent || 0);
        } else {
          // Generic handling for other platforms
          browserName = browser.browser || browser.browserName || "Unknown";
          platformName =
            browser.platform_name || browser.deviceType || "Unknown";
          clicks = parseInt(browser.clicks || browser.totalClicks || 0, 10);
          impressions = parseInt(
            browser.impressions || browser.totalImpressions || 0,
            10
          );
          spent = parseFloat(
            browser.spent || browser.totalSpent || browser.cost || 0
          );
        }

        console.log(
          `Extracted browser data: browserName=${browserName}, platformName=${platformName}, clicks=${clicks}`
        );

        const key = `${platformName}-${browserName}`;

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
        if (!region) return;

        console.log("Processing region:", Object.keys(region).join(", "));

        // Handle different field names for different platforms
        let regionName, clicks, impressions, spent;

        if (platform === "taboola") {
          regionName = region.region || "Unknown";
          clicks = parseInt(region.clicks || 0, 10);
          impressions = parseInt(region.impressions || 0, 10);
          spent = parseFloat(region.spent || 0);
        } else if (platform === "dspOutbrain") {
          // dspOutbrain uses different fields for region
          regionName =
            region.region || region.country || region.country_name || "Unknown";
          clicks = parseInt(region.clicks || 0, 10);
          impressions = parseInt(region.impressions || 0, 10);
          spent = parseFloat(region.spent || 0);
        } else {
          // Generic handling for other platforms
          regionName =
            region.region || region.regionName || region.country || "Unknown";
          clicks = parseInt(region.clicks || region.totalClicks || 0, 10);
          impressions = parseInt(
            region.impressions || region.totalImpressions || 0,
            10
          );
          spent = parseFloat(
            region.spent || region.totalSpent || region.cost || 0
          );
        }

        console.log(
          `Extracted region data: regionName=${regionName}, clicks=${clicks}`
        );

        const key = regionName;

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

  console.log("Calculating derived metrics...");

  // Calculate averages and other derived metrics
  if (aggregated.totalImpressions > 0) {
    aggregated.averageCTR =
      (aggregated.totalClicks / aggregated.totalImpressions) * 100;
  }

  console.log("Sorting performance metrics...");

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

  console.log(
    "Finished aggregation. Stats: " +
      `totalClicks=${aggregated.totalClicks}, ` +
      `totalImpressions=${aggregated.totalImpressions}, ` +
      `dailyPerformance entries=${
        Object.keys(aggregated.dailyPerformance).length
      }`
  );

  return aggregated;
};
