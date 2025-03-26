import config from "../helper/config.js";

document.addEventListener("DOMContentLoaded", function () {
  console.log("Browser Performance data handler loaded");

  // Event listener for the "See All Data" button
  const browserPerformanceBtn = document.getElementById(
    "browserPerformanceBtn"
  );
  if (browserPerformanceBtn) {
    browserPerformanceBtn.addEventListener("click", function () {
      console.log("See All Data button clicked");

      // Hide the daily metrics table
      const dailyMetricsTable = document.getElementById("dailyMetricsTable");
      if (dailyMetricsTable) {
        dailyMetricsTable.style.display = "none";
      }

      const osPerformanceTable = document.getElementById("osPerformanceTable");
      if (osPerformanceTable) {
        osPerformanceTable.style.display = "none";
      }

      const geoPerformanceTable = document.getElementById(
        "geoPerformanceTable"
      );
      if (geoPerformanceTable) {
        geoPerformanceTable.style.display = "none";
      }

      // Show the browser performance table
      const browserPerformanceTable = document.getElementById(
        "browserPerformanceTable"
      );
      if (browserPerformanceTable) {
        browserPerformanceTable.style.display = "table";
      }
    });
  }
});

// Function to fetch browser statistics and update the table
export const fetchBrowserStatistics = async (campaignId) => {
  try {
    console.log("Fetching browser statistics...");
    // const apiUrl = `https://backend-api.performacemedia.com:8000/api/taboola/getClicksByBrowser/${campaignId}`;
    const apiUrl = `${config.BASE_URL}/api/taboola/getClicksByBrowser/${campaignId}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch browser statistics: ${response.statusText}`
      );
    }

    const responseData = await response.json();

    if (!responseData || responseData.length === 0) {
      console.error("No browser statistics data found.");
      return;
    }

    // Extract browser names and clicks from the response data
    const browserNames = responseData.map((item) => item.browser);
    const clicksData = responseData.map((item) => item.clicks);
    const impressionsData = responseData.map((item) => item.impressions);

    // Populate the browser performance table
    populateBrowserTable(browserNames, clicksData, impressionsData);

    // Optional: Update the pie chart with the fetched data
    updateBrowserPieChart(browserNames, clicksData);
  } catch (error) {
    console.error("Error fetching browser statistics:", error);
  }
};

// Function to populate the browser performance table with data
const populateBrowserTable = (browserNames, clicksData, impressionsData) => {
  const tableBody = document.querySelector("#browserPerformanceTable tbody");
  if (!tableBody) {
    console.error("Table body element not found in the DOM.");
    return;
  }

  tableBody.innerHTML = ""; // Clear existing rows

  browserNames.forEach((browser, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${browser}</td>
            <td>${clicksData[index] || 0}</td>
            <td>${impressionsData[index] || 0}</td>
        `;
    tableBody.appendChild(row);
  });
};

// Function to update the pie chart with dynamic data
const updateBrowserPieChart = (labels, data) => {
  const canvasElement = document
    .getElementById("pieChart")
    .querySelector("canvas");
  if (!canvasElement) {
    console.error("Canvas element not found in the DOM.");
    return;
  }
  const ctx = canvasElement.getContext("2d");

  const config = {
    type: "pie",
    data: {
      datasets: [
        {
          data: data, // Dynamic data for clicks
          backgroundColor: [
            "rgba(75, 192, 192, 0.6)",
            "rgba(153, 102, 255, 0.6)",
            "rgba(255, 159, 64, 0.6)",
            "rgba(54, 162, 235, 0.6)",
            "rgba(255, 99, 132, 0.6)",
          ],
          label: "Browser Statistics", // for legend
        },
      ],
      labels: labels, // Dynamic labels for browser names
    },
    options: {
      responsive: true,
      legend: {
        display: true,
        position: "bottom",
      },
    },
  };

  new Chart(ctx, config);
};

// Fetch and display browser statistics data
fetchBrowserStatistics("42938360"); // Replace with actual campaign ID
