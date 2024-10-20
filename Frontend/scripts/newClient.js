// Function to handle client form submission
document.getElementById('clientForm').addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent the default form submission

    console.log('Client form submitted'); // Log when form is submitted

    const clientData = {
        name: document.getElementById('name').value,
        type: document.getElementById('type').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        contactPerson: document.getElementById('contactPerson').value,
        website: document.getElementById('website').value,
        brandLogoFilePath: document.getElementById('brandLogoFilePath').value,
        subdomain: document.getElementById('subdomain').value,
        address: document.getElementById('address').value,
        city: document.getElementById('city').value,
        state: document.getElementById('state').value,
        postcode: document.getElementById('postcode').value,
        country: document.getElementById('country').value,
    };

    console.log('Client Data to be sent:', clientData); // Log client data

    try {
        const response = await fetch('http://localhost:8000/api/create-clients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(clientData)
        });

        console.log('Response received:', response); // Log the raw response

        const result = await response.json();
        console.log('Response data:', result); // Log the response data

        if (result.success) {
            alert('Client created successfully');
            console.log('Client created successfully:', result.data); // Log success with data
            document.getElementById('clientForm').reset(); // Clear form after success
        } else {
            alert('Error creating client: ' + result.error);
            console.log('Error creating client:', result.error); // Log error
        }
    } catch (error) {
        console.error('Error during client creation:', error); // Log catch error
        alert('Error creating client: ' + error.message);
    }
});
