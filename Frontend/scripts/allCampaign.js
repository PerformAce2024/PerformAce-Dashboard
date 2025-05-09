import config from "../helper/config.js";

// Debounce function to prevent excessive API calls
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      console.error("No auth token found in localStorage");
      alert("You are not authenticated. Please log in.");
      return;
    }

    // Initial state for filters
    let currentFilters = {
      client: "all",
      platform: "all",
      releaseOrder: "all",
      startDate: "",
      endDate: "",
    };

    // Fetch and populate initial data
    await populateClientDropdown(authToken);
    await populateReleaseOrderDropdown(authToken, "all");

    // Set default date range to last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    document.getElementById("startDate").valueAsDate = thirtyDaysAgo;
    document.getElementById("endDate").valueAsDate = today;

    currentFilters.startDate = formatDate(thirtyDaysAgo);
    currentFilters.endDate = formatDate(today);

    // Fetch initial data
    const initialData = await fetchFilteredData(authToken, currentFilters);
    updateTable(initialData);

    // Create debounced version of the filter application function
    const debouncedApplyFilters = debounce(async () => {
      const data = await fetchFilteredData(authToken, currentFilters);
      updateTable(data);
    }, 500);

    // Add event listener for client filter changes
    document
      .getElementById("clientFilter")
      .addEventListener("change", async (e) => {
        currentFilters.client = e.target.value;

        // Update RO dropdown when client changes
        await populateReleaseOrderDropdown(authToken, currentFilters.client);
        await populateReleaseOrderDropdown(authToken, currentFilters.client);
        currentFilters.releaseOrder = "all"; // Reset RO selection

        debouncedApplyFilters();
      });

    // Add event listener for platform filter changes
    document
      .getElementById("platformFilter")
      .addEventListener("change", async (e) => {
        currentFilters.platform = e.target.value;
        debouncedApplyFilters();
      });

    // Add event listener for release order filter changes
    document
      .getElementById("releaseOrderFilter")
      .addEventListener("change", async (e) => {
        currentFilters.releaseOrder = e.target.value;
        debouncedApplyFilters();
      });

    // Add event listeners for date range changes
    document
      .getElementById("startDate")
      .addEventListener("change", async (e) => {
        currentFilters.startDate = e.target.value;
        debouncedApplyFilters();
      });

    document.getElementById("endDate").addEventListener("change", async (e) => {
      currentFilters.endDate = e.target.value;
      debouncedApplyFilters();
    });
  } catch (error) {
    console.error("Error in initializing dashboard:", error);
  }
});

// Helper function to format dates for API calls
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Unified function for all filtered data fetching
async function fetchFilteredData(authToken, filters) {
  try {
    // Build query parameters
    const params = new URLSearchParams();

    if (filters.client !== "all") {
      params.append("clientName", filters.client);
    }

    if (filters.platform !== "all") {
      params.append("platform", filters.platform);
    }

    if (filters.releaseOrder !== "all") {
      params.append("releaseOrder", filters.releaseOrder);
    }

    if (filters.startDate) {
      params.append("startDate", filters.startDate);
    }

    if (filters.endDate) {
      params.append("endDate", filters.endDate);
    }

    const apiUrl = `${config.BASE_URL}/api/filteredData?${params.toString()}`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error fetching filtered data: ${errorText}`);
      throw new Error(`Error fetching filtered data: ${errorText}`);
    }

    const data = await response.json();
    console.log(`Filtered data with parameters: ${params.toString()}`, data);
    return data;
  } catch (error) {
    console.error("Error fetching filtered data:", error);
    throw error;
  }
}

// Fetch and populate client dropdown
async function populateClientDropdown(authToken) {
  try {
    const apiUrl = `${config.BASE_URL}/api/get-clients`;
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error fetching clients: ${errorText}`);
      return;
    }

    const responseData = await response.json();
    const clients = responseData.data;

    if (!clients || !Array.isArray(clients)) {
      console.error("Invalid clients data format:", responseData);
      return;
    }

    const uniqueClientNames = [
      ...new Set(clients.map((client) => client.name)),
    ];
    uniqueClientNames.sort();

    const dropdown = document.getElementById("clientFilter");
    dropdown.innerHTML = ""; // Clear existing options

    // Add "All Clients" option
    const allOption = document.createElement("option");
    allOption.value = "all";
    allOption.textContent = "All Clients";
    dropdown.appendChild(allOption);

    // Add client options
    uniqueClientNames.forEach((clientName) => {
      const option = document.createElement("option");
      option.value = clientName;
      option.textContent = clientName;
      dropdown.appendChild(option);
    });
  } catch (error) {
    console.error("Error populating client dropdown:", error);
  }
}

// Fetch and populate release order dropdown based on selected client
async function populateReleaseOrderDropdown(authToken, clientName) {
  try {
    const dropdown = document.getElementById("releaseOrderFilter");
    dropdown.innerHTML = ""; // Clear existing options

    // Add "All Release Orders" option
    const allOption = document.createElement("option");
    allOption.value = "all";
    allOption.textContent = "All Release Orders";
    dropdown.appendChild(allOption);

    // If "All Clients" is selected, we don't need to fetch specific ROs
    if (clientName === "all") {
      return;
    }

    const apiUrl = `${
      config.BASE_URL
    }/api/get-release-orders?clientName=${encodeURIComponent(clientName)}`;
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error fetching release orders: ${errorText}`);
      return;
    }

    const responseData = await response.json();
    const releaseOrders = responseData.releaseOrders;

    if (!releaseOrders || !Array.isArray(releaseOrders)) {
      console.error("Invalid release orders data format:", responseData);
      return;
    }

    // Add release order options
    releaseOrders.forEach((ro) => {
      const option = document.createElement("option");
      option.value = ro.roNumber;
      option.textContent = ro.roNumber;
      dropdown.appendChild(option);
    });
  } catch (error) {
    console.error("Error populating release order dropdown:", error);
  }
}

// Update table with fetched data
function updateTable(data) {
  const processedData = {
    dailyMetrics: [
      {
        clicks: data.totalClicks || 0,
        impressions: data.totalImpressions || 0,
        avgCpc: data.totalCPC || 0,
        ctr: (data.totalCTR || 0) * 100,
        amountSpent: data.totalSpent || 0,
      },
    ],
  };

  const tableBody = document.querySelector("#dailyMetricsTable tbody");
  if (!tableBody) {
    console.error("Table body element not found in the DOM.");
    return;
  }

  tableBody.innerHTML = "";

  processedData.dailyMetrics.forEach((metric) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${metric.clicks.toLocaleString()}</td>
      <td>${metric.impressions.toLocaleString()}</td>
      <td>₹${metric.avgCpc.toFixed(2)}</td>
      <td>${metric.ctr.toFixed(2)}%</td>
      <td>₹${metric.amountSpent.toFixed(2)}</td>
    `;
    tableBody.appendChild(row);
  });
}
