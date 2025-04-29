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
    const soldByContainer = document.getElementById("soldByContainer");

    if (result.sales && result.sales.length) {
      result.sales.forEach((sale) => {
        const { name, sales_id } = sale;
        // Create a div for each checkbox
        const checkboxDiv = document.createElement("div");
        checkboxDiv.className = "form-check";

        // Create the checkbox input
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "form-check-input sales-checkbox";
        checkbox.id = `soldBy-${sales_id}`;
        checkbox.value = sales_id;

        // Create the label for the checkbox
        const label = document.createElement("label");
        label.className = "form-check-label";
        label.htmlFor = `soldBy-${sales_id}`;
        label.textContent = name;

        // Append checkbox and label to the div
        checkboxDiv.appendChild(checkbox);
        checkboxDiv.appendChild(label);

        // Append the div to the container
        soldByContainer.appendChild(checkboxDiv);
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

  function getSelectedSalespeople() {
    return Array.from(document.querySelectorAll(".sales-checkbox"))
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
    document.querySelectorAll(".sales-checkbox").forEach((checkbox) => {
      checkbox.checked = false;
    });
  }

  if (createROBtn) {
    createROBtn.addEventListener("click", async (event) => {
      event.preventDefault(); // Prevent default form submission
      const selectedSalespeople = getSelectedSalespeople();
      // Collect form data
      const roData = {
        ro_name: document.getElementById("ro_name").value,
        targetClicks: document.getElementById("targetClicks").value,
        budget: document.getElementById("budget").value,
        cpc: document.getElementById("cpc").value,
        cpm: document.getElementById("cpm").value,
        soldBy: selectedSalespeople,
        saleDate: document.getElementById("saleDate").value,
        roNumber: document.getElementById("roNumber").value,
        service: getSelectedServices(), // Get selected services and add to roData
      };

      // Validate form data
      if (
        !roData.ro_name ||
        !roData.targetClicks ||
        !roData.budget ||
        !roData.roNumber ||
        roData.soldBy.length === 0
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
        const response = await fetch(`${config.BASE_URL}/api/admin/create-ro`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(roData),
        });

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
