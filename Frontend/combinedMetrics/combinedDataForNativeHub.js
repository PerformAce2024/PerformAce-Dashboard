import config from "../helper/config.js";
import { fetchTaboolaDailyMetrics } from "../taboola/taboolaAdminMetricsFetcher.js";

/**
 * Main function to fetch campaign data for the NativeHub dashboard
 * Uses the selected RO from sessionStorage to fetch and display metrics
 */
export const fetchCampaignDataForNativeHub = async () => {
  try {
    const email = localStorage.getItem("userEmail");
    const selectedROElement = document.getElementById("ro-selector");
    const selectedROValue = selectedROElement.value;
    const selectedROText =
      selectedROElement.options[selectedROElement.selectedIndex].text.split(
        " - "
      )[0]; // Extract RO number from text
    const authToken = localStorage.getItem("authToken");

    if (!email || !selectedROValue) {
      console.error("Missing required data:", { email, selectedROValue });
      return;
    }

    // Fetch CPC (Cost Per Click) data for the selected RO
    const cpcResponse = await fetch(
      `${config.BASE_URL}/api/releaseOrders/cpc/${selectedROValue}`
    );
    if (!cpcResponse.ok) {
      throw new Error("Failed to fetch CPC");
    }
    const cpcData = await cpcResponse.json();
    const cpc = cpcData.cpc || 0;

    // Use the new campaign performance API endpoint with RO number from the text
    const campaignPerformanceUrl = `${config.BASE_URL}/api/metrics/campaigns/performance/${selectedROText}`;
    const campaignResponse = await fetch(campaignPerformanceUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });

    const performanceData = await campaignResponse.json();

    // Extract data from the performance results
    const campaignPerformances = performanceData.data.performances;

    // Use the most recent performance data
    const latestPerformance = campaignPerformances[0];

    const campaignId = latestPerformance.campaignId;
    await fetchTaboolaDailyMetrics(campaignId);
    const performanceResults =
      latestPerformance.campaignPerformanceResult.results || [];

    // Calculate total clicks from all results
    const totalClicks = performanceResults.reduce(
      (sum, result) => sum + (result.clicks || 0),
      0
    );
    const totalSpent = totalClicks * cpc;

    // Extract campaign date information
    const startDate = new Date(latestPerformance.startDate);
    const endDate = new Date(latestPerformance.endDate);
    const currentDate = new Date();

    // Calculate days left in the campaign
    let daysLeft = 0;
    if (startDate && endDate && currentDate) {
      if (currentDate < endDate) {
        daysLeft = Math.ceil(
          (endDate.getTime() - currentDate.getTime()) / (1000 * 3600 * 24)
        );
      } else if (currentDate.getTime() === endDate.getTime()) {
        daysLeft = Math.ceil(
          (currentDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)
        );
      } else {
        daysLeft = 0;
      }
    }

    // Update dashboard metrics with fetched data
    updateDashboardElements(totalClicks, totalSpent, daysLeft);
  } catch (error) {
    console.error("Error fetching campaign data for NativeHub:", error);
    setErrorState();
  }
};

// Helper function to update DOM elements
function updateDashboardElements(totalClicks, totalSpent, daysLeft) {
  const updateElement = (selector, value) => {
    const element = document.querySelector(selector);
    if (!element) {
      console.error(
        `Element with selector '${selector}' not found in the DOM.`
      );
    } else {
      element.textContent = value;
      // Remove any error or warning classes
      element.classList.remove("error-state", "warning-state");
    }
  };

  updateElement(".total-clicks", `${totalClicks}`);
  updateElement(".total-spent", `₹${totalSpent.toFixed(2)}`);
  updateElement(".days-left", `${daysLeft} days left`);
}

// Set error state for dashboard metrics
function setErrorState() {
  const updateErrorState = (selector) => {
    const element = document.querySelector(selector);
    if (element) {
      element.textContent = "Error loading data";
      element.classList.add("error-state");
      element.classList.remove("warning-state");
    }
  };

  updateErrorState(".total-clicks");
  updateErrorState(".total-spent");
  updateErrorState(".days-left");
}
/**
 * Fetches all Release Orders from the server and populates the dropdown
 */
async function fetchAndPopulateROs() {
  try {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      console.error("No auth token found in localStorage");
      alert("You are not authenticated. Please log in.");
      return;
    }
    const response = await fetch(`${config.BASE_URL}/api/admin/get-ros`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ROs: ${response.status}`);
    }

    const responseData = await response.json();
    // Extract the actual array of ROs from the response
    const rosData = responseData.data || [];
    console.log(rosData, "rosdata");

    // Get the dropdown element
    const roSelector = document.getElementById("ro-selector");

    // Clear existing options except the default one
    while (roSelector.options.length > 1) {
      roSelector.remove(1);
    }

    // Add each RO to the dropdown
    rosData.forEach((ro) => {
      const option = document.createElement("option");
      option.value = ro._id; // Use roNumber as the value
      option.textContent = `${ro.roNumber} - ${ro.ro_name || ""}`.trim(); // Display RO number and name
      roSelector.appendChild(option);
    });

    // If there's a previously selected RO in sessionStorage, select it
    const previouslySelectedRO = sessionStorage.getItem("selectedRO");
    if (previouslySelectedRO) {
      roSelector.value = previouslySelectedRO;
    }
  } catch (error) {
    console.error("Error fetching ROs:", error);
    // Add an error option to the dropdown
    const roSelector = document.getElementById("ro-selector");
    const errorOption = document.createElement("option");
    errorOption.value = "";
    errorOption.textContent = "Error loading ROs";
    errorOption.disabled = true;
    roSelector.appendChild(errorOption);
  }
}

/**
 * Sets warning state for dashboard metrics when no RO is selected
 */
function setWarningState() {
  const updateWarningState = (selector) => {
    const element = document.querySelector(selector);
    if (element) {
      element.textContent = "Please select an RO";
      element.classList.add("warning-state");
    }
  };

  updateWarningState(".total-clicks");
  updateWarningState(".total-spent");
  updateWarningState(".days-left");
}

/**
 * Initialize event handlers and setup
 */
function initializeNativeHubDashboard() {
  // Add change event listener to RO dropdown
  document
    .getElementById("ro-selector")
    .addEventListener("change", function () {
      const selectedRO = this.value;

      if (selectedRO) {
        // Store selected RO in sessionStorage
        sessionStorage.setItem("selectedRO", selectedRO);

        // Call the fetch campaign data function to update the dashboard
        fetchCampaignDataForNativeHub();
      } else {
        // Clear selectedRO from sessionStorage if default option is selected
        sessionStorage.removeItem("selectedRO");

        // Set warning state for dashboard metrics
        setWarningState();
      }
    });

  // Fetch ROs to populate dropdown
  fetchAndPopulateROs();

  // Check if a RO is already selected and update dashboard
  const selectedRO = sessionStorage.getItem("selectedRO");
  if (selectedRO) {
    fetchCampaignDataForNativeHub();
  } else {
    setWarningState();
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", initializeNativeHubDashboard);

// Expose to global scope for external access
window.fetchCampaignDataForNativeHub = fetchCampaignDataForNativeHub;
