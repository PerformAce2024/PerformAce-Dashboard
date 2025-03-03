import config from "../config.js";

const fetchCampaignDataForNativeHub = async () => {
  try {
    const email = localStorage.getItem("userEmail");
    const selectedRO = sessionStorage.getItem("selectedRO");
    const authToken = localStorage.getItem("authToken");

    if (!email || !selectedRO) {
      console.error("Missing required data:", { email, selectedRO });
      return;
    }

    const cpcResponse = await fetch(
      `https://backend-api.performacemedia.com:8000/api/releaseOrders/cpc/${selectedRO}`
    );
    if (!cpcResponse.ok) {
      throw new Error("Failed to fetch CPC");
    }
    const cpcData = await cpcResponse.json();
    const cpc = cpcData.cpc || 0;

    // const campaignRequestUrl = `https://backend-api.performacemedia.com:8000/api/metrics/native-hub?clientEmail=${email}&roNumber=${selectedRO}&startDate=&endDate=`;
    const campaignRequestUrl = `${config.BASE_URL}/api/metrics/native-hub?clientEmail=${email}&roNumber=${selectedRO}&startDate=&endDate=`;
    const campaignResponse = await fetch(campaignRequestUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      credentials: "include",
    });

    if (!campaignResponse.ok) {
      const errorText = await campaignResponse.text();
      throw new Error(`Error fetching campaign totals: ${errorText}`);
    }

    const data = await campaignResponse.json();
    const totalClicks = data.totalClicks;
    const totalSpent = totalClicks * cpc;

    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    const currentDate = new Date(data.currentDate);

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

    const updateElement = (selector, value) => {
      const element = document.querySelector(selector);
      if (!element) {
        console.error(
          `Element with selector '${selector}' not found in the DOM.`
        );
      } else {
        element.textContent = value;
      }
    };

    updateElement(".total-clicks", `${totalClicks}`);
    updateElement(".total-spent", `₹${totalSpent.toFixed(2)}`);
    updateElement(".days-left", `${daysLeft} days left`);
  } catch (error) {
    console.error("Error fetching campaign data for NativeHub:", error);

    const updateErrorState = (selector) => {
      const element = document.querySelector(selector);
      if (element) {
        element.textContent = "Error loading data";
        element.classList.add("error-state");
      }
    };

    updateErrorState(".total-clicks");
    updateErrorState(".total-spent");
    updateErrorState(".days-left");
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const selectedRO = sessionStorage.getItem("selectedRO");
  if (selectedRO) {
    fetchCampaignDataForNativeHub();
  } else {
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
});

window.fetchCampaignDataForNativeHub = fetchCampaignDataForNativeHub;
