// Function to handle RO form submission
document.getElementById('roForm').addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent the default form submission

    console.log('RO form submitted'); // Log when form is submitted

    const roData = {
        client: document.getElementById('client').value,
        description: document.getElementById('description').value,
        targetClicks: document.getElementById('targetClicks').value,
        budget: document.getElementById('budget').value,
        cpc: document.getElementById('cpc').value,
        cpm: document.getElementById('cpm').value,
        soldBy: document.getElementById('soldBy').value,
        saleDate: document.getElementById('saleDate').value,
        contactName: document.getElementById('contactName').value,
        contactEmail: document.getElementById('contactEmail').value,
        contactPhone: document.getElementById('contactPhone').value,
        roNumber: document.getElementById('roNumber').value,
    };

    console.log('RO Data to be sent:', roData); // Log RO data

    try {
        const response = await fetch('http://localhost:8000/api/create-ro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(roData)
        });

        console.log('Response received:', response); // Log the raw response

        const result = await response.json();
        console.log('Response data:', result); // Log the response data

        if (result.success) {
            alert('RO created successfully');
            console.log('RO created successfully:', result.data); // Log success with data
            document.getElementById('roForm').reset(); // Clear form after success
        } else {
            alert('Error creating RO: ' + result.error);
            console.log('Error creating RO:', result.error); // Log error
        }
    } catch (error) {
        console.error('Error during RO creation:', error); // Log catch error
        alert('Error creating RO: ' + error.message);
    }
});
