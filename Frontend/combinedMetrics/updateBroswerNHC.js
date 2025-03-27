import config from "../helper/config.js";

let browserChart = null;

/**
 * Updates the Browser Performance Table and Chart with the provided aggregated data
 * @param {Object} aggregatedData - The aggregated performance data object
 */
export const updateBrowserPerformance = (aggregatedData) => {
  try {
    console.log(
      "Updating Browser Performance with aggregated data:",
      aggregatedData
    );

    if (!aggregatedData || !aggregatedData.browserPerformance) {
      console.error("No browser performance data available in aggregated data");
      return;
    }

    // Use direct browserPerformance data from the aggregated data
    const browserData = aggregatedData.browserPerformance;

    // Transform to array format for display
    const transformedData = Object.entries(browserData)
      .map(([browserKey, data]) => {
        const parts = browserKey.split("-");
        const deviceType = parts[0]; // e.g., "Smartphone"
        const browser = parts[1]; // e.g., "Chrome", "Safari"

        // Create a meaningful display name
        const displayName = `${browser} (${deviceType})`;

        return {
          browser: displayName,
          clicks: data.clicks || 0,
          impressions: data.impressions || 0,
          spent: data.spent || 0,
          ctr:
            data.impressions > 0
              ? ((data.clicks / data.impressions) * 100).toFixed(2)
              : "0.00",
        };
      })
      .sort((a, b) => b.clicks - a.clicks); // Sort by clicks (highest first)

    console.log("Transformed browser data:", transformedData);

    // Calculate totals
    const totalClicks = transformedData.reduce(
      (sum, item) => sum + item.clicks,
      0
    );
    const totalImpressions = transformedData.reduce(
      (sum, item) => sum + item.impressions,
      0
    );
    const totalCTR =
      totalImpressions > 0
        ? ((totalClicks / totalImpressions) * 100).toFixed(2)
        : "0.00";

    // Update table and chart
    populateBrowserTable(
      transformedData,
      totalClicks,
      totalImpressions,
      totalCTR
    );
    updateBrowserPieChart(
      transformedData.map((item) => item.browser),
      transformedData.map((item) => item.clicks)
    );
  } catch (error) {
    console.error("Error updating browser performance data:", error);

    // Show error in the table
    const tableBody = document.getElementById("metricsBrowserTableBody");
    if (tableBody) {
      tableBody.innerHTML = `<tr><td colspan="4" class="text-center">Error processing browser data: ${error.message}</td></tr>`;
    }
  }
};

/**
 * Populates the browser performance table with the provided data
 * @param {Array} data - Array of browser performance data
 * @param {Number} totalClicks - Total number of clicks
 * @param {Number} totalImpressions - Total number of impressions
 * @param {String} totalCTR - Total click-through rate as string
 */
const populateBrowserTable = (
  data,
  totalClicks,
  totalImpressions,
  totalCTR
) => {
  const tableBody = document.getElementById("metricsBrowserTableBody");
  if (!tableBody) {
    console.error("Browser table body element not found");
    return;
  }

  tableBody.innerHTML = "";

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
  data.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.browser}</td>
      <td>${item.clicks.toLocaleString()}</td>
      <td>${item.impressions.toLocaleString()}</td>
      <td>${item.ctr}%</td>
    `;
    tableBody.appendChild(row);
  });
};

/**
 * Updates the browser pie chart with the provided data
 * @param {Array} labels - Array of browser names
 * @param {Array} data - Array of click counts for each browser
 */
const updateBrowserPieChart = (labels, data) => {
  const canvas = document.getElementById("pieChart")?.querySelector("canvas");
  if (!canvas) {
    console.error("Canvas element not found for browser chart");
    return;
  }

  // Calculate total clicks and percentages
  const totalClicks = data.reduce((a, b) => a + b, 0);
  const clickPercentages = data.map((clicks) =>
    ((clicks / totalClicks) * 100).toFixed(2)
  );

  // Create color arrays
  const backgroundColor = [
    "rgba(75, 192, 192, 0.6)",
    "rgba(153, 102, 255, 0.6)",
    "rgba(255, 159, 64, 0.6)",
    "rgba(54, 162, 235, 0.6)",
    "rgba(255, 99, 132, 0.6)",
    "rgba(255, 206, 86, 0.6)",
    "rgba(75, 192, 192, 0.6)",
    "rgba(153, 102, 255, 0.6)",
    "rgba(255, 159, 64, 0.6)",
    "rgba(54, 162, 235, 0.6)",
  ];

  // Ensure we have enough colors for all browsers
  while (backgroundColor.length < labels.length) {
    backgroundColor.push(...backgroundColor);
  }

  // Destroy existing chart if it exists
  if (browserChart) {
    browserChart.destroy();
  }

  browserChart = new Chart(canvas.getContext("2d"), {
    type: "pie",
    data: {
      datasets: [
        {
          data: clickPercentages,
          backgroundColor: backgroundColor.slice(0, labels.length),
          label: "Browser Statistics",
        },
      ],
      labels: labels,
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true,
          position: "bottom",
        },
        tooltip: {
          callbacks: {
            label: function (tooltipItem) {
              return `${tooltipItem.label}: ${tooltipItem.raw}% of total clicks`;
            },
          },
        },
      },
    },
  });
};

// Initialize the event handlers on document load
document.addEventListener("DOMContentLoaded", function () {
  console.log("Browser Performance data handler loaded");

  const browserPerformanceBtn = document.getElementById(
    "browserPerformanceBtn"
  );
  if (browserPerformanceBtn) {
    browserPerformanceBtn.addEventListener("click", function () {
      [
        "dailyMetricsTable",
        "osPerformanceTable",
        "geoPerformanceTable",
        "sitePerformanceTable",
      ].forEach((id) => {
        document.getElementById(id)?.style.setProperty("display", "none");
      });
      document
        .getElementById("browserPerformanceTable")
        ?.style.setProperty("display", "table");
    });
  }
});
