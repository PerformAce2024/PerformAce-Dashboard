import config from "../helper/config.js";

document.addEventListener("DOMContentLoaded", async function () {
  const createROBtn = document.querySelector(".create-btn");
  const checkboxes = document.querySelectorAll(".form-check-input");
  const formFields = document.querySelectorAll("#roForm input, #roForm select");
  try {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      console.error("No auth token found");
      return;
    }

    const response = await fetch(`${config.BASE_URL}/sales/get-sales`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });

    const result = await response.json();
    console.log(result);

    const soldBySelect = document.getElementById("soldBy");

    if (result.sales && result.sales.length) {
      result.sales.forEach((name, index) => {
        const option = document.createElement("option");
        option.value = index;
        option.textContent = name;
        soldBySelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error("Error fetching sales:", error);
  }
  // Function to get selected services
  function getSelectedServices() {
    return Array.from(checkboxes)
      .filter((checkbox) => checkbox.checked)
      .map((checkbox) => checkbox.value);
  }

  function clearFormFields() {
    formFields.forEach((field) => {
      if (field.type === "checkbox") {
        field.checked = false;
      } else {
        field.value = "";
      }
    });
  }

  if (createROBtn) {
    createROBtn.addEventListener("click", async (event) => {
      event.preventDefault(); // Prevent default form submission

      // Collect form data
      const roData = {
        ro_name: document.getElementById("ro_name").value,
        targetClicks: document.getElementById("targetClicks").value,
        budget: document.getElementById("budget").value,
        cpc: document.getElementById("cpc").value,
        cpm: document.getElementById("cpm").value,
        soldBy: document.getElementById("soldBy").value,
        saleDate: document.getElementById("saleDate").value,
        roNumber: document.getElementById("roNumber").value,
        service: getSelectedServices(), // Get selected services and add to roData
      };

      // Validate form data
      if (
        !roData.ro_name ||
        !roData.targetClicks ||
        !roData.budget ||
        !roData.roNumber
      ) {
        alert("Please fill in all required fields.");
        console.warn("RO creation failed: Required fields are missing.");
        return;
      }

      console.log("Creating RO with data:", roData);

      try {
        const authToken = localStorage.getItem("authToken"); // Retrieve authToken from localStorage
        if (!authToken) {
          console.error("No auth token found in localStorage");
          alert("You are not authenticated. Please log in.");
          return;
        }

        createROBtn.textContent = "Creating RO...";
        createROBtn.classList.add("btn-warning");
        createROBtn.disabled = true;
        const response = await fetch(
          // "https://backend-api.performacemedia.com:8000/api/create-ro",
          `${config.BASE_URL}/api/admin/create-ro`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify(roData),
          }
        );

        const result = await response.json();

        if (result.success) {
          console.log("RO created successfully:", result);
          // Change the "Create" button text and color on success
          createROBtn.textContent = "RO Created!";
          createROBtn.classList.remove("btn-dark");
          createROBtn.classList.add("btn-success");
          createROBtn.disabled = true; // Disable the button to prevent further clicks

          clearFormFields();
        } else {
          console.error("Error creating RO:", result.error);
          alert("Error creating RO: " + result.error);
          createROBtn.textContent = "Create RO";
          createROBtn.classList.remove("btn-warning");
          createROBtn.disabled = false;
        }
      } catch (error) {
        console.error("Error during RO creation:", error);
        alert(
          "An error occurred while creating the RO. Please try again later."
        );
        createROBtn.textContent = "Create RO";
        createROBtn.classList.remove("btn-warning");
        createROBtn.disabled = false;
      }
    });
  } else {
    console.error("Create button not found.");
  }
});
