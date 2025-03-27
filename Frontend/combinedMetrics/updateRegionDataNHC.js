import config from "../helper/config.js";

let stateChart = null;

/**
 * Updates the Region Performance Table and Chart with the provided aggregated data
 * @param {Object} aggregatedData - The aggregated performance data object
 */
export const UpdateRegionData = async (aggregatedData) => {
  try {
    console.log("Updating Region data with aggregated data:", aggregatedData);

    if (!aggregatedData || !aggregatedData.regionPerformance) {
      console.error("No region performance data available in aggregated data");
      return;
    }

    // Use regionPerformance data from the aggregated data
    const regionData = aggregatedData.regionPerformance;

    // Transform to array format for display
    const transformedData = Object.entries(regionData)
      .map(([region, data]) => ({
        region,
        clicks: data.clicks || 0,
        impressions: data.impressions || 0,
        spent: data.spent || 0,
        ctr:
          data.impressions > 0
            ? ((data.clicks / data.impressions) * 100).toFixed(2)
            : "0.00",
      }))
      .sort((a, b) => b.clicks - a.clicks); // Sort by clicks (highest first)

    console.log("Transformed region data:", transformedData);

    // Update the table with region data
    updateRegionTable(transformedData);

    // Get top regions for chart
    const topRegions = transformedData.slice(0, 7); // Get top 7 regions by clicks
    const states = topRegions.map((item) => item.region);
    const clicks = topRegions.map((item) => item.clicks);

    // Update chart with top regions
    if (stateChart) {
      stateChart.destroy();
    }
    updateBarChart(states, clicks);
  } catch (error) {
    console.error("Error updating region data:", error);

    // Show error in the table
    const tableBody = document.getElementById("metricsGeoTableBody");
    if (tableBody) {
      tableBody.innerHTML = `<tr><td colspan="4" class="text-center">Error processing region data: ${error.message}</td></tr>`;
    }
  }
};

/**
 * Updates the region performance table with the provided data
 * @param {Array} regionData - Array of region performance data
 */
const updateRegionTable = (regionData) => {
  const tableBody = document.getElementById("metricsGeoTableBody");
  if (!tableBody) {
    console.error("Region table body element not found");
    return;
  }

  tableBody.innerHTML = "";

  // Calculate totals
  const totalClicks = regionData.reduce((sum, item) => sum + item.clicks, 0);
  const totalImpressions = regionData.reduce(
    (sum, item) => sum + item.impressions,
    0
  );
  const totalCTR =
    totalImpressions > 0
      ? ((totalClicks / totalImpressions) * 100).toFixed(2)
      : "0.00";

  // Add total row
  const totalRow = document.createElement("tr");
  totalRow.classList.add("total-row");
  totalRow.innerHTML = `
    <td><strong>Total</strong></td>
    <td><strong>${totalClicks.toLocaleString()}</strong></td>
    <td><strong>${totalImpressions.toLocaleString()}</strong></td>
    <td><strong>${totalCTR}%</strong></td>
  `;
  tableBody.appendChild(totalRow);

  // Add data rows
  regionData.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.region}</td>
      <td>${item.clicks.toLocaleString()}</td>
      <td>${item.impressions.toLocaleString()}</td>
      <td>${item.ctr}%</td>
    `;
    tableBody.appendChild(row);
  });
};

/**
 * Updates the bar chart with region data
 * @param {Array} states - Array of region/state names
 * @param {Array} clicks - Array of click counts for each region
 */
const updateBarChart = (states, clicks) => {
  const canvasElement = document
    .getElementById("barStacked")
    ?.querySelector("canvas");

  if (!canvasElement) {
    console.error("Canvas element not found for region chart");
    return;
  }

  const ctx = canvasElement.getContext("2d");
  stateChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: states,
      datasets: [
        {
          label: "Clicks",
          backgroundColor: "rgba(38, 198, 218, 0.5)",
          borderColor: "rgba(38, 198, 218, 1)",
          borderWidth: 1,
          data: clicks,
        },
      ],
    },
    options: {
      scales: { y: { beginAtZero: true } },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (context) {
              return `Clicks: ${context.raw.toLocaleString()}`;
            },
          },
        },
      },
      responsive: true,
      maintainAspectRatio: false,
    },
  });
};

// Initialize the chart on document load
document.addEventListener("DOMContentLoaded", function () {
  console.log("Region data handler loaded");

  // Set up event handler for the region performance button
  const geoPerformanceBtn = document.getElementById("geoPerformanceBtn");
  if (geoPerformanceBtn) {
    geoPerformanceBtn.addEventListener("click", function () {
      [
        "dailyMetricsTable",
        "osPerformanceTable",
        "browserPerformanceTable",
        "sitePerformanceTable",
      ].forEach((id) => {
        document.getElementById(id)?.style.setProperty("display", "none");
      });
      document
        .getElementById("geoPerformanceTable")
        ?.style.setProperty("display", "table");
    });
  }
});
