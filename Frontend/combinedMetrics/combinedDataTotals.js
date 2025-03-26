import config from "../helper/config.js";

export const fetchCampaignDataTotal = async (selectedRO) => {
  try {
    console.log("Starting to fetch total campaign data for RO:", selectedRO);
    const userEmail = localStorage.getItem("userEmail");
    const authToken = localStorage.getItem("authToken");

    if (!userEmail || !selectedRO) {
      console.error("Missing required data:", { userEmail, selectedRO });
      return;
    }

    // Fetch CPC first
    const roResponse = await fetch(
      `${config.BASE_URL}/api/releaseOrders/cpc/${selectedRO}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    if (!roResponse.ok) {
      throw new Error("Failed to fetch RO details");
    }

    const roData = await roResponse.json();
    const roNumber = roData.roNumber;

    const clientNameResponse = await fetch(
      `${config.BASE_URL}/api/clientname/${encodeURIComponent(userEmail)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    if (!clientNameResponse.ok) {
      throw new Error("Failed to fetch client name");
    }

    const clientData = await clientNameResponse.json();
    const clientName = clientData.clientName;

    const mappingsResponse = await fetch(
      `${config.BASE_URL}/api/campaignMappings?clientName=${encodeURIComponent(
        clientName
      )}&roNumber=${encodeURIComponent(roNumber)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    if (!mappingsResponse.ok) {
      throw new Error("Failed to fetch campaign mappings");
    }

    const mappingsData = await mappingsResponse.json();

    // Extract campaign IDs for each platform
    const platformCampaignIds = {
      taboola: [],
      outbrain: [],
      dspOutbrain: [],
      mgid: [],
    };

    const mapping = mappingsData.mappings.find((m) => m.roNumber === roNumber);

    if (mapping) {
      if (mapping.taboolaCampaignId)
        platformCampaignIds.taboola = mapping.taboolaCampaignId;
      if (mapping.outbrainCampaignId)
        platformCampaignIds.outbrain = mapping.outbrainCampaignId;
      if (mapping.dspOutbrainCampaignId)
        platformCampaignIds.dspOutbrain = mapping.dspOutbrainCampaignId;
      if (mapping.mgidCampaignId)
        platformCampaignIds.mgid = mapping.mgidCampaignId;
    }
    const performanceData = {
      taboola: await fetchPlatformPerformanceData(
        "taboola",
        platformCampaignIds.taboola,
        authToken
      ),
      outbrain: await fetchPlatformPerformanceData(
        "outbrain",
        platformCampaignIds.outbrain,
        authToken
      ),
      dspOutbrain: await fetchPlatformPerformanceData(
        "dspOutbrain",
        platformCampaignIds.dspOutbrain,
        authToken
      ),
      mgid: await fetchPlatformPerformanceData(
        "mgid",
        platformCampaignIds.mgid,
        authToken
      ),
    };

    // Step 6: Process and aggregate the performance data across all platforms
    const aggregatedData = aggregateMultiPlatformData(performanceData);

    // Step 7: Update UI with the aggregated data
    updateUIWithPerformanceData(aggregatedData);

    return {
      clientName,
      roNumber,
      platformCampaignIds,
      performanceData,
      aggregatedData,
    };
  } catch (error) {
    console.error("Error in campaign data flow:", error);
    // Handle error in UI
  }
};

async function fetchPlatformPerformanceData(platform, campaignIds, authToken) {
  if (!campaignIds || campaignIds.length === 0) {
    return []; // No campaigns for this platform
  }

  // Validate platform
  const validPlatforms = ["taboola", "outbrain", "dspOutbrain", "mgid"];
  if (!validPlatforms.includes(platform)) {
    console.error(`Unknown platform: ${platform}`);
    return [];
  }

  // Map platform names to collection endpoints
  // This keeps the existing endpoint naming pattern
  const endpoints = {
    taboola: "campaignperformances",
    outbrain: "outbrainPerformances",
    dspOutbrain: "dspOutbrainPerformances",
    mgid: "mgidPerformances",
  };

  const endpoint = endpoints[platform];

  const campaignPerformancePromises = campaignIds.map((campaignId) =>
    fetch(`${config.BASE_URL}/api/${endpoint}/${campaignId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    }).then((response) => {
      if (!response.ok) {
        console.warn(
          `Failed to fetch ${platform} performance for campaign ${campaignId}`
        );
        return null;
      }
      return response.json();
    })
  );

  const performances = await Promise.all(campaignPerformancePromises);
  return performances.filter((p) => p !== null);
}

function aggregateMultiPlatformData(performanceData) {
  // Initialize aggregation object
  const aggregated = {
    totalClicks: 0,
    totalImpressions: 0,
    totalVisibleImpressions: 0,
    totalSpent: 0,
    averageCTR: 0,
    dailyPerformance: {},
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

      // Extract the performance results for this campaign based on platform
      if (platform === "taboola" && campaign.campaignPerformanceResult) {
        results = campaign.campaignPerformanceResult.results || [];
        browserResults = campaign.performanceByBrowser?.results || [];
        regionResults = campaign.performanceByRegion?.results || [];
      } else if (platform === "outbrain" && campaign.campaignData) {
        // Example structure for Outbrain - adjust as needed
        results = campaign.campaignData.dailyStats || [];
        browserResults = campaign.campaignData.browserStats || [];
        regionResults = campaign.campaignData.regionStats || [];
      } else if (platform === "dspOutbrain" && campaign.performanceData) {
        // Example structure for DSP Outbrain - adjust as needed
        results = campaign.performanceData.dailyBreakdown || [];
        browserResults = campaign.performanceData.browserBreakdown || [];
        regionResults = campaign.performanceData.regionBreakdown || [];
      } else if (platform === "mgid" && campaign.statistics) {
        // Example structure for MGID - adjust as needed
        results = campaign.statistics.daily || [];
        browserResults = campaign.statistics.browsers || [];
        regionResults = campaign.statistics.regions || [];
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
}

// Helper function to update UI with the aggregated data
function updateUIWithPerformanceData(data) {
  // Update total metrics
  document.querySelector(".total-clicks").textContent =
    data.totalClicks.toLocaleString();
  document.querySelector(".clicks-data").textContent =
    data.totalClicks.toLocaleString();
  document.querySelector(
    ".spent-data"
  ).textContent = `₹${data.totalSpent.toFixed(2)}`;
  document.querySelector(".impressions-data").textContent =
    data.totalImpressions.toLocaleString();
  document.querySelector(".ctr-data").textContent = `${data.averageCTR.toFixed(
    2
  )}% / 0.05%`;

  // Update progress bars
  updateProgressBar(".progress-bar-clicks", data.totalClicks, 166000);
  updateProgressBar(".progress-bar-spent", data.totalSpent, 300000);
  updateProgressBar(
    ".progress-bar-impressions",
    data.totalImpressions,
    10000000
  );
  updateProgressBar(".progress-bar-ctr", data.averageCTR, 0.5);

  // Update daily performance chart
  if (Object.keys(data.dailyPerformance).length > 0) {
    const chartData = Object.entries(data.dailyPerformance)
      .map(([date, metrics]) => [new Date(date).getTime(), metrics.clicks])
      .sort((a, b) => a[0] - b[0]);

    renderLineChart(chartData);
  }

  // Update platform contribution chart
  renderPlatformContributionChart(data.platformStats);

  // Update top browsers chart
  renderTopBrowsersChart(data.browserPerformance);

  // Update top regions chart
  renderTopRegionsChart(data.regionPerformance);
}

// Helper function to update progress bars
function updateProgressBar(selector, value, maxValue) {
  const progressBar = document.querySelector(selector);
  if (progressBar) {
    const percentage = Math.min(Math.max((value / maxValue) * 100, 0), 100);
    progressBar.style.width = `${percentage}%`;
  }
}

// Function to render line chart for daily performance
function renderLineChart(chartData) {
  // Using the existing renderLineChart function from your code
  try {
    const options = {
      colors: ["#0dcaf0"],
      series: {
        lines: { show: true, lineWidth: 2, fill: 0.1 },
      },
      points: { show: true },
      grid: {
        borderColor: "rgba(0,0,0,0.05)",
        borderWidth: 1,
        labelMargin: 5,
      },
      xaxis: {
        mode: "time",
        timeformat: "%b %d",
        color: "#F0F0F0",
        tickColor: "rgba(0,0,0,0.05)",
        font: { size: 10, color: "#999" },
      },
      yaxis: {
        min: 0,
        color: "#F0F0F0",
        tickColor: "rgba(0,0,0,0.05)",
        font: { size: 10, color: "#999" },
      },
    };

    const chartContainer = $("#updating-chart");
    if (chartContainer.length) {
      $.plot(chartContainer, [{ data: chartData }], options);
    }
  } catch (error) {
    console.error("Error rendering chart:", error);
  }
}

// Function to render platform contribution chart (pie chart)
function renderPlatformContributionChart(platformStats) {
  try {
    // This would depend on your charting library
    // Example using Chart.js
    const platformNames = Object.keys(platformStats);
    const platformClicks = platformNames.map(
      (name) => platformStats[name].clicks
    );
    const platformColors = [
      "rgba(255, 99, 132, 0.7)", // Taboola
      "rgba(54, 162, 235, 0.7)", // Outbrain
      "rgba(255, 206, 86, 0.7)", // DSP Outbrain
      "rgba(75, 192, 192, 0.7)", // MGID
    ];

    const chartContainer = document.getElementById(
      "platform-contribution-chart"
    );
    if (chartContainer) {
      const ctx = chartContainer.getContext("2d");
      new Chart(ctx, {
        type: "pie",
        data: {
          labels: platformNames.map(
            (name) => name.charAt(0).toUpperCase() + name.slice(1)
          ), // Capitalize
          datasets: [
            {
              data: platformClicks,
              backgroundColor: platformColors,
              borderColor: platformColors.map((color) =>
                color.replace("0.7", "1")
              ),
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: "right",
            },
            title: {
              display: true,
              text: "Clicks by Platform",
            },
          },
        },
      });
    }
  } catch (error) {
    console.error("Error rendering platform chart:", error);
  }
}

// Function to render top browsers chart
function renderTopBrowsersChart(browserPerformance) {
  try {
    // Get top 10 browsers by clicks
    const topBrowsers = Object.entries(browserPerformance)
      .sort(([, a], [, b]) => b.clicks - a.clicks)
      .slice(0, 10);

    const browserNames = topBrowsers.map(([name]) => name);
    const browserClicks = topBrowsers.map(([, data]) => data.clicks);

    const chartContainer = document.getElementById("top-browsers-chart");
    if (chartContainer) {
      const ctx = chartContainer.getContext("2d");
      new Chart(ctx, {
        type: "bar",
        data: {
          labels: browserNames,
          datasets: [
            {
              label: "Clicks",
              data: browserClicks,
              backgroundColor: "rgba(54, 162, 235, 0.7)",
              borderColor: "rgba(54, 162, 235, 1)",
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              display: false,
            },
            title: {
              display: true,
              text: "Top 10 Browsers by Clicks",
            },
          },
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      });
    }
  } catch (error) {
    console.error("Error rendering browser chart:", error);
  }
}

// Function to render top regions chart
function renderTopRegionsChart(regionPerformance) {
  try {
    // Get top 7 regions by clicks
    const topRegions = Object.entries(regionPerformance)
      .sort(([, a], [, b]) => b.clicks - a.clicks)
      .slice(0, 7);

    const regionNames = topRegions.map(([name]) => name);
    const regionClicks = topRegions.map(([, data]) => data.clicks);

    const chartContainer = document.getElementById("top-regions-chart");
    if (chartContainer) {
      const ctx = chartContainer.getContext("2d");
      new Chart(ctx, {
        type: "bar",
        data: {
          labels: regionNames,
          datasets: [
            {
              label: "Clicks",
              data: regionClicks,
              backgroundColor: "rgba(75, 192, 192, 0.7)",
              borderColor: "rgba(75, 192, 192, 1)",
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              display: false,
            },
            title: {
              display: true,
              text: "Top 7 Regions by Clicks",
            },
          },
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      });
    }
  } catch (error) {
    console.error("Error rendering region chart:", error);
  }
}
