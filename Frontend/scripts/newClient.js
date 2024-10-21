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

    if (clientData.password !== clientData.confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    try {
        const response = await fetch('http://localhost:8000/api/create-client', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(clientData)
        });

        const result = await response.json();

        if (result.success) {
            const createButton = document.querySelector('.btn-create');
            createButton.textContent = 'Client created!';
            createButton.disabled = true;
        } else {
            console.error('Error creating client: ' + result.error);
        }
    } catch (error) {
        console.error('Error creating client:', error);
    }
});

// Function to dynamically populate the "List of ROs" dropdown with RO names
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('http://localhost:8000/api/get-ros', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();
        
        if (result.success) {
            const roDropdown = document.getElementById('roDropdown');
            roDropdown.innerHTML = '<option value="">Select RO</option>';

            // Add RO client names to dropdown
            result.data.forEach(ro => {
                const option = document.createElement('option');
                option.value = ro._id;  // You can still store the RO ID here if needed
                option.textContent = ro.client;  // Display the client name in the dropdown
                roDropdown.appendChild(option);
            });
        } else {
            console.error('Error fetching ROs:', result.error);
        }
    } catch (error) {
        console.error('Error:', error);
    }
});
