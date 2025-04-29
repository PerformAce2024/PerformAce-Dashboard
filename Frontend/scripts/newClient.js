import config from "../helper/config.js";

// Handle form submission for creating a new client

let ros = [];
let selectedRO = null;
document.addEventListener("DOMContentLoaded", function () {
  const roDropdown = document.getElementById("roDropdown");
  const roSearch = document.getElementById("roSearch");
  setupROSearchAndSelection(roDropdown, roSearch);

  loadAllROs();

  setupClientFormSubmission();
});
function setupROSearchAndSelection(roDropdown, roSearch) {
  // Handle RO search input
  roSearch.addEventListener("input", () => {
    const searchTerm = roSearch.value.toLowerCase();
    const filteredRos = ros.filter((ro) =>
      ro.ro_name.toLowerCase().includes(searchTerm)
    );
    populateDropdown(filteredRos, roDropdown);
  });

  // Handle RO selection from dropdown
  roDropdown.addEventListener("click", (e) => {
    if (e.target.tagName === "LI") {
      const roId = e.target.getAttribute("value");
      const roName = e.target.textContent;

      // Store selected RO data including soldBy array
      selectedRO = ros.find((ro) => ro._id === roId);

      // Update the visible field
      roSearch.value = roName;

      // Store RO ID in data attribute
      roSearch.dataset.roId = roId;

      // Clear dropdown after selection
      roDropdown.innerHTML = "";

      console.log("Selected RO:", selectedRO);
    }
  });
}
roDropdown.addEventListener("click", (e) => {
  if (e.target.tagName === "LI") {
    roSearch.value = e.target.textContent;
    roSearch.dataset.roId = e.target.getAttribute("value");
    roDropdown.innerHTML = "";
  }
});

async function loadAllROs() {
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

    const result = await response.json();

    if (result.success) {
      ros = result.data;
      const roDropdown = document.getElementById("roDropdown");
      populateDropdown(ros, roDropdown);
      console.log("ROs loaded successfully:", ros);
    } else {
      console.error("Error fetching ROs:", result.error);
      alert("Error fetching ROs: " + result.error);
    }
  } catch (error) {
    console.error("Error fetching ROs:", error);
    alert("An error occurred while fetching ROs. Please try again later.");
  }
}
function populateDropdown(rosToShow, roDropdown) {
  roDropdown.innerHTML = ""; // Clear existing options
  rosToShow.forEach((ro) => {
    const option = document.createElement("li");
    option.setAttribute("value", ro._id);
    option.textContent = ro.ro_name;
    roDropdown.appendChild(option);
  });
}

function setupClientFormSubmission() {
  document
    .getElementById("clientForm")
    .addEventListener("submit", async (event) => {
      event.preventDefault();

      // Check if RO is selected
      if (!selectedRO) {
        alert("Please select a Release Order (RO)");
        return;
      }

      // Collect client data
      const clientData = {
        name: document.getElementById("name").value,
        phone: document.getElementById("phone").value,
        email: document.getElementById("email").value,
        password: document.getElementById("password").value,
        confirmPassword: document.getElementById("confirmPassword").value,
        roId: selectedRO._id,
        roName: selectedRO.ro_name,
        soldBy: selectedRO.soldBy, // Include the soldBy array from the selected RO
      };

      console.log("Client data to submit:", clientData);

      // Password validation
      if (clientData.password !== clientData.confirmPassword) {
        alert("Passwords do not match");
        return;
      }

      // Check if all required fields are filled
      if (
        !clientData.name ||
        !clientData.phone ||
        !clientData.email ||
        !clientData.password ||
        !clientData.roId ||
        !clientData.roName
      ) {
        alert("Please fill in all required fields and select a valid RO.");
        return;
      }

      try {
        const authToken = localStorage.getItem("authToken");
        if (!authToken) {
          console.error("No auth token found in localStorage");
          alert("You are not authenticated. Please log in.");
          return;
        }

        let response = await fetch(`${config.BASE_URL}/api/create-client`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(clientData),
        });

        const result = await response.json();
        handleResponse(result);
      } catch (error) {
        console.error("Error creating client:", error);
        alert(
          "An error occurred while creating the client. Please try again later."
        );
      }
    });
}

function handleResponse(result) {
  if (result.success) {
    const createButton = document.querySelector(".btn-create");
    createButton.textContent = "Created successfully!";
    createButton.disabled = true;

    // Optional: Reset the form after successful creation
    document.getElementById("clientForm").reset();
    selectedRO = null;
  } else {
    alert("Error: " + result.error);
  }
}
