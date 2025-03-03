// Handle form submission for creating a new Sales

import config from "../config.js";

document.addEventListener("DOMContentLoaded", function () {
  document
    .getElementById("clientForm")
    .addEventListener("submit", async (event) => {
      event.preventDefault();

      // Collect client and auth data
      const salesData = {
        name: document.getElementById("name").value,
        phone: document.getElementById("phone").value,
        email: document.getElementById("email").value,
        password: document.getElementById("password").value,
        confirmPassword: document.getElementById("confirmPassword").value,
      };
      // Password validation
      if (salesData.password !== salesData.confirmPassword) {
        alert("Passwords do not match");
        return;
      }

      // Check if all required fields are filled
      if (
        !salesData.name ||
        !salesData.phone ||
        !salesData.email ||
        !salesData.password
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

        let response = await fetch(`${config.BASE_URL}/sales/create-sales`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(salesData),
        });

        const result = await response.json();

        handleResponse(result);
      } catch (error) {
        console.error("Error creating sales:", error);
        alert(
          "An error occurred while creating the sales. Please try again later."
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
});
