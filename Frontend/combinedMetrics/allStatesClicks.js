import config from "../config.js";

document.addEventListener("DOMContentLoaded", function () {
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

const fetchGeoPerformanceData = async (roNumber, startDate, endDate) => {
  try {
    console.log("Fetching geo performance data...");
    const email = localStorage.getItem("userEmail");
    const authToken = localStorage.getItem("authToken");

    // const apiUrl = `https://backend-api.performacemedia.com:8000/api/metrics/region?clientEmail=${email}&roNumber=${roNumber}&startDate=${startDate || ''}&endDate=${endDate || ''}`;
    const apiUrl = `${
      config.BASE_URL
    }/api/metrics/region?clientEmail=${email}&roNumber=${roNumber}&startDate=${
      startDate || ""
    }&endDate=${endDate || ""}`;

    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      // credentials: 'include'
    });

    console.log("Response Status:", response.status);
    const rawResponse = await response.text();
    console.log("Raw API Response:", rawResponse);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch geo performance data: ${response.statusText}`
      );
    }

    let responseData;
    try {
      responseData = JSON.parse(rawResponse);
    } catch (error) {
      console.error("Error parsing the response data:", error);
      return;
    }

    console.log("Parsed Geo Performance Data:", responseData);

    if (
      !responseData.allStatesData ||
      !Array.isArray(responseData.allStatesData)
    ) {
      console.error("No data available or incorrect data format returned");
      return;
    }

    responseData.allStatesData.sort((a, b) => b.clicks - a.clicks);
    const tableBody = document.querySelector("#geoPerformanceTable tbody");
    if (!tableBody) {
      console.error("Table body element not found in the DOM.");
      return;
    }

    tableBody.innerHTML = "";

    // Add total row if totalCTR is available
    if (responseData.totalCTR !== undefined) {
      const totalRow = document.createElement("tr");
      totalRow.classList.add("total-row");
      totalRow.innerHTML = `
                <td><strong>Total</strong></td>
                <td><strong>${responseData.totalClicks}</strong></td>
                <td><strong>${responseData.totalImpressions}</strong></td>
                <td><strong>${responseData.totalCTR}%</strong></td>
            `;
      tableBody.appendChild(totalRow);
    }

    responseData.allStatesData.forEach((item) => {
      const region = item.state || "Unknown Region";
      const clicks = item.clicks !== undefined ? item.clicks : 0;
      const impressions = item.impressions !== undefined ? item.impressions : 0;
      const ctr = item.ctr !== undefined ? `${item.ctr}%` : "0.00%";

      const row = document.createElement("tr");
      row.innerHTML = `
                <td>${region}</td>
                <td>${clicks}</td>
                <td>${impressions}</td>
                <td>${ctr ? ctr.toUpperCase() : "0.00%"}</td>
            `;
      tableBody.appendChild(row);
    });
  } catch (error) {
    console.error("Error fetching geo performance data:", error);
  }
};

if (typeof window.initializeGeoData === "undefined") {
  window.initializeGeoData = function () {
    const selectedRO = sessionStorage.getItem("selectedRO");
    const startDate = sessionStorage.getItem("startDate");
    const endDate = sessionStorage.getItem("endDate");
    if (selectedRO) {
      fetchGeoPerformanceData(selectedRO, startDate, endDate);
    }
  };
  window.fetchGeoPerformanceData = fetchGeoPerformanceData;
  window.initializeGeoData();
}
