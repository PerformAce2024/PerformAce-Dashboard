document.addEventListener('DOMContentLoaded', function () {
    const createROBtn = document.querySelector('.create-btn');
    const formFields = document.querySelectorAll('#roForm input, #roForm select'); // Get all form fields
    let createClientBtn;

    // Function to check if all form fields are filled
    function checkFormFilled() {
        return Array.from(formFields).every(input => input.value.trim() !== '');
    }

    // Add event listeners to all form fields for validation
    formFields.forEach(field => {
        field.addEventListener('input', () => {
            if (checkFormFilled()) {
                createROBtn.disabled = false; // Enable button if all fields are filled
            } else {
                createROBtn.disabled = true;  // Disable button if any field is empty
            }
        });
    });

    if (createROBtn) {
        createROBtn.addEventListener('click', async (event) => {
            event.preventDefault(); // Prevent default form submission

            // Collect form data
            const roData = {
                client: document.getElementById('client').value,
                description: document.getElementById('description').value,
                targetClicks: document.getElementById('targetClicks').value,
                budget: document.getElementById('budget').value,
                cpc: document.getElementById('cpc').value,
                cpm: document.getElementById('cpm').value,
                soldBy: document.getElementById('soldBy').value,
                saleDate: document.getElementById('saleDate').value,
                roNumber: document.getElementById('roNumber').value
            };

            try {
                const response = await fetch('http://localhost:8000/api/create-ro', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(roData)
                });

                const result = await response.json();

                if (result.success) {
                    // Change the "Create" button text and color on success
                    createROBtn.textContent = 'RO Created!';
                    createROBtn.classList.remove('btn-dark');
                    createROBtn.classList.add('btn-success');
                    createROBtn.disabled = true; // Disable the button to prevent further clicks
                }
            } catch (error) {
                console.error('Error during RO creation:', error);
            }
        });
    } else {
        console.error('Create button not found.');
    }
});
