import config from "../helper/config.js";

export const fetchTaboolaDailyMetrics = async (campaignId) => {
  try {
    console.log("Starting to fetch Taboola daily metrics...");
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
      const renderLineChart = (clicksData) => {
        try {
          const formattedClicksData = clicksData
            .filter((item) => item?.date)
            .map((item) => [
              new Date(item.date).getTime(),
              Number(item.clicks) || 0,
            ])
            .sort((a, b) => a[0] - b[0]);

          if (formattedClicksData.length === 0) return;

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
            $.plot(chartContainer, [{ data: formattedClicksData }], options);
          }
        } catch (error) {
          console.error("Error rendering chart:", error);
        }
      };
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
