// Function to populate tables with aggregated data and implement filters
function initializeMetricsTables(aggregatedData) {
  if (!aggregatedData) {
    console.error("No aggregated data available for tables");
    return;
  }

  // Create filter buttons
  createFilterButtons();

  // Populate all tables with data
  populateDailyMetricsTable(aggregatedData);
  populateOsPerformanceTable(aggregatedData);
  populateGeoPerformanceTable(aggregatedData);
  populateBrowserPerformanceTable(aggregatedData);
  //   populateSitePerformanceTable(aggregatedData);

  // Show daily metrics table by default
  showTable("dailyMetricsTable");
}

// Create filter buttons
function createFilterButtons() {
  const filterContainer = document.createElement("div");
  filterContainer.className = "btn-group btn-group-sm mb-3";
  filterContainer.setAttribute("role", "group");
  filterContainer.setAttribute("aria-label", "Metrics Filters");

  const filters = [
    { id: "dailyMetricsTable", label: "Daily Performance" },
    { id: "osPerformanceTable", label: "OS Performance" },
    { id: "geoPerformanceTable", label: "Regional Performance" },
    { id: "browserPerformanceTable", label: "Browser Performance" },
    // { id: "sitePerformanceTable", label: "Publishers Performance" },
  ];

  filters.forEach((filter) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn btn-outline-primary";
    button.textContent = filter.label;
    button.addEventListener("click", () => showTable(filter.id));
    filterContainer.appendChild(button);
  });

  // Insert filter buttons before the table
  const metricsPanel = document.querySelector("#metricsTable .panel-content");
  if (metricsPanel) {
    metricsPanel.insertBefore(filterContainer, metricsPanel.firstChild);
  }
}

// Show the selected table and hide others
function showTable(tableId) {
  // Hide all tables
  const tables = [
    "dailyMetricsTable",
    "osPerformanceTable",
    "geoPerformanceTable",
    "sitePerformanceTable",
    "browserPerformanceTable",
  ];

  tables.forEach((id) => {
    const table = document.getElementById(id);
    if (table) {
      table.style.display = "none";
    }
  });

  // Show the selected table
  const selectedTable = document.getElementById(tableId);
  if (selectedTable) {
    selectedTable.style.display = "table";

    // Update active button
    const buttons = document.querySelectorAll(".btn-group button");
    buttons.forEach((button) => {
      if (
        button.textContent
          .toLowerCase()
          .includes(
            tableId
              .replace("PerformanceTable", "")
              .replace("dailyMetricsTable", "daily")
          )
      ) {
        button.classList.remove("btn-outline-primary");
        button.classList.add("btn-primary");
      } else {
        button.classList.remove("btn-primary");
        button.classList.add("btn-outline-primary");
      }
    });
  }
}

// Populate Daily Metrics Table
function populateDailyMetricsTable(data) {
  const tableBody = document.getElementById("metricsTableBody");
  if (!tableBody || !data.dailyPerformance) return;

  tableBody.innerHTML = "";

  // Convert dailyPerformance object to array and sort by date
  const dailyData = Object.entries(data.dailyPerformance)
    .filter(([date, metrics]) => metrics.clicks > 0 || metrics.impressions > 0)
    .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB));

  dailyData.forEach(([date, metrics]) => {
    const row = document.createElement("tr");

    // Calculate CTR and CPC
    const ctr =
      metrics.impressions > 0
        ? ((metrics.clicks / metrics.impressions) * 100).toFixed(2)
        : "0.00";
    const cpc =
      metrics.clicks > 0 ? (metrics.spent / metrics.clicks).toFixed(2) : "0.00";

    // Format date
    const formattedDate = new Date(date).toLocaleDateString();

    row.innerHTML = `
        <td>${formattedDate}</td>
        <td>${metrics.clicks.toLocaleString()}</td>
        <td>${metrics.impressions.toLocaleString()}</td>
        <td>${cpc}</td>
        <td>${ctr}%</td>
      `;

    tableBody.appendChild(row);
  });
}

// Populate OS Performance Table
function populateOsPerformanceTable(data) {
  const tableBody = document.getElementById("metricsOsTableBody");
  if (!tableBody || !data.osPerformance) return;

  tableBody.innerHTML = "";

  // Convert to array and sort by clicks (descending)
  const osData = Object.entries(data.osPerformance).sort(
    ([, a], [, b]) => b.clicks - a.clicks
  );

  osData.forEach(([osFamily, metrics]) => {
    const row = document.createElement("tr");

    // Calculate CTR
    const ctr =
      metrics.impressions > 0
        ? ((metrics.clicks / metrics.impressions) * 100).toFixed(2)
        : "0.00";

    row.innerHTML = `
        <td>${osFamily}</td>
        <td>${metrics.clicks.toLocaleString()}</td>
        <td>${metrics.impressions.toLocaleString()}</td>
        <td>${ctr}%</td>
      `;

    tableBody.appendChild(row);
  });
}

// Populate Geo Performance Table
function populateGeoPerformanceTable(data) {
  const tableBody = document.getElementById("metricsGeoTableBody");
  if (!tableBody || !data.regionPerformance) return;

  tableBody.innerHTML = "";

  // Convert to array and sort by clicks (descending)
  const geoData = Object.entries(data.regionPerformance).sort(
    ([, a], [, b]) => b.clicks - a.clicks
  );

  geoData.forEach(([region, metrics]) => {
    const row = document.createElement("tr");

    // Calculate CTR
    const ctr =
      metrics.impressions > 0
        ? ((metrics.clicks / metrics.impressions) * 100).toFixed(2)
        : "0.00";

    row.innerHTML = `
        <td>${region}</td>
        <td>${metrics.clicks.toLocaleString()}</td>
        <td>${metrics.impressions.toLocaleString()}</td>
        <td>${ctr}%</td>
      `;

    tableBody.appendChild(row);
  });
}

// Populate Browser Performance Table
function populateBrowserPerformanceTable(data) {
  const tableBody = document.getElementById("metricsBrowserTableBody");
  if (!tableBody || !data.browserPerformance) return;

  tableBody.innerHTML = "";

  // Convert to array and sort by clicks (descending)
  const browserData = Object.entries(data.browserPerformance).sort(
    ([, a], [, b]) => b.clicks - a.clicks
  );

  browserData.forEach(([browser, metrics]) => {
    const row = document.createElement("tr");

    // Calculate CTR
    const ctr =
      metrics.impressions > 0
        ? ((metrics.clicks / metrics.impressions) * 100).toFixed(2)
        : "0.00";

    row.innerHTML = `
        <td>${browser}</td>
        <td>${metrics.clicks.toLocaleString()}</td>
        <td>${metrics.impressions.toLocaleString()}</td>
        <td>${ctr}%</td>
      `;

    tableBody.appendChild(row);
  });
}

// Populate Site Performance Table
function populateSitePerformanceTable(data) {
  const tableBody = document.getElementById("metricsSiteTableBody");
  if (!tableBody) return;

  tableBody.innerHTML = "";

  // Since site data might not be directly available in your current data structure,
  // we may need to adapt this function based on your actual data
  // This is a placeholder implementation

  if (data.sitePerformance) {
    // If you have site performance data, use it
    const siteData = Object.entries(data.sitePerformance).sort(
      ([, a], [, b]) => b.clicks - a.clicks
    );

    siteData.forEach(([site, metrics]) => {
      const row = document.createElement("tr");

      // Calculate CTR
      const ctr =
        metrics.impressions > 0
          ? ((metrics.clicks / metrics.impressions) * 100).toFixed(2)
          : "0.00";

      row.innerHTML = `
          <td>${site}</td>
          <td>${metrics.clicks.toLocaleString()}</td>
          <td>${metrics.impressions.toLocaleString()}</td>
          <td>${ctr}%</td>
        `;

      tableBody.appendChild(row);
    });
  } else {
    // If site data is not available, display a message
    const row = document.createElement("tr");
    row.innerHTML = `
        <td colspan="4" class="text-center">Site performance data not available</td>
      `;
    tableBody.appendChild(row);
  }
}

// Function to update UI with performance data
export function updateMetricsTableWithPerformanceData(aggregatedData) {
  console.log("Updating UI with performance data:", aggregatedData);

  // Initialize metrics tables with filters
  initializeMetricsTables(aggregatedData);

  // Update other UI components as needed
  updateTotalMetricsUI(aggregatedData);
  updateRegionalPerformanceUI(aggregatedData);
}

// Update total metrics dashboard section
function updateTotalMetricsUI(data) {
  // Implementation depends on your dashboard layout
  // Update metrics cards or summary section
  console.log(
    "Would update total metrics UI with:",
    data.totalClicks,
    data.totalImpressions,
    data.totalSpent
  );
}

// Update regional performance UI components
function updateRegionalPerformanceUI(data) {
  // Implementation for updating regional performance panels
  console.log("Would update regional performance UI with top regions");
}

// Call this from your fetchCampaignDataTotal function
// fetchCampaignDataTotal(selectedRO).then(result => {
//   if (result && result.aggregatedData) {
//     updateUIWithPerformanceData(result.aggregatedData);
//   }
// });
