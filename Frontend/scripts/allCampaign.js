import config from "../helper/config.js";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      console.error("No auth token found in localStorage");
      alert("You are not authenticated. Please log in.");
      return;
    }

    // Fetch all data first
    const allData = await fetchCombinedData(authToken);
    if (!allData) return;

    // Get unique client names for the dropdown
    await populateClientDropdown(authToken);

    // Populate table with all data initially
    updateTable(allData);

    let currentFilters = {
      client: "all",
      platform: "all",
    };

    // Add event listener for client filter changes
    // Add event listener for client filter changes
    document
      .getElementById("clientFilter")
      .addEventListener("change", async (e) => {
        currentFilters.client = e.target.value;
        await applyFilters(authToken, currentFilters);
      });

    // Add event listener for platform filter changes
    document
      .getElementById("platformFilter")
      .addEventListener("change", async (e) => {
        currentFilters.platform = e.target.value;
        await applyFilters(authToken, currentFilters);
      });
  } catch (error) {
    console.error("Error in initializing dashboard:", error);
  }
});

async function applyFilters(authToken, filters) {
  try {
    let filteredData;

    if (filters.client === "all" && filters.platform === "all") {
      // No filters applied - get all data
      filteredData = await fetchCombinedData(authToken);
    } else if (filters.client !== "all" && filters.platform === "all") {
      // Only client filter
      filteredData = await fetchClientFilteredData(authToken, filters.client);
    } else if (filters.client === "all" && filters.platform !== "all") {
      // Only platform filter
      filteredData = await fetchPlatformData(authToken, filters.platform);
    } else {
      // Both filters
      filteredData = await fetchFilteredData(
        authToken,
        filters.client,
        filters.platform
      );
    }

    updateTable(filteredData);
  } catch (error) {
    console.error("Error applying filters:", error);
  }
}

async function fetchFilteredData(authToken, clientName, platform) {
  try {
    const apiUrl = `${
      config.BASE_URL
    }/api/filteredData?clientName=${encodeURIComponent(
      clientName
    )}&platform=${encodeURIComponent(platform)}`;
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
    console.log(
      `Filtered data for client ${clientName} and platform ${platform}:`,
      data
    );
    return data;
  } catch (error) {
    console.error("Error fetching filtered data:", error);
    throw error;
  }
}

async function fetchPlatformData(authToken, platform) {
  try {
    const apiUrl = `${
      config.BASE_URL
    }/api/platformData?platform=${encodeURIComponent(platform)}`;
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error fetching platform data: ${errorText}`);
      throw new Error(`Error fetching platform data: ${errorText}`);
    }

    const data = await response.json();

    console.log(`Data for platform ${platform}:`, data);
    return data;
  } catch (error) {
    console.error(`Error fetching platform data for ${platform}:`, error);
    throw error;
  }
}
async function fetchCombinedData(authToken) {
  try {
    const apiUrl = `${config.BASE_URL}/api/combinedData`;
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error fetching combined data: ${errorText}`);
      throw new Error(`Error fetching combined data: ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}

async function fetchClientFilteredData(authToken, clientName) {
  try {
    const apiUrl = `${
      config.BASE_URL
    }/api/combinedData?clientName=${encodeURIComponent(clientName)}`;
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
    return data;
  } catch (error) {
    console.error("Error fetching filtered data:", error);
    throw error;
  }
}

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
    // Extract clients from response.data
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
function updateTable(data) {
  const processedData = {
    dailyMetrics: [
      {
        clicks: data.totalClicks,
        impressions: data.totalImpressions,
        avgCpc: data.totalCPC,
        ctr: data.totalCTR * 100,
        amountSpent: data.totalSpent,
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
      <td>₹${metric.avgC == null ? 0 : metric.avgCpc.toFixed(2)}</td>
      <td>${metric.ctr.toFixed(2)}%</td>
      <td>₹${metric.amountSpent.toFixed(2)}</td>
    `;
    tableBody.appendChild(row);
  });
}
