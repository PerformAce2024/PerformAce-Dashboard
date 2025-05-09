import config from "../helper/config.js";

// Make submitCampaign available globally
window.submitCampaign = async function (clientId, clientName, clientEmail) {
  const platform = document.getElementById(
    `platformDropdown-${clientId}`
  ).value;
  const roNumber = document.getElementById(`roDropdown-${clientId}`).value;
  const campaignId = document.getElementById(`campaignId-${clientId}`).value;
  const dateRange = document.getElementById(`datepicker-${clientId}`).value;

  console.log(`Submitting campaign for client ID ${clientId}`, {
    clientName,
    clientEmail,
    platform,
    roNumber,
    campaignId,
    dateRange,
  }); // Debugging log

  try {
    const submitResponse = await fetch(
      `${config.BASE_URL}/api/submit-campaign`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName,
          clientEmail,
          platform,
          roNumber,
          campaignId,
          dateRange,
        }),
      }
    );

    const submitResult = await submitResponse.json();

    if (submitResult.success) {
      alert("Campaign submitted successfully!");
    } else {
      console.error("Failed to submit campaign:", submitResult);
      alert("Failed to submit campaign!");
    }
  } catch (error) {
    console.error("Error during campaign submission:", error);
    alert("Failed to submit campaign due to network or server error.");
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  const clientListContainer = document.getElementById("client-list");

  try {
    const authToken = localStorage.getItem("authToken"); // Retrieve authToken from localStorage
    if (!authToken) {
      console.error("No auth token found in localStorage");
      alert("You are not authenticated. Please log in.");
      return;
    }

    console.log("Fetching client data with authorization...");
    const clientsResponse = await fetch(`${config.BASE_URL}/api/get-clients`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`, // Include the token in the Authorization header
      },
    });

    const clientsResult = await clientsResponse.json();

    if (clientsResult.success) {
      console.log("Successfully fetched clients:", clientsResult.data); // Debug log for client data
      clientsResult.data.forEach((client, index) => {
        // Ensure `client.id` is defined, otherwise use index as a fallback
        const clientId = client._id || `fallback-${index}`;
        console.log(`Setting up client with ID: ${clientId}`); // Debug log for client ID

        const clientRow = document.createElement("tr");
        clientRow.innerHTML = `
                    <td>${client.name}</td>
                    <td>${client.email}</td>
                    <td>
                        <select id="platformDropdown-${clientId}" class="form-select">
                            <option value="" disabled selected>Select Platform</option>
                            <option value="mgid">MGID</option>
                            <option value="outbrain">Outbrain</option>
                            <option value="dspoutbrain">Dsp Outbrain</option>
                            <option value="taboola">Taboola</option>
                        </select>
                    </td>
                    <td>
                        <select id="roDropdown-${clientId}" class="form-select"> 
                            <option value="" disabled selected>Select RO</option>
                        </select>
                    </td>
                    <td>
                        <input type="text" id="campaignId-${clientId}" class="form-control">
                    </td>
                    <td>
                        <input type="text" id="datepicker-${clientId}" class="form-control">
                    </td>
                    <td>
                        <button class="btn btn-primary" onclick="submitCampaign('${clientId}', '${client.name}', '${client.email}')">Submit</button>
                    </td>
                `;
        clientListContainer.appendChild(clientRow);

        // Setup the dropdown and date picker for each client
        setupRODropdown(clientId);
        setupDateRangePicker(clientId);
      });
    } else {
      console.error("Error fetching clients:", clientsResult.error);
    }
  } catch (error) {
    console.error("Error fetching client data:", error);
  }
});

async function setupRODropdown(clientId) {
  const dropdown = document.getElementById(`roDropdown-${clientId}`);
  console.log(clientId, "This is the clientId");
  if (!dropdown) {
    console.error(`Dropdown element not found for client ID: ${clientId}`);
    return;
  }

  const authToken = localStorage.getItem("authToken");
  if (!authToken) {
    console.error("No auth token found");
    alert("You are not authenticated. Please log in.");
    return;
  }

  try {
    console.log(`Fetching ROs for client ID: ${clientId}`); // Debugging log

    const roResponse = await fetch(
      `${config.BASE_URL}/api/client/${clientId}/ros`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const roResult = await roResponse.json();

    if (roResult.success) {
      dropdown.innerHTML = ""; // Clear the dropdown before populating it
      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "Select RO";
      defaultOption.disabled = true;
      defaultOption.selected = true;
      dropdown.appendChild(defaultOption);

      // Check if there are ROs available for this client
      if (roResult.data && roResult.data.length > 0) {
        roResult.data.forEach((ro) => {
          const option = document.createElement("option");
          option.value = ro.roNumber || ro._id;
          option.textContent = ro.ro_name;
          dropdown.appendChild(option);
        });
        console.log(
          `RO dropdown populated with ${roResult.data.length} ROs for client ID: ${clientId}`
        );
      } else {
        console.log(`No ROs found for client ID: ${clientId}`);
        const noROsOption = document.createElement("option");
        noROsOption.value = "";
        noROsOption.textContent = "No ROs available";
        noROsOption.disabled = true;
        dropdown.appendChild(noROsOption);
      }
    } else {
      console.error(
        `Error fetching ROs for client ID ${clientId}:`,
        roResult.error
      );
    }
  } catch (error) {
    console.error(`Error loading ROs for client ID ${clientId}:`, error);
  }
}

function setupDateRangePicker(clientId) {
  $(`#datepicker-${clientId}`).daterangepicker({
    locale: { format: "YYYY-MM-DD" },
    startDate: moment().subtract(29, "days"),
    endDate: moment(),
    ranges: {
      Today: [moment(), moment()],
      "Last 30 Days": [moment().subtract(29, "days"), moment()],
      "This Month": [moment().startOf("month"), moment().endOf("month")],
      "Last Month": [
        moment().subtract(1, "month").startOf("month"),
        moment().subtract(1, "month").endOf("month"),
      ],
    },
  });
}
