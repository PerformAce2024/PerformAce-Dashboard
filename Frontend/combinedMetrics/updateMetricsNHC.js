import config from "../helper/config.js";

let dailyMetricsChart = null;

/**
 * Updates the Dashboard Metrics, including stats cards, daily metrics table, and chart
 * with the provided aggregated data
 * @param {Object} aggregatedData - The aggregated performance data object
 */
export const updateDashboardMetrics = (aggregatedData) => {
  try {
    console.log(
      "Updating Dashboard Metrics with aggregated data:",
      aggregatedData
    );

    if (!aggregatedData) {
      console.error("No aggregated data available");
      return;
    }

    // Update stats cards with overall metrics
    updateStatsCards(aggregatedData);

    // Update daily metrics table and chart
    updateDailyMetricsTable(aggregatedData);

    // Update chart visualization
    updateDailyMetricsChart(aggregatedData);
  } catch (error) {
    console.error("Error updating dashboard metrics:", error);

    // Show error in the table
    const tableBody = document.querySelector("#dailyMetricsTable tbody");
    if (tableBody) {
      tableBody.innerHTML = `<tr><td colspan="6" class="text-center">Error processing dashboard metrics: ${error.message}</td></tr>`;
    }
  }
};

/**
 * Updates the stats cards with overall metrics
 * @param {Object} aggregatedData - The aggregated performance data object
 */
const updateStatsCards = (aggregatedData) => {
  try {
    // Update total cost card
    const totalSpentElement = document.querySelector(".total-spent");
    if (totalSpentElement) {
      const totalSpent = aggregatedData.totalSpent || 0;
      totalSpentElement.textContent = `₹${totalSpent
        .toFixed(2)
        .toLocaleString()}`;
    }

    // Update total clicks card
    const totalClicksElement = document.querySelector(".total-clicks");
    if (totalClicksElement) {
      const totalClicks = aggregatedData.totalClicks || 0;
      totalClicksElement.textContent = totalClicks.toLocaleString();
    }

    // Calculate days left (this will need to be adjusted based on your campaign duration logic)
    // This is just a placeholder, as your actual days left calculation might depend on campaign data
    const daysLeftElement = document.querySelector(".days-left");
    if (daysLeftElement) {
      // This is a placeholder - you might need to replace this with actual calculation
      // based on campaign end date from your aggregated data
      const campaignEndDate = getCampaignEndDate(aggregatedData);
      const daysLeft = calculateDaysLeft(campaignEndDate);
      daysLeftElement.textContent = `${daysLeft} days left`;
    }
  } catch (error) {
    console.error("Error updating stats cards:", error);
  }
};

/**
 * Updates the daily metrics table with aggregated data
 * @param {Object} aggregatedData - The aggregated performance data object
 */
const updateDailyMetricsTable = (aggregatedData) => {
  try {
    const tableBody = document.querySelector("#dailyMetricsTable tbody");
    if (!tableBody) {
      console.error("Daily metrics table body not found");
      return;
    }

    tableBody.innerHTML = ""; // Clear existing rows

    // Convert dailyPerformance object to array and sort by date
    const dailyMetrics = Object.entries(aggregatedData.dailyPerformance || {})
      .map(([date, metrics]) => {
        return {
          date,
          totalClicks: metrics.clicks || 0,
          totalImpressions: metrics.impressions || 0,
          amountSpent: metrics.spent || 0,
          ctr: metrics.impressions
            ? ((metrics.clicks / metrics.impressions) * 100).toFixed(2)
            : "0.00",
          cpc:
            metrics.clicks && metrics.spent
              ? (metrics.spent / metrics.clicks).toFixed(2)
              : "0.00",
        };
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Add total row
    const totalClicks = dailyMetrics.reduce(
      (sum, item) => sum + item.totalClicks,
      0
    );
    const totalImpressions = dailyMetrics.reduce(
      (sum, item) => sum + item.totalImpressions,
      0
    );
    const totalSpent = dailyMetrics.reduce(
      (sum, item) => sum + item.amountSpent,
      0
    );
    const totalCTR =
      totalImpressions > 0
        ? ((totalClicks / totalImpressions) * 100).toFixed(2)
        : "0.00";
    const totalCPC =
      totalClicks > 0 ? (totalSpent / totalClicks).toFixed(2) : "0.00";

    const totalRow = document.createElement("tr");
    totalRow.classList.add("total-row", "fw-700", "bg-light");
    totalRow.innerHTML = `
      <td><strong>Total</strong></td>
      <td><strong>${totalClicks.toLocaleString()}</strong></td>
      <td><strong>${totalImpressions.toLocaleString()}</strong></td>
      <td><strong>₹${totalCPC}</strong></td>
      <td><strong>${totalCTR}%</strong></td>
    `;
    tableBody.appendChild(totalRow);

    // Add daily data rows
    dailyMetrics.forEach((metric) => {
      const amountSpent = metric.amountSpent
        ? `₹${metric.amountSpent.toFixed(2).toLocaleString()}`
        : "₹0.00";

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${formatDate(metric.date)}</td>
        <td>${metric.totalClicks.toLocaleString()}</td>
        <td>${metric.totalImpressions.toLocaleString()}</td>
        <td>₹${metric.cpc}</td>
        <td>${metric.ctr}%</td>
      `;
      tableBody.appendChild(row);
    });
  } catch (error) {
    console.error("Error updating daily metrics table:", error);

    const tableBody = document.querySelector("#dailyMetricsTable tbody");
    if (tableBody) {
      tableBody.innerHTML = `<tr><td colspan="6" class="text-center">Error updating table: ${error.message}</td></tr>`;
    }
  }
};

/**
 * Updates the daily metrics chart with aggregated data
 * @param {Object} aggregatedData - The aggregated performance data object
 */
const updateDailyMetricsChart = (aggregatedData) => {
  try {
    const canvasElement = document.getElementById("campaignAreaChart");
    if (!canvasElement) {
      console.error("Canvas element not found for daily metrics chart");
      return;
    }

    // Convert and sort daily data
    const dailyData = Object.entries(aggregatedData.dailyPerformance || {})
      .map(([date, data]) => ({
        date,
        clicks: data.clicks || 0,
        impressions: data.impressions || 0,
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const dates = dailyData.map((item) => formatDate(item.date));
    const clicks = dailyData.map((item) => item.clicks);
    const impressions = dailyData.map((item) => item.impressions);

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
            borderColor: "rgba(255, 159, 64, 1)",
            backgroundColor: "rgba(255, 159, 64, 0.2)",
            fill: true,
            tension: 0.4,
          },
          {
            label: "Impressions",
            data: impressions,
            borderColor: "rgba(54, 162, 235, 1)",
            backgroundColor: "rgba(54, 162, 235, 0.2)",
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
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
  } catch (error) {
    console.error("Error updating daily metrics chart:", error);
  }
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
 * Gets the campaign end date from aggregated data
 * @param {Object} aggregatedData - The aggregated performance data object
 * @returns {Date} Campaign end date
 */
const getCampaignEndDate = (aggregatedData) => {
  // This is a placeholder - extract the end date from your data structure
  // You might need to adjust this based on your actual data structure

  // For example, if you have it in a campaign object:
  // return new Date(aggregatedData.campaign?.endDate);

  // For demo purposes, setting end date to 10 days from now
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 10);
  return endDate;
};

/**
 * Calculates days left until the given date
 * @param {Date} endDate - Campaign end date
 * @returns {Number} Number of days left
 */
const calculateDaysLeft = (endDate) => {
  const today = new Date();
  const diffTime = endDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays); // Ensure we don't show negative days
};

// Initialize the event handlers on document load
document.addEventListener("DOMContentLoaded", function () {
  console.log("Dashboard Metrics handler loaded");

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
