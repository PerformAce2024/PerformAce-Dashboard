import config from "../config.js";

// Handle form submission for creating a new client
const roDropdown = document.getElementById("roDropdown");
const roSearch = document.getElementById("roSearch");
let ros = [];
const selectedLi = roDropdown.querySelector(`li[value="${roSearch.value}"]`);
document.addEventListener("DOMContentLoaded", function () {
  roDropdown.addEventListener("click", (e) => {
    if (e.target.tagName === "LI") {
      roSearch.value = e.target.textContent;
      roSearch.dataset.roId = e.target.getAttribute("value");
      roDropdown.innerHTML = "";
    }
  });

  document
    .getElementById("clientForm")
    .addEventListener("submit", async (event) => {
      event.preventDefault();

      // Collect client and auth data
      const clientData = {
        name: document.getElementById("name").value,
        phone: document.getElementById("phone").value,
        email: document.getElementById("email").value,
        password: document.getElementById("password").value,
        confirmPassword: document.getElementById("confirmPassword").value,
        roId: roSearch.dataset.roId,
        roName: roSearch.value, // Send RO Name
      };
      console.log(typeof clientData.roId);
      console.log(roSearch.dataset.roId);

      console.log(clientData);

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
        alert("Please fill in all required fields.");
        return;
      }

      try {
        const authToken = localStorage.getItem("authToken"); // Retrieve authToken from localStorage
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
  function handleResponse(result) {
    if (result.success) {
      const createButton = document.querySelector(".btn-create");
      createButton.textContent = "Created successfully!";
      createButton.disabled = true;
    } else {
      alert("Error: " + result.error);
    }
  }
  // const response = await fetch(
  //   "https://backend-api.performacemedia.com:8000/api/create-client",
  //   {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //       Authorization: `Bearer ${authToken}`,
  //     },
  //     body: JSON.stringify(clientData),
  //   }
  // );

  // const result = await response.json();

  // if (result.success) {
  //   console.log("Client created successfully:", result);
  //   const createButton = document.querySelector(".btn-create");
  //   createButton.textContent = "Client created!";
  //   createButton.disabled = true;
  // } else {
  //   console.error("Error creating client:", result.error);
  //   alert("Error creating client: " + result.error);
  // }
});
// Function to dynamically populate the "List of ROs" dropdown with RO names
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const authToken = localStorage.getItem("authToken"); // Retrieve authToken from localStorage
    if (!authToken) {
      console.error("No auth token found in localStorage");
      alert("You are not authenticated. Please log in.");
      return;
    }

    // const response = await fetch('https://backend-api.performacemedia.com:8000/api/get-ros', {
    //     method: 'GET',
    //     headers: {
    //         'Content-Type': 'application/json',
    //         'Authorization': `Bearer ${authToken}`
    //     }
    // });
    const response = await fetch(`${config.BASE_URL}/api/admin/get-ros`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });

    const result = await response.json();

    if (result.success) {
      const roDropdown = document.getElementById("roDropdown");
      ros = result.data;

      populateDropdown(ros);
      roSearch.addEventListener("input", () => {
        const searchTerm = roSearch.value.toLowerCase();
        const filteredRos = ros.filter((ro) =>
          ro.ro_name.toLowerCase().includes(searchTerm)
        );
        populateDropdown(filteredRos);
      });

      // Add click event to handle selection
      roDropdown.addEventListener("click", (e) => {
        if (e.target.tagName === "LI") {
          roSearch.value = e.target.textContent;
          roSearch.id = e.target.id;
          roDropdown.innerHTML = ""; // Clear dropdown after selection
        }
      });
      console.log(roSearch.id);
      console.log("RO dropdown populated successfully");
    } else {
      console.error("Error fetching ROs:", result.error);
      alert("Error fetching ROs: " + result.error);
    }
  } catch (error) {
    console.error("Error fetching ROs:", error);
    alert("An error occurred while fetching ROs. Please try again later.");
  }
  function populateDropdown(rosToShow) {
    roDropdown.innerHTML = ""; // Clear existing options
    rosToShow.forEach((ro) => {
      console.log(ro);

      const option = document.createElement("li");
      option.setAttribute("value", ro._id);
      option.textContent = ro.ro_name;
      roDropdown.appendChild(option);
    });
  }
});
