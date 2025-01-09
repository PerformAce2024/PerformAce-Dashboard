document.addEventListener('DOMContentLoaded', function () {
    const createROBtn = document.querySelector('.create-btn');
    const checkboxes = document.querySelectorAll('.form-check-input');
    const formFields = document.querySelectorAll('#roForm input, #roForm select');

    // Function to get selected services
    function getSelectedServices() {
        return Array.from(checkboxes)
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.value);
    }

    if (createROBtn) {
        createROBtn.addEventListener('click', async (event) => {
            event.preventDefault(); // Prevent default form submission

            // Collect form data
            const roData = {
                client: document.getElementById('client').value,
                targetClicks: document.getElementById('targetClicks').value,
                budget: document.getElementById('budget').value,
                cpc: document.getElementById('cpc').value,
                cpm: document.getElementById('cpm').value,
                soldBy: document.getElementById('soldBy').value,
                saleDate: document.getElementById('saleDate').value,
                roNumber: document.getElementById('roNumber').value,
                service: getSelectedServices() // Get selected services and add to roData
            };

            // Validate form data
            if (!roData.client || !roData.targetClicks || !roData.budget || !roData.roNumber) {
                alert('Please fill in all required fields.');
                console.warn('RO creation failed: Required fields are missing.');
                return;
            }

            console.log('Creating RO with data:', roData);

            try {
                const authToken = localStorage.getItem('authToken');  // Retrieve authToken from localStorage
                if (!authToken) {
                    console.error('No auth token found in localStorage');
                    alert('You are not authenticated. Please log in.');
                    return;
                }

                console.log('Auth token:', authToken);  // Log the token for debugging

                const response = await fetch('https://backend-api.performacemedia.com:8000/api/create-ro', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify(roData)
                });

                const result = await response.json();

                if (result.success) {
                    console.log('RO created successfully:', result);
                    // Change the "Create" button text and color on success
                    createROBtn.textContent = 'RO Created!';
                    createROBtn.classList.remove('btn-dark');
                    createROBtn.classList.add('btn-success');
                    createROBtn.disabled = true; // Disable the button to prevent further clicks
                } else {
                    console.error('Error creating RO:', result.error);
                    alert('Error creating RO: ' + result.error);
                }
            } catch (error) {
                console.error('Error during RO creation:', error);
                alert('An error occurred while creating the RO. Please try again later.');
            }
        });
    } else {
        console.error('Create button not found.');
    }
});