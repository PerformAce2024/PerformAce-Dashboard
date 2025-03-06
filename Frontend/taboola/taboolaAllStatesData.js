import config from "../helper/config.js";

document.addEventListener("DOMContentLoaded", function () {
  // Event listener for the "See All Data" button
  const geoPerformanceBtn = document.getElementById("geoPerformanceBtn");
  if (geoPerformanceBtn) {
    geoPerformanceBtn.addEventListener("click", function () {
      // Hide the daily metrics table
      const dailyMetricsTable = document.getElementById("dailyMetricsTable");
      if (dailyMetricsTable) {
        dailyMetricsTable.style.display = "none";
      }

      const osPerformanceTable = document.getElementById("osPerformanceTable");
      if (osPerformanceTable) {
        osPerformanceTable.style.display = "none";
      }

      const browserPerformanceTable = document.getElementById(
        "browserPerformanceTable"
      );
      if (browserPerformanceTable) {
        browserPerformanceTable.style.display = "none";
      }

      // Show the geo performance table
      const geoPerformanceTable = document.getElementById(
        "geoPerformanceTable"
      );
      if (geoPerformanceTable) {
        geoPerformanceTable.style.display = "table";
      }
    });
  }
});

// Function to fetch geo performance data
const fetchGeoPerformanceData = async (campaignId) => {
  try {
    console.log("Fetching geo performance data...");
    // const apiUrl = `https://backend-api.performacemedia.com:8000/api/taboola/getAllStatesByClicks/${campaignId}`;
    const apiUrl = `${config.BASE_URL}/api/taboola/getAllStatesByClicks/${campaignId}`;
    const response = await fetch(apiUrl);

    // Log the response status and the raw response text for debugging
    console.log("Response Status:", response.status);
    const rawResponse = await response.text();
    console.log("Raw API Response:", rawResponse);

    // Check if the response is okay
    if (!response.ok) {
      throw new Error(
        `Failed to fetch geo performance data: ${response.statusText}`
      );
    }

    // Try parsing the JSON response
    let responseData;
    try {
      responseData = JSON.parse(rawResponse);
    } catch (error) {
      console.error("Error parsing the response data:", error);
      return;
    }

    console.log("Parsed Geo Performance Data:", responseData);

    // Check if the responseData contains 'allStatesData'
    if (
      !responseData.allStatesData ||
      !Array.isArray(responseData.allStatesData) ||
      responseData.allStatesData.length === 0
    ) {
      console.error("No data available or incorrect data format returned");
      return;
    }

    // Access allStatesData
    const allStatesData = responseData.allStatesData;

    // Populate the geo performance table
    const tableBody = document.querySelector("#geoPerformanceTable tbody");
    if (!tableBody) {
      console.error("Table body element not found in the DOM.");
      return;
    }

    tableBody.innerHTML = ""; // Clear existing rows

    allStatesData.forEach((item) => {
      // Handle cases where clicks or impressions are zero, but don't mark as missing
      const region = item.state || "Unknown Region";
      const clicks = item.clicks !== undefined ? item.clicks : 0;
      const impressions = item.impressions !== undefined ? item.impressions : 0;

      // Create a new row for each state
      const row = document.createElement("tr");
      row.innerHTML = `
                <td>${region}</td>
                <td>${clicks}</td>
                <td>${impressions}</td>
            `;
      tableBody.appendChild(row);
    });
  } catch (error) {
    console.error("Error fetching geo performance data:", error);
  }
};

// Fetch and display geo performance data
fetchGeoPerformanceData("42938360"); // Replace with actual campaign ID
