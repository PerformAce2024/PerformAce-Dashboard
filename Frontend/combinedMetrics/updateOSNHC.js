// OS Performance Handler
document.addEventListener("DOMContentLoaded", function () {
  console.log("OS Performance handler loaded");

  const osPerformanceBtn = document.getElementById("osPerformanceBtn");
  if (osPerformanceBtn) {
    osPerformanceBtn.addEventListener("click", function () {
      [
        "dailyMetricsTable",
        "geoPerformanceTable",
        "browserPerformanceTable",
        "sitePerformanceTable",
      ].forEach((id) => {
        document.getElementById(id)?.style.setProperty("display", "none");
      });
      document
        .getElementById("osPerformanceTable")
        ?.style.setProperty("display", "table");
    });
  }
});

let osPerformanceChart = null;

/**
 * Updates the OS Performance Table and Chart with the provided aggregated data
 * @param {Object} aggregatedData - The aggregated performance data object
 */
export const updateOSPerformance = (aggregatedData) => {
  try {
    console.log(
      "Updating OS Performance with aggregated data:",
      aggregatedData
    );

    if (!aggregatedData || !aggregatedData.osPerformance) {
      console.error("No OS performance data available in aggregated data");
      return;
    }

    // Use direct osPerformance data from the aggregated data
    const osData = aggregatedData.osPerformance;

    // Group by OS family (formats like "Smartphone-Android", "Smartphone-iOS", etc.)
    const osFamilyGroups = {};

    Object.entries(osData).forEach(([osKey, data]) => {
      const parts = osKey.split("-");
      if (parts.length >= 2) {
        const deviceType = parts[0]; // e.g., "Smartphone"
        const osFamily = parts[1]; // e.g., "Android", "iOS"

        // Create a meaningful display name
        const displayName = `${deviceType} (${osFamily})`;

        if (!osFamilyGroups[displayName]) {
          osFamilyGroups[displayName] = {
            clicks: 0,
            impressions: 0,
            spent: 0,
          };
        }

        osFamilyGroups[displayName].clicks += data.clicks || 0;
        osFamilyGroups[displayName].impressions += data.impressions || 0;
        osFamilyGroups[displayName].spent += data.spent || 0;
      }
    });

    // Transform to array format for display
    const transformedData = Object.entries(osFamilyGroups)
      .map(([osFamily, data]) => ({
        osFamily,
        clicks: data.clicks,
        impressions: data.impressions,
        spent: data.spent,
        ctr:
          data.impressions > 0
            ? ((data.clicks / data.impressions) * 100).toFixed(2)
            : "0.00",
      }))
      .sort((a, b) => b.clicks - a.clicks);

    console.log("Transformed OS data:", transformedData);

    const osFamilies = transformedData.map((item) => item.osFamily);
    const osClicks = transformedData.map((item) => item.clicks);
    const osImpressions = transformedData.map((item) => item.impressions);
    const osSpent = transformedData.map((item) => item.spent);

    // Calculate total values
    const totalClicks = osClicks.reduce((a, b) => a + b, 0);
    const totalImpressions = osImpressions.reduce((a, b) => a + b, 0);
    const totalSpent = osSpent.reduce((a, b) => a + b, 0);
    const totalCTR =
      totalImpressions > 0
        ? ((totalClicks / totalImpressions) * 100).toFixed(2)
        : "0.00";

    const tableBody = document.querySelector("#osPerformanceTable tbody");
    if (tableBody) {
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

      transformedData.forEach((item) => {
        const row = document.createElement("tr");
        row.innerHTML = `
                    <td>${item.osFamily}</td>
                    <td>${item.clicks.toLocaleString()}</td>
                    <td>${item.impressions.toLocaleString()}</td>
                    <td>${item.ctr}%</td>
                `;
        tableBody.appendChild(row);
      });
    }

    updatePieChart(osFamilies, osClicks);
  } catch (error) {
    console.error("Error updating OS performance data:", error);

    // Show error in the table
    const tableBody = document.querySelector("#osPerformanceTable tbody");
    if (tableBody) {
      tableBody.innerHTML = `<tr><td colspan="5" class="text-center">Error processing OS data: ${error.message}</td></tr>`;
    }
  }
};

const updatePieChart = (osFamilies, osClicks) => {
  console.log("Updating pie chart with OS data...");
  const canvasElement = document
    .getElementById("radarChart")
    ?.getElementsByTagName("canvas")[0];
  if (!canvasElement) {
    console.error("Canvas element not found");
    return;
  }

  const ctx = canvasElement.getContext("2d");

  if (osPerformanceChart) {
    osPerformanceChart.destroy();
  }

  // Calculate percentage for each OS
  const totalClicks = osClicks.reduce((a, b) => a + b, 0);
  const clickPercentages = osClicks.map((clicks) =>
    ((clicks / totalClicks) * 100).toFixed(2)
  );

  // Handle case where we have more platforms than colors
  const baseColors = [
    "rgba(136,106,181, 0.2)",
    "rgba(29,201,183, 0.2)",
    "rgba(255,206,86, 0.2)",
    "rgba(54,162,235, 0.2)",
    "rgba(255,99,132, 0.2)",
    "rgba(75,192,192, 0.2)",
    "rgba(153,102,255, 0.2)",
    "rgba(255,159,64, 0.2)",
    "rgba(199,199,199, 0.2)",
    "rgba(83,102,255, 0.2)",
  ];

  const baseBorderColors = [
    "rgba(136,106,181, 1)",
    "rgba(29,201,183, 1)",
    "rgba(255,206,86, 1)",
    "rgba(54,162,235, 1)",
    "rgba(255,99,132, 1)",
    "rgba(75,192,192, 1)",
    "rgba(153,102,255, 1)",
    "rgba(255,159,64, 1)",
    "rgba(199,199,199, 1)",
    "rgba(83,102,255, 1)",
  ];

  // Ensure we have enough colors for all OS families
  const backgroundColors = [];
  const borderColors = [];

  for (let i = 0; i < osFamilies.length; i++) {
    backgroundColors.push(baseColors[i % baseColors.length]);
    borderColors.push(baseBorderColors[i % baseBorderColors.length]);
  }

  osPerformanceChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: osFamilies,
      datasets: [
        {
          label: "Clicks (%)",
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1,
          data: clickPercentages,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true,
          position: "top",
        },
        tooltip: {
          callbacks: {
            label: function (tooltipItem) {
              const percentage = parseFloat(tooltipItem.raw).toFixed(1);
              return `${tooltipItem.label}: ${percentage}% of total clicks`;
            },
          },
        },
      },
    },
  });
};

// Export the function to be used in the main module
