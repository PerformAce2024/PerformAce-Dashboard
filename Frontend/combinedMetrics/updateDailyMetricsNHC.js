import config from "../helper/config.js";

let dailyMetricsChart = null;

/**
 * Updates the Daily Metrics Table and Chart with the provided aggregated data
 * @param {Object} aggregatedData - The aggregated performance data object
 */
export const updateDailyMetrics = (aggregatedData) => {
  try {
    console.log("Updating Daily Metrics with aggregated data:", aggregatedData);

    if (!aggregatedData || !aggregatedData.dailyPerformance) {
      console.error("No daily performance data available in aggregated data");
      return;
    }

    // Convert the dailyPerformance object to an array of daily data
    const dailyData = Object.entries(aggregatedData.dailyPerformance).map(
      ([date, data]) => ({
        date,
        clicks: data.clicks || 0,
        impressions: data.impressions || 0,
        spent: data.spent || 0,
        // Calculate CTR and CPC
        ctr:
          data.impressions > 0
            ? ((data.clicks / data.impressions) * 100).toFixed(2)
            : "0.00",
        cpc: data.clicks > 0 ? (data.spent / data.clicks).toFixed(2) : "0.00",
      })
    );

    console.log("Transformed daily data:", dailyData);

    // Sort data by date for the chart (chronological order)
    const chartData = [...dailyData].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    // Extract data for chart
    const dates = chartData.map((item) => formatDate(item.date));
    const clicks = chartData.map((item) => item.clicks);
    const impressions = chartData.map((item) => item.impressions);

    // Update area chart
    updateAreaChart(dates, clicks, impressions);

    // Sort data by clicks in descending order for table
    const sortedData = [...dailyData].sort((a, b) => b.clicks - a.clicks);

    // Update table with sorted data
    updateDailyTable(sortedData);
  } catch (error) {
    console.error("Error updating daily metrics:", error);

    // Show error in the table
    const tableBody = document.getElementById("metricsTableBody");
    if (tableBody) {
      tableBody.innerHTML = `<tr><td colspan="6" class="text-center">Error processing daily metrics: ${error.message}</td></tr>`;
    }
  }
};

/**
 * Updates the daily metrics table with the provided data
 * @param {Array} dailyData - Array of daily performance data
 */
const updateDailyTable = (dailyData) => {
  const tableBody = document.getElementById("metricsTableBody");
  if (!tableBody) {
    console.error("Daily metrics table body element not found");
    return;
  }

  tableBody.innerHTML = "";

  // Calculate totals
  const totalClicks = dailyData.reduce((sum, item) => sum + item.clicks, 0);
  const totalImpressions = dailyData.reduce(
    (sum, item) => sum + item.impressions,
    0
  );
  const totalSpent = dailyData.reduce((sum, item) => sum + item.spent, 0);
  const totalCTR =
    totalImpressions > 0
      ? ((totalClicks / totalImpressions) * 100).toFixed(2)
      : "0.00";
  const totalCPC =
    totalClicks > 0 ? (totalSpent / totalClicks).toFixed(2) : "0.00";

  // Add total row
  const totalRow = document.createElement("tr");
  totalRow.classList.add("total-row");
  totalRow.innerHTML = `
    <td><strong>Total</strong></td>
    <td><strong>${totalClicks.toLocaleString()}</strong></td>
    <td><strong>${totalImpressions.toLocaleString()}</strong></td>
    <td><strong>₹${totalCPC}</strong></td>
    <td><strong>₹${totalSpent.toFixed(2).toLocaleString()}</strong></td>
    <td><strong>${totalCTR}%</strong></td>
  `;
  tableBody.appendChild(totalRow);

  // Add data rows
  dailyData.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${formatDate(item.date)}</td>
      <td>${item.clicks.toLocaleString()}</td>
      <td>${item.impressions.toLocaleString()}</td>
      <td>₹${item.cpc}</td>
      <td>₹${item.spent.toFixed(2).toLocaleString()}</td>
      <td>${item.ctr}%</td>
    `;
    tableBody.appendChild(row);
  });
};

/**
 * Formats a date string to "DD/MM/YYYY" format
 * @param {String} dateString - ISO date string
 * @returns {String} Formatted date string
 */
const formatDate = (dateString) => {
  try {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch (e) {
    console.error("Error formatting date:", e);
    return dateString;
  }
};

/**
 * Updates the area chart with daily metrics data
 * @param {Array} dates - Array of formatted date strings
 * @param {Array} clicks - Array of clicks for each date
 * @param {Array} impressions - Array of impressions for each date
 */
const updateAreaChart = (dates, clicks, impressions) => {
  const canvasElement = document.getElementById("campaignAreaChart");
  if (!canvasElement) {
    console.error("Canvas element not found for daily metrics chart");
    return;
  }

  const ctx = canvasElement.getContext("2d");

  // Destroy existing chart if it exists
  if (dailyMetricsChart) {
    dailyMetricsChart.destroy();
  }

  dailyMetricsChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: dates,
      datasets: [
        {
          label: "Clicks",
          data: clicks,
          borderColor: "rgba(75, 192, 192, 1)",
          backgroundColor: "rgba(75, 192, 192, 0.1)",
          fill: true,
          tension: 0.4,
        },
        {
          label: "Impressions",
          data: impressions,
          borderColor: "rgba(153, 102, 255, 1)",
          backgroundColor: "rgba(153, 102, 255, 0.1)",
          fill: true,
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              if (value >= 1000000) {
                return (value / 1000000).toFixed(1) + "M";
              } else if (value >= 1000) {
                return (value / 1000).toFixed(1) + "K";
              }
              return value;
            },
          },
        },
        x: {
          ticks: {
            autoSkip: true,
            maxRotation: 45,
            minRotation: 0,
          },
        },
      },
      plugins: {
        tooltip: {
          mode: "index",
          intersect: false,
          callbacks: {
            label: function (context) {
              let label = context.dataset.label || "";
              if (label) {
                label += ": ";
              }
              if (context.parsed.y !== null) {
                label += context.parsed.y.toLocaleString();
              }
              return label;
            },
          },
        },
        legend: {
          position: "top",
        },
      },
      interaction: {
        mode: "nearest",
        axis: "x",
        intersect: false,
      },
    },
  });
};

// Initialize the event handlers on document load
document.addEventListener("DOMContentLoaded", function () {
  console.log("Daily Metrics handler loaded");

  const dailyMetricsBtn = document.getElementById("dailyMetricsBtn");
  if (dailyMetricsBtn) {
    dailyMetricsBtn.addEventListener("click", function () {
      [
        "osPerformanceTable",
        "geoPerformanceTable",
        "browserPerformanceTable",
        "sitePerformanceTable",
      ].forEach((id) => {
        document.getElementById(id)?.style.setProperty("display", "none");
      });
      document
        .getElementById("dailyMetricsTable")
        ?.style.setProperty("display", "table");
    });
  }
});
