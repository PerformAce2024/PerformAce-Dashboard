import { fetchCampaignDataTotal } from "../../combinedMetrics/combinedDataTotals.js";
import config from "../../helper/config.js";

async function fetchAndPopulateROs() {
  try {
    const userEmail = localStorage.getItem("userEmail");
    console.log("Fetching ROs for email:", userEmail);

    if (!userEmail) {
      console.error("No user email found in localStorage");
      return;
    }
    console.log(config.BASE_URL, "This is baseurl");

    const response = await fetch(
      `${config.BASE_URL}/api/client/ros/${encodeURIComponent(userEmail)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      }
    );

    const data = await response.json();
    console.log("Received RO data:", data);

    const roDropdown = document.getElementById("roDropdown");
    if (!roDropdown) {
      console.error("RO dropdown element not found");
      return;
    }

    // Clear existing options
    roDropdown.innerHTML = '<option value="">Select a RO</option>';

    if (data.success && Array.isArray(data.data) && data.data.length > 0) {
      data.data.forEach((ro) => {
        console.log(
          `Adding RO: ${ro.name} (ID: ${ro.id}) (Number: ${ro.roNumber})`
        );
        // Use ro.id as value and ro.name as display text
        const option = new Option(ro.name, ro.id);
        roDropdown.add(option);
      });

      // Get the first RO from the list or use saved RO
      const savedRO = sessionStorage.getItem("selectedRO");
      const defaultRO =
        savedRO && data.data.some((ro) => ro.id === savedRO)
          ? savedRO
          : data.data[0].id;

      if (defaultRO) {
        roDropdown.value = defaultRO;
        // Trigger change event to load data
        roDropdown.dispatchEvent(new Event("change"));
        // Save to session storage
        sessionStorage.setItem("selectedRO", defaultRO);
      }
    } else {
      // No ROs found
      const noDataOption = new Option("No ROs available", "");
      noDataOption.disabled = true;
      roDropdown.add(noDataOption);

      const errorDiv = document.getElementById("roError");
      if (errorDiv) {
        errorDiv.textContent = "No ROs found for your account";
        errorDiv.style.display = "block";
      }
    }
  } catch (error) {
    console.error("Error fetching ROs:", error);
    const errorDiv = document.getElementById("roError");
    if (errorDiv) {
      errorDiv.textContent = "Failed to load ROs: " + error.message;
      errorDiv.style.display = "block";
    }
  }
}
async function fetchAndDisplayClientName() {
  try {
    const userEmail = localStorage.getItem("userEmail");
    const authToken = localStorage.getItem("authToken");

    console.log("Attempting to fetch client name with:", {
      userEmail,
      authTokenExists: !!authToken,
    });

    const clientNameUrl = `${
      config.BASE_URL
    }/api/clientname/${encodeURIComponent(userEmail)}`;
    const response = await fetch(clientNameUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      credentials: "include",
    });

    const data = await response.json();
    console.log("API Response for the current is this:", data);

    // Get by ID instead of class
    const clientNameElement = document.getElementById("clientNameDisplay");
    if (data.success && clientNameElement) {
      clientNameElement.textContent = data.clientName;
      console.log("Updated client name to:", data.clientName);
    }
  } catch (error) {
    console.error("Failed to fetch client name:", error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded");
  fetchAndPopulateROs();

  const roDropdown = document.getElementById("roDropdown");
  if (roDropdown) {
    roDropdown.addEventListener("change", async (e) => {
      const selectedRO = e.target.value;
      const errorDiv = document.getElementById("roError");

      if (selectedRO === "") {
        if (errorDiv) errorDiv.style.display = "block";
        // Clear the session storage if no RO is selected
        sessionStorage.removeItem("selectedRO");
      } else {
        if (errorDiv) errorDiv.style.display = "none";
        console.log("Selected RO:", selectedRO);

        // Store the selected RO in session storage
        sessionStorage.setItem("selectedRO", selectedRO);

        // Call all API endpoints with selected RO
        await fetchAndDisplayClientName();
        await fetchCampaignDataTotal(selectedRO);
        // // await fetchStatePerformanceData(selectedRO);
        // await fetchTop7StatesData(selectedRO);
        // await fetchOSPerformanceData(selectedRO);
        // await fetchBrowserStatistics(selectedRO);
        // await fetchAndDisplayCampaignPerformance(selectedRO);
        // await fetchCampaignDataForNativeHub(selectedRO);
        // await fetchTop10SitesData(selectedRO);
        // await fetchSitePerformanceData(selectedRO); //w addition Ne
      }
    });
  }
});

window.addEventListener("load", fetchAndDisplayClientName);
document.addEventListener("DOMContentLoaded", fetchAndDisplayClientName);
