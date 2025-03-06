import config from "../helper/config.js";

const fetchTaboolaDailyMetrics = async () => {
  try {
    console.log("Starting to fetch Taboola daily metrics...");
    const campaignId = "42938360"; // Replace with the actual campaign ID or a dynamic value
    // const dailyMetricsUrl = `https://backend-api.performacemedia.com:8000/api/taboola/getAdminDailyMetrics/${campaignId}`;
    const dailyMetricsUrl = `${config.BASE_URL}/api/taboola/getAdminDailyMetrics/${campaignId}`;

    console.log(`Requesting daily metrics from URL: ${dailyMetricsUrl}`);
    const response = await fetch(dailyMetricsUrl, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    console.log("Daily metrics response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error fetching daily metrics: ${errorText}`);
      throw new Error(`Error fetching daily metrics: ${errorText}`);
    }

    const data = await response.json();
    console.log("Taboola Daily Metrics Data:", data);

    // Check if data exists and contains dailyMetrics
    if (data && data.dailyMetrics && data.dailyMetrics.length > 0) {
      const tableBody = document.querySelector("#dailyMetricsTable tbody");
      if (!tableBody) {
        console.error("Table body element not found in the DOM.");
        return;
      }

      tableBody.innerHTML = ""; // Clear existing rows

      data.dailyMetrics.forEach((metric) => {
        const row = document.createElement("tr");
        row.innerHTML = `
                    <td>${metric.date}</td>
                    <td>${metric.clicks}</td>
                    <td>${metric.impressions}</td>
                    <td>₹${metric.avgCpc.toFixed(2)}</td>
                    <td>${metric.ctr.toFixed(2)}%</td>
                    <td>₹${metric.amountSpent.toFixed(2)}</td>
                `;
        tableBody.appendChild(row);
      });

      // Pass the daily metrics data to render the line chart
      renderLineChart(data.dailyMetrics);
    } else {
      console.warn("No daily metrics data found.");
      const tableBody = document.querySelector("#dailyMetricsTable tbody");
      if (tableBody) {
        const noDataRow = document.createElement("tr");
        noDataRow.innerHTML = `<td colspan="6" class="text-center">No data available</td>`;
        tableBody.appendChild(noDataRow);
      }
    }
  } catch (error) {
    console.error("Error fetching Taboola daily metrics:", error);
    const tableBody = document.querySelector("#dailyMetricsTable tbody");
    if (tableBody) {
      const errorRow = document.createElement("tr");
      errorRow.innerHTML = `<td colspan="6" class="text-center text-danger">Failed to load data</td>`;
      tableBody.appendChild(errorRow);
    }
  }
};

// Invoke the function to fetch and display data
fetchTaboolaDailyMetrics();
