// Function to handle client form submission
document.getElementById('clientForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const clientData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        roId: document.getElementById('roDropdown').value,  // The selected RO ID
        address: document.getElementById('address').value,
        city: document.getElementById('city').value,
        state: document.getElementById('state').value,
        postcode: document.getElementById('postcode').value,
        country: document.getElementById('country').value,
    };

    try {
        const response = await fetch('http://localhost:8000/api/create-client', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(clientData)
        });

        const result = await response.json();

        if (result.success) {
            alert('Client created successfully, email added to the RO.');
            document.getElementById('clientForm').reset();
        } else {
            alert('Error creating client: ' + result.error);
        }
    } catch (error) {
        console.error('Error creating client:', error);
        alert('Error creating client: ' + error.message);
    }
});

// Function to dynamically populate the "List of ROs" dropdown with RO ids and names from DB
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Fetch all the ROs from the server
        const response = await fetch('http://localhost:8000/api/get-ros', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();
        
        if (result.success) {
            const roDropdown = document.getElementById('roDropdown');
            // Clear the dropdown before adding new options
            roDropdown.innerHTML = '<option value="">Select RO</option>';

            // Loop through the ROs and add them to the dropdown
            result.data.forEach(ro => {
                const option = document.createElement('option');
                option.value = ro._id;  // Set the value to roId (the unique id of the RO)
                option.textContent = ro.client;  // Display the client name
                roDropdown.appendChild(option);
            });
        } else {
            console.error('Error fetching ROs:', result.error);
            alert('Error fetching ROs: ' + result.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error loading ROs: ' + error.message);
    }
});
