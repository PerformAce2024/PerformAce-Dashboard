import { renderLineChart } from "./linechart.js";

export const updateUIWithPerformanceData = (data) => {
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
};

// Helper function to update progress bars
function updateProgressBar(selector, value, maxValue) {
  const progressBar = document.querySelector(selector);
  if (progressBar) {
    const percentage = Math.min(Math.max((value / maxValue) * 100, 0), 100);
    progressBar.style.width = `${percentage}%`;
  }
}
