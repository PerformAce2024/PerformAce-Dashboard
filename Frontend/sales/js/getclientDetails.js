import { fetchCampaignDataTotal } from "../../combinedMetrics/combinedDataTotals.js";
import config from "../../helper/config.js";
import { getroDetails } from "./getroDetails.js";

// this will receive sales person id and get the clients associated with that sales person and populate the client dropdown
export const getclientDetails = async (sales_id) => {
  try {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      console.error("No auth token found");
      return;
    }

    const response = await fetch(
      `${config.BASE_URL}/sales/sales-clients?sales_id=${encodeURIComponent(
        sales_id
      )}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    const result = await response.json();

    populateClientDropdown(result.clients);
    return result;
  } catch (error) {
    console.error("Error fetching sales:", error.message);
  }
};

const populateClientDropdown = async (clients) => {
  try {
    if (!clients || clients.length === 0) {
      console.log("No clients found");
      return;
    }
    const clientDropdown = document.getElementById("clientDropdown");
    while (clientDropdown.options.length > 1) {
      clientDropdown.remove(1);
    }
    clients.forEach((client) => {
      const option = document.createElement("option");
      option.value = client._id;
      option.textContent = client.name;
      clientDropdown.appendChild(option);
    });

    clientDropdown.addEventListener("change", async function () {
      const selectedClientId = this.value;
      const selectedClient = clients.find(
        (client) => client._id === selectedClientId
      );

      if (selectedClientId && selectedClient) {
        localStorage.setItem("selectedClientEmail", selectedClient.email);
        await populateRODropdown(selectedClientId);
      } else {
        // Clear RO dropdown if no client is selected
        const roDropdown = document.getElementById("roDropdown");
        while (roDropdown.options.length > 1) {
          roDropdown.remove(1);
        }
        document.getElementById("roError").style.display = "none";

        localStorage.removeItem("selectedClientEmail");
      }
    });
  } catch (error) {
    console.error("Error populating client dropdown:", error);
  }
};

export const populateRODropdown = async (client_id) => {
  try {
    const data = await getroDetails(client_id);
    const ros = data.ros;

    if (!ros || ros.length === 0) {
      console.log("No ROs found for the selected client");
      return;
    }

    const roDropdown = document.getElementById("roDropdown");

    // Clear existing options except the first one
    while (roDropdown.options.length > 1) {
      roDropdown.remove(1);
    }

    // Add RO options
    ros.forEach((ro) => {
      const option = document.createElement("option");
      option.value = ro.roId;
      option.textContent = ro.roName;
      roDropdown.appendChild(option);
    });

    roDropdown.addEventListener("change", function () {
      const selectedRoId = this.value;

      if (selectedRoId) {
        // Save the selected RO ID to sessionStorage
        sessionStorage.setItem("selectedRO", selectedRoId);
      } else {
        // If no RO is selected, remove from sessionStorage
        sessionStorage.removeItem("selectedRO");
        console.log("No RO selected, removed from sessionStorage");
      }
    });
  } catch (error) {
    console.error("Error populating RO dropdown:", error);
  }
};
