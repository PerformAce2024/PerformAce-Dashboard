document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('Fetching client data...');
        const response = await fetch('http://localhost:8000/api/get-clients');
        console.log('Response:', response);

        const result = await response.json();
        console.log('Fetched client data:', result);

        if (result.success) {
            const clientList = result.data;
            const clientUl = document.getElementById('client-list'); // Correct ID

            // Clear the list before appending new data
            clientUl.innerHTML = '';

            // Loop through client data and append it to the list
            clientList.forEach((client) => {
                const li = document.createElement('li');
                li.innerHTML = `Name: ${client.name}, Email: ${client.email}`;
                clientUl.appendChild(li);
            });
        } else {
            console.error('Error fetching clients:', result.error);
            alert('Error fetching clients: ' + result.error);
        }
    } catch (error) {
        console.error('Error during client fetch:', error);
        alert('Error fetching clients: ' + error.message);
    }
});
