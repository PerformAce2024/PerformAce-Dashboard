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
