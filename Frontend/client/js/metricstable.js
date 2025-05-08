function showTable(tableId) {
  // Hide all tables
  const tables = [
    "dailyMetricsTable",
    "osPerformanceTable",
    "devicePerformanceTable",
    "geoPerformanceTable",
    "browserPerformanceTable",
    "sitePerformanceTable",
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

    // Update current table
    currentTable = tableId;

    // Show/hide appropriate filters for this table
    showFilterForTable(tableId);

    // Update active button
    const buttons = document.querySelectorAll(
      ".btn-group[aria-label='Metrics Filters'] button"
    );
    buttons.forEach((button) => {
      if (
        button.textContent
          .toLowerCase()
          .includes(
            tableId
              .replace("PerformanceTable", "")
              .replace("dailyMetricsTable", "daily")
              .replace("devicePerformanceTable", "device")
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

// // Initialize metrics tables with filters
function initializeMetricsTables(aggregatedData) {
  if (!aggregatedData) {
    console.error("No aggregated data available for tables");
    return;
  }

  // Store the full dataset for filtering
  fullDataset = aggregatedData;

  // Create filter buttons for tables
  createFilterButtons();

  // Create date range filters
  dateFilterContainer = createDateRangeFilters();

  // Create category filters - but don't attach them to DOM yet
  osFilterContainer = createOsFilters();
  deviceFilterContainer = createDeviceFilters();
  regionFilterContainer = createRegionFilters();
  browserFilterContainer = createBrowserFilters();

  // Extract device type from OS data
  extractDeviceTypeData();

  // Create device type table if it doesn't exist
  createDeviceTypeTable();

  // Populate all tables with data
  updateTablesWithFilteredData(aggregatedData);

  // Show daily metrics table by default
  showTable("dailyMetricsTable");
}

// // Extract device type from OS data and create a devicePerformance object
function extractDeviceTypeData() {
  if (!fullDataset || !fullDataset.osPerformance) return;

  // Create devicePerformance object if it doesn't exist
  fullDataset.devicePerformance = {
    Desktop: { clicks: 0, impressions: 0, spent: 0 },
    Tablet: { clicks: 0, impressions: 0, spent: 0 },
    Smartphone: { clicks: 0, impressions: 0, spent: 0 },
    Unknown: { clicks: 0, impressions: 0, spent: 0 },
  };

  // Iterate through OS performance data
  Object.entries(fullDataset.osPerformance).forEach(([osName, metrics]) => {
    // Extract device type from OS name
    const deviceType = getDeviceTypeFromOS(osName);

    // Add metrics to the appropriate device type
    fullDataset.devicePerformance[deviceType].clicks += metrics.clicks || 0;
    fullDataset.devicePerformance[deviceType].impressions +=
      metrics.impressions || 0;
    fullDataset.devicePerformance[deviceType].spent += metrics.spent || 0;
  });
}

// // Helper function to extract device type from OS name
function getDeviceTypeFromOS(osName) {
  const osLower = osName.toLowerCase();
  if (osLower.includes("desktop")) return "Desktop";
  if (osLower.includes("tablet")) return "Tablet";
  if (osLower.includes("smartphone")) return "Smartphone";
  return "Unknown";
}

// // Create table selector buttons
function createFilterButtons() {
  const filterContainer = document.createElement("div");
  filterContainer.className = "btn-group btn-group-sm mb-3";
  filterContainer.setAttribute("role", "group");
  filterContainer.setAttribute("aria-label", "Metrics Filters");

  const filters = [
    { id: "dailyMetricsTable", label: "Daily Performance" },
    { id: "osPerformanceTable", label: "OS Performance" },
    { id: "devicePerformanceTable", label: "Device Type" },
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

  // Insert filter buttons at the beginning of the panel content
  const metricsPanel = document.querySelector("#metricsTable .panel-content");
  if (metricsPanel) {
    metricsPanel.insertBefore(filterContainer, metricsPanel.firstChild);
  }
}

// // Create date range filters
function createDateRangeFilters() {
  const filterContainer = document.createElement("div");
  filterContainer.className =
    "date-filter-container mb-3 mt-2 p-3 bg-light rounded";

  // Create filter header
  const filterHeader = document.createElement("h6");
  filterHeader.className = "fw-bold";
  filterHeader.textContent = "Filter by Date Range:";
  filterContainer.appendChild(filterHeader);

  // Create button group for predefined ranges
  const buttonGroup = document.createElement("div");
  buttonGroup.className = "btn-group btn-group-sm mb-2";

  // Add predefined range buttons
  const rangeOptions = [
    { id: DATE_RANGES.ALL_TIME, label: "All Time" },
    { id: DATE_RANGES.LAST_WEEK, label: "Last Week" },
    { id: DATE_RANGES.LAST_MONTH, label: "Last Month" },
    { id: DATE_RANGES.CUSTOM, label: "Custom Range" },
  ];

  rangeOptions.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn btn-outline-secondary";
    button.id = `range-${option.id}`;
    button.textContent = option.label;
    button.addEventListener("click", () => {
      // Update active button
      document
        .querySelectorAll(".date-filter-container .btn-group .btn")
        .forEach((btn) => {
          btn.classList.remove("btn-secondary");
          btn.classList.add("btn-outline-secondary");
        });
      button.classList.remove("btn-outline-secondary");
      button.classList.add("btn-secondary");

      // Set current date range
      currentDateRange = option.id;

      // Show/hide custom date inputs
      toggleCustomDateInputs(option.id === DATE_RANGES.CUSTOM);

      // Apply the filter
      applyFilters();
    });
    buttonGroup.appendChild(button);
  });

  filterContainer.appendChild(buttonGroup);

  // Create custom date range inputs
  const customDateContainer = document.createElement("div");
  customDateContainer.id = "customDateContainer";
  customDateContainer.className = "custom-date-inputs mt-2";
  customDateContainer.style.display = "none";

  // Create a row for date inputs
  const dateInputRow = document.createElement("div");
  dateInputRow.className = "row g-2";

  // Start date column
  const startDateCol = document.createElement("div");
  startDateCol.className = "col-md-5";

  // Start date input group
  const startDateGroup = document.createElement("div");
  startDateGroup.className = "input-group input-group-sm mb-2";

  const startDateLabel = document.createElement("span");
  startDateLabel.className = "input-group-text";
  startDateLabel.textContent = "Start Date";

  const startDateInput = document.createElement("input");
  startDateInput.type = "date";
  startDateInput.className = "form-control";
  startDateInput.id = "customStartDate";
  startDateInput.addEventListener("change", (e) => {
    customStartDate = e.target.value;
    if (customEndDate) {
      applyFilters();
    }
  });

  startDateGroup.appendChild(startDateLabel);
  startDateGroup.appendChild(startDateInput);
  startDateCol.appendChild(startDateGroup);

  // End date column
  const endDateCol = document.createElement("div");
  endDateCol.className = "col-md-5";

  // End date input group
  const endDateGroup = document.createElement("div");
  endDateGroup.className = "input-group input-group-sm mb-2";

  const endDateLabel = document.createElement("span");
  endDateLabel.className = "input-group-text";
  endDateLabel.textContent = "End Date";

  const endDateInput = document.createElement("input");
  endDateInput.type = "date";
  endDateInput.className = "form-control";
  endDateInput.id = "customEndDate";
  endDateInput.addEventListener("change", (e) => {
    customEndDate = e.target.value;
    if (customStartDate) {
      applyFilters();
    }
  });

  endDateGroup.appendChild(endDateLabel);
  endDateGroup.appendChild(endDateInput);
  endDateCol.appendChild(endDateGroup);

  // Apply button column
  const applyBtnCol = document.createElement("div");
  applyBtnCol.className = "col-md-2";

  // Apply button
  const applyButton = document.createElement("button");
  applyButton.type = "button";
  applyButton.className = "btn btn-sm btn-primary mt-1";
  applyButton.textContent = "Apply";
  applyButton.addEventListener("click", () => {
    if (!customStartDate || !customEndDate) {
      alert("Please select both start and end dates.");
      return;
    }
    applyFilters();
  });

  applyBtnCol.appendChild(applyButton);

  // Add columns to row
  dateInputRow.appendChild(startDateCol);
  dateInputRow.appendChild(endDateCol);
  dateInputRow.appendChild(applyBtnCol);

  // Add row to container
  customDateContainer.appendChild(dateInputRow);
  filterContainer.appendChild(customDateContainer);

  // Insert date filter controls
  const metricsPanel = document.querySelector("#metricsTable .panel-content");
  if (metricsPanel) {
    const filterButtons = metricsPanel.querySelector(
      '.btn-group[aria-label="Metrics Filters"]'
    );
    if (filterButtons) {
      filterButtons.after(filterContainer);
    } else {
      metricsPanel.insertBefore(filterContainer, metricsPanel.firstChild);
    }
  }

  // Set "All Time" as active by default
  document
    .getElementById(`range-${DATE_RANGES.ALL_TIME}`)
    .classList.add("btn-secondary");
  document
    .getElementById(`range-${DATE_RANGES.ALL_TIME}`)
    .classList.remove("btn-outline-secondary");

  return filterContainer;
}

// Toggle display of custom date inputs
function toggleCustomDateInputs(show) {
  const container = document.getElementById("customDateContainer");
  if (container) {
    container.style.display = show ? "block" : "none";
  }
}

// // Create OS filter container
function createOsFilters() {
  const container = document.createElement("div");
  container.className =
    "category-filter-container os-filter mb-3 p-2 bg-light rounded";
  container.style.display = "none"; // Hidden by default

  const title = document.createElement("h6");
  title.className = "fw-bold mb-2";
  title.textContent = "Filter by Operating System:";
  container.appendChild(title);

  // Create OS filters
  createCategoryFilterGroup(
    container,
    "",
    [
      { id: CATEGORY_FILTERS.OS.ALL, label: "All OS" },
      { id: CATEGORY_FILTERS.OS.IOS, label: "iOS" },
      { id: CATEGORY_FILTERS.OS.ANDROID, label: "Android" },
      { id: CATEGORY_FILTERS.OS.LINUX, label: "Linux" },
    ],
    "os"
  );

  return container;
}

// // Create device type filter container
function createDeviceFilters() {
  const container = document.createElement("div");
  container.className =
    "category-filter-container device-filter mb-3 p-2 bg-light rounded";
  container.style.display = "none"; // Hidden by default

  const title = document.createElement("h6");
  title.className = "fw-bold mb-2";
  title.textContent = "Filter by Device Type:";
  container.appendChild(title);

  //   // Create device filters
  createCategoryFilterGroup(
    container,
    "",
    [
      { id: CATEGORY_FILTERS.DEVICE.ALL, label: "All Devices" },
      { id: CATEGORY_FILTERS.DEVICE.DESKTOP, label: "Desktop" },
      { id: CATEGORY_FILTERS.DEVICE.TABLET, label: "Tablet" },
      { id: CATEGORY_FILTERS.DEVICE.SMARTPHONE, label: "Smartphone" },
    ],
    "device"
  );

  return container;
}

// // Create region filter container
function createRegionFilters() {
  const container = document.createElement("div");
  container.className =
    "category-filter-container region-filter mb-3 p-2 bg-light rounded";
  container.style.display = "none"; // Hidden by default

  const title = document.createElement("h6");
  title.className = "fw-bold mb-2";
  title.textContent = "Filter by City Classifications:";
  container.appendChild(title);

  // Create region filters
  createCategoryFilterGroup(
    container,
    "",
    [
      { id: CATEGORY_FILTERS.REGION.ALL, label: "All Regions" },
      { id: CATEGORY_FILTERS.REGION.METRO, label: "Metro Cities" },
      { id: CATEGORY_FILTERS.REGION.TIER1, label: "Tier 1 Cities" },
      { id: CATEGORY_FILTERS.REGION.TIER2, label: "Tier 2 Cities" },
      { id: CATEGORY_FILTERS.REGION.TOP25, label: "Top 25 Cities" },
      { id: CATEGORY_FILTERS.REGION.TOP50, label: "Top 50 Cities" },
    ],
    "region"
  );

  return container;
}

// // Create browser filter container
function createBrowserFilters() {
  const container = document.createElement("div");
  container.className =
    "category-filter-container browser-filter mb-3 p-2 bg-light rounded";
  container.style.display = "none"; // Hidden by default

  const title = document.createElement("h6");
  title.className = "fw-bold mb-2";
  title.textContent = "Filter by Browser:";
  container.appendChild(title);

  // Create browser filters
  createCategoryFilterGroup(
    container,
    "",
    [
      { id: CATEGORY_FILTERS.BROWSER.ALL, label: "All Browsers" },
      { id: CATEGORY_FILTERS.BROWSER.CHROME, label: "Chrome" },
      { id: CATEGORY_FILTERS.BROWSER.SAFARI, label: "Safari" },
      { id: CATEGORY_FILTERS.BROWSER.FIREFOX, label: "Firefox" },
      { id: CATEGORY_FILTERS.BROWSER.EDGE, label: "Edge" },
      { id: CATEGORY_FILTERS.BROWSER.OTHER, label: "Other" },
    ],
    "browser"
  );

  return container;
}

// // Helper function to create a group of category filters
function createCategoryFilterGroup(
  parentContainer,
  title,
  options,
  filterType
) {
  // Create group container
  const groupContainer = document.createElement("div");
  groupContainer.className = "filter-group mb-2";

  // Create filter title if provided
  if (title) {
    const filterTitle = document.createElement("h6");
    filterTitle.className = "font-weight-bold mb-2 small";
    filterTitle.textContent = title;
    groupContainer.appendChild(filterTitle);
  }

  // Create button group for this category
  const buttonGroup = document.createElement("div");
  buttonGroup.className = "d-flex flex-wrap gap-1";

  // Add filter buttons
  options.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn btn-outline-secondary btn-xs mb-1";
    button.style.fontSize = "0.75rem";
    button.style.padding = "0.15rem 0.4rem";
    button.textContent = option.label;
    button.id = `${filterType}-${option.id}`;

    // Set active state for default (ALL) option
    if (option.id.includes("all")) {
      button.classList.remove("btn-outline-secondary");
      button.classList.add("btn-secondary");
    }

    // Add click event handler
    button.addEventListener("click", () => {
      // Update active button state
      document
        .querySelectorAll(`button[id^="${filterType}-"]`)
        .forEach((btn) => {
          btn.classList.remove("btn-secondary");
          btn.classList.add("btn-outline-secondary");
        });
      button.classList.remove("btn-outline-secondary");
      button.classList.add("btn-secondary");

      // Update filter setting
      currentFilters[filterType] = option.id;

      // Apply filters
      applyFilters();
    });

    buttonGroup.appendChild(button);
  });

  groupContainer.appendChild(buttonGroup);
  parentContainer.appendChild(groupContainer);
}

// Show/hide the appropriate filter container based on the active table
function showFilterForTable(tableId) {
  // Hide all category filter containers
  if (osFilterContainer) osFilterContainer.style.display = "none";
  if (deviceFilterContainer) deviceFilterContainer.style.display = "none";
  if (regionFilterContainer) regionFilterContainer.style.display = "none";
  if (browserFilterContainer) browserFilterContainer.style.display = "none";

  // Show the date filter for all tables
  if (dateFilterContainer) dateFilterContainer.style.display = "block";

  // Add the appropriate filter container to the DOM if not already present
  const metricsPanel = document.querySelector("#metricsTable .panel-content");
  const dateFilter = document.querySelector(".date-filter-container");

  // Show the specific filter based on the table ID
  switch (tableId) {
    case "osPerformanceTable":
      // Show OS filters
      if (osFilterContainer && !osFilterContainer.parentNode) {
        dateFilter.after(osFilterContainer);
      }
      if (osFilterContainer) osFilterContainer.style.display = "block";
      break;
    case "devicePerformanceTable":
      // Show device filters
      if (deviceFilterContainer && !deviceFilterContainer.parentNode) {
        dateFilter.after(deviceFilterContainer);
      }
      if (deviceFilterContainer) deviceFilterContainer.style.display = "block";
      break;
    case "geoPerformanceTable":
      // Show region filters
      if (regionFilterContainer && !regionFilterContainer.parentNode) {
        dateFilter.after(regionFilterContainer);
      }
      if (regionFilterContainer) regionFilterContainer.style.display = "block";
      break;
    case "browserPerformanceTable":
      // Show browser filters
      if (browserFilterContainer && !browserFilterContainer.parentNode) {
        dateFilter.after(browserFilterContainer);
      }
      if (browserFilterContainer)
        browserFilterContainer.style.display = "block";
      break;
    default:
      // No specific filters for other tables
      break;
  }
}
// Function to initialize the enhanced region filtering
function initializeEnhancedRegionFiltering(cityStateData) {
  // Initialize city-state mapping
  const { cityToState: cityStateMap, stateToCities: stateCitiesMap } =
    prepareCityStateMapping(cityStateData);

  // Store in global variables for easy access
  cityToState = cityStateMap;
  stateToCities = stateCitiesMap;

  // Update the region table header based on the current filter
  const updateRegionTableHeader = () => {
    const tableHeader = document.querySelector(
      "#geoPerformanceTable thead tr th:first-child"
    );
    if (tableHeader) {
      if (currentFilters.region === CATEGORY_FILTERS.REGION.ALL) {
        tableHeader.textContent = "State";
      } else {
        tableHeader.textContent = "City";
      }
    }
  };

  // Add event listener to update table header when filter changes
  document.querySelectorAll('button[id^="region-"]').forEach((button) => {
    button.addEventListener("click", () => {
      updateRegionTableHeader();
    });
  });

  // Update the header if the geo table is already shown
  if (currentTable === "geoPerformanceTable") {
    updateRegionTableHeader();
  }
}
// Export the main initialization function
export function updateMetricsTableWithPerformanceData(aggregatedData) {
  console.log("Initializing metrics tables with filters");

  // Initialize metrics tables with context-specific filters
  initializeMetricsTables(aggregatedData);

  // Initialize enhanced region filtering
  initializeEnhancedRegionFiltering(cityStateData);
}

// City-state mapping data
const cityStateData = `City,State,Country
Bangalore,Karnataka,India
Mumbai,Maharashtra,India
Jaipur,Rajasthan,India
Hyderabad,Telangana,India
Chennai,Tamil Nadu,India
Kolkata,West Bengal,India
Pune,Maharashtra,India
Varanasi,Uttar Pradesh,India
Ahmedabad,Gujarat,India
Lucknow,Uttar Pradesh,India
Mysuru,Karnataka,India
Amritsar,Punjab,India
Kochi,Kerala,India
Indore,Madhya Pradesh,India
Agra,Uttar Pradesh,India
Visakhapatnam,Andhra Pradesh,India
Vishakhapatnam,Andhra Pradesh,India
Pondicherry,Tamil Nadu,India
Dehradun,Uttarakhand,India
Coimbatore,Tamil Nadu,India
Bhubaneshwar,Odisha,India
Srinagar,Jammu and Kashmir,India
Guwahati,Assam,India
Thiruvananthapuram,Kerala,India
Chandigarh,Chandigarh,India
Nashik,Maharashtra,India
Madurai,Tamil Nadu,India
Jodhpur,Rajasthan,India
Ujjain,Madhya Pradesh,India
Shimla,Himachal Pradesh,India
Bhopal,Madhya Pradesh,India
Mangalore,Karnataka,India
Raipur,Chhattisgarh,India
Patna,Bihar,India
Vijayawada,Andhra Pradesh,India
Vadodara,Gujarat,India
Nagpur,Maharashtra,India
Tiruchirappalli,Tamil Nadu,India
Ajmer,Rajasthan,India
Calicut,Kerala,India
Kolhapur,Maharashtra,India
Surat,Gujarat,India
Ranchi,Jharkhand,India
Jammu,Jammu and Kashmir,India
Jabalpur,Madhya Pradesh,India
Jalandhar,Punjab,India
Vellore,Tamil Nadu,India
Rajkot,Gujarat,India
Gwalior,Madhya Pradesh,India
Salem,Tamil Nadu,India
Jamshedpur,Jharkhand,India
Ludhiana,Punjab,India
Kanpur,Uttar Pradesh,India
Thrissur,Kerala,India
Guntur,Andhra Pradesh,India
Bikaner,Rajasthan,India
Jamnagar,Gujarat,India
Dhanbad,Jharkhand,India
Bhavnagar,Gujarat,India
Cuttack,Odisha,India
Bhilai,Chhattisgarh,India
Malappuram,Kerala,India
Udaipur,Rajasthan,India
Bengaluru,Karnataka,India`;

// Parse and prepare city-state mapping
function prepareCityStateMapping(cityData) {
  const cityToState = {};
  const stateToCities = {};
  const cityAliases = {
    bengaluru: "bangalore",
    vishakhapatnam: "visakhapatnam",
    // Add more aliases as needed
  };

  // Parse the city data (skip header row)
  const cityLines = cityData.split("\n");
  cityLines.slice(1).forEach((line) => {
    const [city, state] = line.split(",");
    const cityLower = city.toLowerCase();

    // Add to city → state mapping
    cityToState[cityLower] = state;

    // Handle aliases
    if (cityAliases[cityLower]) {
      cityToState[cityAliases[cityLower]] = state;
    }

    // Add to state → cities mapping
    if (!stateToCities[state]) {
      stateToCities[state] = [];
    }

    // Only add if not already in list (to handle aliases)
    if (!stateToCities[state].some((c) => c.toLowerCase() === cityLower)) {
      stateToCities[state].push(city);
    }
  });

  return { cityToState, stateToCities };
}

// Populate device type table
function populateDeviceTypeTable(data) {
  const tableBody = document.getElementById("metricsDeviceTableBody");
  if (!tableBody || !data.devicePerformance) return;

  tableBody.innerHTML = "";

  // Convert to array and sort by clicks (descending)
  const deviceData = Object.entries(data.devicePerformance).sort(
    ([, a], [, b]) => b.clicks - a.clicks
  );

  deviceData.forEach(([deviceType, metrics]) => {
    const row = document.createElement("tr");

    // Calculate CTR
    const ctr =
      metrics.impressions > 0
        ? ((metrics.clicks / metrics.impressions) * 100).toFixed(2)
        : "0.00";

    row.innerHTML = `
      <td>${deviceType}</td>
      <td>${metrics.clicks.toLocaleString()}</td>
      <td>${metrics.impressions.toLocaleString()}</td>
      <td>${ctr}</td>
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
        <td>${ctr}</td>
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
        <td>${ctr}</td>
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
        <td>${ctr}</td>
      `;

    tableBody.appendChild(row);
  });
}

function populateDailyMetricsTable(data) {
  const tableBody = document.getElementById("metricsTableBody");
  if (!tableBody || !data.dailyPerformance) return;

  tableBody.innerHTML = "";

  // Check user role from localStorage
  const userRole = localStorage.getItem("userrole");
  const isAdmin = userRole === "Admin";

  // Convert dailyPerformance object to array and sort by date
  const dailyData = Object.entries(data.dailyPerformance)
    .filter(([date, metrics]) => metrics.clicks > 0 || metrics.impressions > 0)
    .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA)); // Reverse chronological order

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

    // Only show CPC if user is Admin
    if (isAdmin) {
      row.innerHTML = `
        <td>${formattedDate}</td>
        <td>${metrics.clicks.toLocaleString()}</td>
        <td>${metrics.impressions.toLocaleString()}</td>
        <td>${ctr}</td>
        <td>${cpc}</td>
      `;
    } else {
      row.innerHTML = `
        <td>${formattedDate}</td>
        <td>${metrics.clicks.toLocaleString()}</td>
        <td>${metrics.impressions.toLocaleString()}</td>
        <td>${ctr}</td>
      `;
    }

    tableBody.appendChild(row);
  });
}
// Populate Site Performance Table (Publishers)
function populateSitePerformanceTable(data) {
  const tableBody = document.getElementById("metricsSiteTableBody");
  if (!tableBody || !data.sitePerformance) return;

  tableBody.innerHTML = "";

  // Convert to array and sort by clicks (descending)
  const siteData = Object.entries(data.sitePerformance || {}).sort(
    ([, a], [, b]) => b.clicks - a.clicks
  );

  if (siteData.length === 0) {
    // Display a message if no site data is available
    const row = document.createElement("tr");
    row.innerHTML = `
      <td colspan="4" class="text-center">Publisher data not available</td>
    `;
    tableBody.appendChild(row);
    return;
  }

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
      <td>${ctr}</td>
    `;

    tableBody.appendChild(row);
  });
}

// Create device type table
function createDeviceTypeTable() {
  // Check if table already exists
  if (document.getElementById("devicePerformanceTable")) {
    return;
  }

  // Create table container
  const deviceTable = document.createElement("table");
  deviceTable.id = "devicePerformanceTable";
  deviceTable.className = "table table-striped table-bordered";
  deviceTable.style.display = "none"; // Hidden by default

  // Create table header
  const tableHeader = document.createElement("thead");
  tableHeader.innerHTML = `
    <tr>
      <th>Device Type</th>
      <th>Clicks</th>
      <th>Impressions</th>
      <th>CTR (%)</th>
    </tr>
  `;

  // Create table body
  const tableBody = document.createElement("tbody");
  tableBody.id = "metricsDeviceTableBody";

  // Append header and body to table
  deviceTable.appendChild(tableHeader);
  deviceTable.appendChild(tableBody);

  // Add table to DOM
  const metricsPanel = document.querySelector("#metricsTable .panel-content");
  if (metricsPanel) {
    metricsPanel.appendChild(deviceTable);
  }
}

// Update tables with filtered data
function updateTablesWithFilteredData(filteredData) {
  // Update all tables with the filtered data
  populateDailyMetricsTable(filteredData);
  populateOsPerformanceTable(filteredData);
  populateGeoPerformanceTable(filteredData);
  populateBrowserPerformanceTable(filteredData);

  // Update site/publisher performance table if it exists
  if (
    document.getElementById("metricsSiteTableBody") &&
    filteredData.sitePerformance
  ) {
    populateSitePerformanceTable(filteredData);
  }

  // Populate device type table
  populateDeviceTypeTable(filteredData);
}

// Enhanced normalizeRegionName function
function normalizeRegionName(region) {
  // Handle special cases for Delhi
  if (region === "National Capital Territory of Delhi, India") {
    return "Delhi";
  }

  // Handle special cases for Union Territories
  if (region.startsWith("Union Territory of ")) {
    return region.replace("Union Territory of ", "").replace(", India", "");
  }

  // Regular case - just remove ", India" suffix
  return region.replace(/, India$/, "");
}

// Helper function to check if a region name is a state
function isState(regionName, stateToCities) {
  const normalizedName = normalizeRegionName(regionName);
  return stateToCities.hasOwnProperty(normalizedName);
}

// Helper function to check if a region name is a city
function isCity(regionName, cityToState) {
  const normalizedName = normalizeRegionName(regionName).toLowerCase();
  return cityToState.hasOwnProperty(normalizedName);
}

// Updated Indian city classifications with pure city names (no states or other entities)
const UPDATED_CITY_CLASSIFICATIONS = {
  // Metro cities
  METRO: [
    "Mumbai",
    "Delhi",
    "Bangalore",
    "Hyderabad",
    "Chennai",
    "Kolkata",
    "Ahmedabad",
    "Pune",
  ],
  // Tier 1 cities (metros + other major cities)
  TIER1: [
    "Mumbai",
    "Delhi",
    "Bangalore",
    "Hyderabad",
    "Chennai",
    "Kolkata",
    "Ahmedabad",
    "Pune",
    "Surat",
    "Jaipur",
    "Lucknow",
    "Kanpur",
    "Nagpur",
    "Indore",
    "Thane",
  ],
  // Tier 2 cities
  TIER2: [
    "Bhopal",
    "Visakhapatnam",
    "Vadodara",
    "Patna",
    "Ludhiana",
    "Agra",
    "Nashik",
    "Meerut",
    "Rajkot",
    "Varanasi",
    "Srinagar",
    "Aurangabad",
    "Dhanbad",
    "Amritsar",
    "Allahabad",
    "Ranchi",
    "Coimbatore",
    "Jabalpur",
    "Gwalior",
    "Vijayawada",
    "Jodhpur",
    "Madurai",
    "Raipur",
  ],
  // Top 25 cities by population
  TOP25: [
    "Mumbai",
    "Delhi",
    "Bangalore",
    "Hyderabad",
    "Ahmedabad",
    "Chennai",
    "Kolkata",
    "Surat",
    "Pune",
    "Jaipur",
    "Lucknow",
    "Kanpur",
    "Nagpur",
    "Indore",
    "Thane",
    "Bhopal",
    "Visakhapatnam",
    "Patna",
    "Vadodara",
    "Ludhiana",
    "Agra",
    "Nashik",
    "Faridabad",
    "Meerut",
    "Rajkot",
  ],
  // Top 50 cities (includes all TOP25 plus 25 more)
  TOP50: [
    "Mumbai",
    "Delhi",
    "Bangalore",
    "Hyderabad",
    "Ahmedabad",
    "Chennai",
    "Kolkata",
    "Surat",
    "Pune",
    "Jaipur",
    "Lucknow",
    "Kanpur",
    "Nagpur",
    "Indore",
    "Thane",
    "Bhopal",
    "Visakhapatnam",
    "Patna",
    "Vadodara",
    "Ludhiana",
    "Agra",
    "Nashik",
    "Faridabad",
    "Meerut",
    "Rajkot",
    "Varanasi",
    "Srinagar",
    "Aurangabad",
    "Dhanbad",
    "Amritsar",
    "Allahabad",
    "Ranchi",
    "Coimbatore",
    "Jabalpur",
    "Gwalior",
    "Vijayawada",
    "Jodhpur",
    "Madurai",
    "Raipur",
    "Kota",
    "Chandigarh",
    "Guwahati",
    "Solapur",
    "Hubli-Dharwad",
    "Mysore",
    "Tirupur",
    "Salem",
    "Tiruchirappalli",
    "Bareilly",
    "Aligarh",
  ],
};

// Date range options
const DATE_RANGES = {
  ALL_TIME: "all",
  LAST_WEEK: "week",
  LAST_MONTH: "month",
  CUSTOM: "custom",
};

// Category filter options - updated with Indian city classifications
const CATEGORY_FILTERS = {
  OS: {
    ALL: "all",
    IOS: "ios",
    ANDROID: "android",
    LINUX: "linux",
  },
  DEVICE: {
    ALL: "all",
    DESKTOP: "desktop",
    TABLET: "tablet",
    SMARTPHONE: "smartphone",
  },
  REGION: {
    ALL: "all",
    METRO: "metro",
    TIER1: "tier1",
    TIER2: "tier2",
    TOP25: "top25",
    TOP50: "top50",
  },
  BROWSER: {
    ALL: "all",
    CHROME: "chrome",
    SAFARI: "safari",
    FIREFOX: "firefox",
    EDGE: "edge",
    OTHER: "other",
  },
};

// Store current table, filters and data
let fullDataset = null;
let currentTable = "dailyMetricsTable";
let currentDateRange = DATE_RANGES.ALL_TIME;
let customStartDate = null;
let customEndDate = null;
let currentFilters = {
  os: CATEGORY_FILTERS.OS.ALL,
  device: CATEGORY_FILTERS.DEVICE.ALL,
  region: CATEGORY_FILTERS.REGION.ALL,
  browser: CATEGORY_FILTERS.BROWSER.ALL,
};

// Active filter containers
let dateFilterContainer = null;
let osFilterContainer = null;
let deviceFilterContainer = null;
let regionFilterContainer = null;
let browserFilterContainer = null;

// City-State mapping data storage
let cityToState = {};
let stateToCities = {};

// Enhanced applyFilters function with improved region filtering
function applyFilters() {
  // Deep clone the full dataset
  let filteredData = JSON.parse(JSON.stringify(fullDataset));

  // Apply date filter
  if (currentDateRange !== DATE_RANGES.ALL_TIME) {
    // Calculate date range
    let startDate, endDate;

    if (
      currentDateRange === DATE_RANGES.CUSTOM &&
      customStartDate &&
      customEndDate
    ) {
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate);
      // Set time to end of day for the end date
      endDate.setHours(23, 59, 59, 999);
    } else {
      endDate = new Date(); // Today

      if (currentDateRange === DATE_RANGES.LAST_WEEK) {
        startDate = new Date();
        startDate.setDate(endDate.getDate() - 7);
      } else if (currentDateRange === DATE_RANGES.LAST_MONTH) {
        startDate = new Date();
        startDate.setMonth(endDate.getMonth() - 1);
      }
    }

    // Filter daily performance data
    if (filteredData.dailyPerformance) {
      const filteredDailyPerformance = {};

      Object.entries(filteredData.dailyPerformance).forEach(
        ([date, metrics]) => {
          const entryDate = new Date(date);
          if (entryDate >= startDate && entryDate <= endDate) {
            filteredDailyPerformance[date] = metrics;
          }
        }
      );

      // Replace with filtered data
      filteredData.dailyPerformance = filteredDailyPerformance;

      // Recalculate aggregated metrics for the filtered period
      recalculateAggregatedMetrics(filteredData);
    }
  }

  // Apply OS filter
  if (
    filteredData.osPerformance &&
    currentFilters.os !== CATEGORY_FILTERS.OS.ALL
  ) {
    const filteredOsPerformance = {};

    Object.entries(filteredData.osPerformance).forEach(([osName, metrics]) => {
      // Check if OS matches the filter
      const osLower = osName.toLowerCase();

      let shouldInclude = false;
      switch (currentFilters.os) {
        case CATEGORY_FILTERS.OS.IOS:
          shouldInclude = osLower.includes("ios") || osLower.includes("ipad");
          break;
        case CATEGORY_FILTERS.OS.ANDROID:
          shouldInclude = osLower.includes("android");
          break;
        case CATEGORY_FILTERS.OS.LINUX:
          shouldInclude = osLower.includes("linux");
          break;
      }

      if (shouldInclude) {
        filteredOsPerformance[osName] = metrics;
      }
    });

    filteredData.osPerformance = filteredOsPerformance;
  }

  // Apply device type filter
  if (
    filteredData.devicePerformance &&
    currentFilters.device !== CATEGORY_FILTERS.DEVICE.ALL
  ) {
    const filteredDevicePerformance = {};

    Object.entries(filteredData.devicePerformance).forEach(
      ([deviceType, metrics]) => {
        // Check if device type matches the filter
        const deviceTypeLower = deviceType.toLowerCase();

        let shouldInclude = false;
        switch (currentFilters.device) {
          case CATEGORY_FILTERS.DEVICE.DESKTOP:
            shouldInclude = deviceTypeLower === "desktop";
            break;
          case CATEGORY_FILTERS.DEVICE.TABLET:
            shouldInclude = deviceTypeLower === "tablet";
            break;
          case CATEGORY_FILTERS.DEVICE.SMARTPHONE:
            shouldInclude = deviceTypeLower === "smartphone";
            break;
        }

        if (shouldInclude) {
          filteredDevicePerformance[deviceType] = metrics;
        }
      }
    );

    filteredData.devicePerformance = filteredDevicePerformance;
  }

  // Apply browser filter
  if (
    filteredData.browserPerformance &&
    currentFilters.browser !== CATEGORY_FILTERS.BROWSER.ALL
  ) {
    const filteredBrowserPerformance = {};

    Object.entries(filteredData.browserPerformance).forEach(
      ([browserName, metrics]) => {
        // Check if browser matches the filter
        const browserLower = browserName.toLowerCase();

        let shouldInclude = false;
        switch (currentFilters.browser) {
          case CATEGORY_FILTERS.BROWSER.CHROME:
            shouldInclude = browserLower.includes("chrome");
            break;
          case CATEGORY_FILTERS.BROWSER.SAFARI:
            shouldInclude = browserLower.includes("safari");
            break;
          case CATEGORY_FILTERS.BROWSER.FIREFOX:
            shouldInclude = browserLower.includes("firefox");
            break;
          case CATEGORY_FILTERS.BROWSER.EDGE:
            shouldInclude = browserLower.includes("edge");
            break;
          case CATEGORY_FILTERS.BROWSER.OTHER:
            shouldInclude =
              !browserLower.includes("chrome") &&
              !browserLower.includes("safari") &&
              !browserLower.includes("firefox") &&
              !browserLower.includes("edge");
            break;
        }

        if (shouldInclude) {
          filteredBrowserPerformance[browserName] = metrics;
        }
      }
    );

    filteredData.browserPerformance = filteredBrowserPerformance;
  }

  // Enhanced region filter (with state and city support)
  if (filteredData.regionPerformance) {
    // First, normalize all region names
    const normalizedRegionPerformance = {};

    Object.entries(filteredData.regionPerformance).forEach(
      ([region, metrics]) => {
        const normalizedRegion = normalizeRegionName(region);

        if (!normalizedRegionPerformance[normalizedRegion]) {
          normalizedRegionPerformance[normalizedRegion] = {
            clicks: 0,
            impressions: 0,
            spent: 0,
            platform: {},
          };
        }

        // Add metrics
        normalizedRegionPerformance[normalizedRegion].clicks +=
          metrics.clicks || 0;
        normalizedRegionPerformance[normalizedRegion].impressions +=
          metrics.impressions || 0;
        normalizedRegionPerformance[normalizedRegion].spent +=
          metrics.spent || 0;

        // Add platform data
        if (metrics.platform) {
          Object.entries(metrics.platform).forEach(
            ([platform, platformMetrics]) => {
              if (
                !normalizedRegionPerformance[normalizedRegion].platform[
                  platform
                ]
              ) {
                normalizedRegionPerformance[normalizedRegion].platform[
                  platform
                ] = {
                  clicks: 0,
                  impressions: 0,
                  spent: 0,
                };
              }

              normalizedRegionPerformance[normalizedRegion].platform[
                platform
              ].clicks += platformMetrics.clicks || 0;
              normalizedRegionPerformance[normalizedRegion].platform[
                platform
              ].impressions += platformMetrics.impressions || 0;
              normalizedRegionPerformance[normalizedRegion].platform[
                platform
              ].spent += platformMetrics.spent || 0;
            }
          );
        }
      }
    );

    // Now apply the region filter based on the selected option
    if (currentFilters.region !== CATEGORY_FILTERS.REGION.ALL) {
      // If a city classification is selected, filter for those cities
      const cityClassification = currentFilters.region.toUpperCase();
      const cityList = UPDATED_CITY_CLASSIFICATIONS[cityClassification];

      if (cityList && cityList.length > 0) {
        const filteredRegionPerformance = {};

        // First pass: directly add cities that match the classification
        Object.entries(normalizedRegionPerformance).forEach(
          ([regionName, metrics]) => {
            // Check if this region name matches any city in the classification list
            const directMatch = cityList.some(
              (city) => city.toLowerCase() === regionName.toLowerCase()
            );

            if (directMatch) {
              filteredRegionPerformance[regionName] = metrics;
            }
          }
        );

        // Second pass: for state entries, find cities in that state that match the classification
        Object.entries(normalizedRegionPerformance).forEach(
          ([regionName, metrics]) => {
            // Skip if already added as a direct match
            if (filteredRegionPerformance[regionName]) return;

            // Check if this is a state
            if (isState(regionName, stateToCities)) {
              const citiesInState = stateToCities[regionName] || [];

              // Find cities in this state that match the classification
              const matchingCities = citiesInState.filter((city) =>
                cityList.some(
                  (classCity) => classCity.toLowerCase() === city.toLowerCase()
                )
              );

              if (matchingCities.length > 0) {
                // Add metrics for each matching city (distributing evenly)
                // This is a simplified approach - in a real app, we might have city-level data
                matchingCities.forEach((city) => {
                  filteredRegionPerformance[city] = {
                    clicks: Math.round(metrics.clicks / matchingCities.length),
                    impressions: Math.round(
                      metrics.impressions / matchingCities.length
                    ),
                    spent:
                      Math.round(
                        ((metrics.spent || 0) / matchingCities.length) * 100
                      ) / 100,
                    platform: {}, // Simplified - would need to distribute platform data too
                  };
                });
              }
            }
          }
        );

        filteredData.regionPerformance = filteredRegionPerformance;
      } else {
        // If no city list is defined, use the normalized data
        filteredData.regionPerformance = normalizedRegionPerformance;
      }
    } else {
      // For "All Regions", group data by states (not cities)
      const statePerformance = {};

      Object.entries(normalizedRegionPerformance).forEach(
        ([regionName, metrics]) => {
          let targetState = regionName;

          // If this is a city, add its metrics to the parent state
          if (isCity(regionName, cityToState)) {
            const state = cityToState[regionName.toLowerCase()];
            if (state) {
              targetState = state;
            }
          }

          // Initialize state entry if needed
          if (!statePerformance[targetState]) {
            statePerformance[targetState] = {
              clicks: 0,
              impressions: 0,
              spent: 0,
              platform: {},
            };
          }

          // Add metrics to state
          statePerformance[targetState].clicks += metrics.clicks || 0;
          statePerformance[targetState].impressions += metrics.impressions || 0;
          statePerformance[targetState].spent += metrics.spent || 0;

          // Merge platform data
          if (metrics.platform) {
            Object.entries(metrics.platform).forEach(
              ([platform, platformMetrics]) => {
                if (!statePerformance[targetState].platform[platform]) {
                  statePerformance[targetState].platform[platform] = {
                    clicks: 0,
                    impressions: 0,
                    spent: 0,
                  };
                }

                statePerformance[targetState].platform[platform].clicks +=
                  platformMetrics.clicks || 0;
                statePerformance[targetState].platform[platform].impressions +=
                  platformMetrics.impressions || 0;
                statePerformance[targetState].platform[platform].spent +=
                  platformMetrics.spent || 0;
              }
            );
          }
        }
      );

      filteredData.regionPerformance = statePerformance;
    }
  }

  // Update tables with filtered data
  updateTablesWithFilteredData(filteredData);

  return filteredData;
}
