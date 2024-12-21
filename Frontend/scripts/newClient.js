// Handle form submission for creating a new client
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('clientForm').addEventListener('submit', async (event) => {
        event.preventDefault();

        const roDropdown = document.getElementById('roDropdown');

        // Collect client and auth data
        const clientData = {
            name: document.getElementById('name').value,
            phone: document.getElementById('phone').value,
            role: document.getElementById('role').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
            confirmPassword: document.getElementById('confirmPassword').value,
            roId: roDropdown.value,  // Send RO ID
            roName: roDropdown.options[roDropdown.selectedIndex].text,  // Send RO Name
        };

        // Password validation
        if (clientData.password !== clientData.confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        // Check if all required fields are filled
        if (!clientData.name || !clientData.phone || !clientData.role || !clientData.email || !clientData.password || !clientData.roId || !clientData.roName) {
            alert('Please fill in all required fields.');
            return;
        }

        console.log('Submitting new client data:', clientData);

        try {
            const authToken = localStorage.getItem('authToken');  // Retrieve authToken from localStorage
            if (!authToken) {
                console.error('No auth token found in localStorage');
                alert('You are not authenticated. Please log in.');
                return;
            }

            console.log('Auth token:', authToken);  // Log the token for debugging

            const response = await fetch('http://15.207.100.193:8000/api/create-client', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(clientData)
            });

            const result = await response.json();

            if (result.success) {
                console.log('Client created successfully:', result);
                const createButton = document.querySelector('.btn-create');
                createButton.textContent = 'Client created!';
                createButton.disabled = true;
            } else {
                console.error('Error creating client:', result.error);
                alert('Error creating client: ' + result.error);
            }
        } catch (error) {
            console.error('Error creating client:', error);
            alert('An error occurred while creating the client. Please try again later.');
        }
    });
});

// Function to dynamically populate the "List of ROs" dropdown with RO names
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const authToken = localStorage.getItem('authToken');  // Retrieve authToken from localStorage
        if (!authToken) {
            console.error('No auth token found in localStorage');
            alert('You are not authenticated. Please log in.');
            return;
        }

        console.log('Auth token:', authToken);  // Log the token for debugging

        console.log('Fetching list of ROs...');
        const response = await fetch('http://15.207.100.193:8000/api/get-ros', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        });

        const result = await response.json();

        if (result.success) {
            const roDropdown = document.getElementById('roDropdown');
            roDropdown.innerHTML = '<option value="">Select RO</option>';

            // Add RO client names to the dropdown
            result.data.forEach(ro => {
                const option = document.createElement('option');
                option.value = ro._id;  // You can still store the RO ID here if needed
                option.textContent = ro.client;  // Display the client name in the dropdown
                roDropdown.appendChild(option);
            });

            console.log('RO dropdown populated successfully');
        } else {
            console.error('Error fetching ROs:', result.error);
            alert('Error fetching ROs: ' + result.error);
        }
    } catch (error) {
        console.error('Error fetching ROs:', error);
        alert('An error occurred while fetching ROs. Please try again later.');
    }
});
