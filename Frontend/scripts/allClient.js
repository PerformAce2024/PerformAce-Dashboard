document.addEventListener('DOMContentLoaded', async () => {
    const clientListContainer = document.getElementById('client-list');

    try {
        const authToken = localStorage.getItem('authToken');  // Retrieve authToken from localStorage
        if (!authToken) {
            console.error('No auth token found in localStorage');
            alert('You are not authenticated. Please log in.');
            return;
        }

        console.log('Auth token:', authToken);  // Log the token for debugging

        console.log('Fetching client data with authorization...');
        const clientsResponse = await fetch('http://localhost:8000/api/get-clients', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`  // Include the token in the Authorization header
            }
        });

        const clientsResult = await clientsResponse.json();

        if (clientsResult.success) {
            clientsResult.data.forEach(client => {
                const clientRow = document.createElement('tr');
                clientRow.innerHTML = `
                    <td>${client.name}</td>
                    <td>${client.email}</td>
                    <td>
                        <select id="roDropdown-${client.id}"> 
                            <option value="" disabled selected>Select RO</option>
                        </select>
                    </td>
                    <td>
                        <input list="campaignIds-${client.id}" class="form-control">
                        <datalist id="campaignIds-${client.id}"></datalist>
                    </td>
                    <td>
                        <input type="text" id="dateRange-${client.id}" class="form-control">
                    </td>
                    <td>
                        <button class="btn btn-primary" onclick="submitCampaign('${client.id}')">Submit</button>
                    </td>
                `;
                clientListContainer.appendChild(clientRow);

                setupRODropdown(client.id);
                setupCampaignIds(client.id);
                setupDateRangePicker(client.id);
            });
        } else {
            console.error('Error fetching clients:', clientsResult.error);
        }
    } catch (error) {
        console.error('Error fetching client data:', error);
    }
});

async function setupRODropdown(clientId) {
    const dropdown = document.getElementById(`roDropdown-${clientId}`);

    // Retrieve the auth token from localStorage
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        console.error('No auth token found');
        alert('You are not authenticated. Please log in.');
        return;  // Exit if no auth token is present
    }

    try {
        console.log('Fetching ROs for client ID:', clientId);  // Debugging log

        const roResponse = await fetch('http://localhost:8000/api/get-ros', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,  // Include the token in the Authorization header
                'Content-Type': 'application/json'
            }
        });

        const roResult = await roResponse.json();
        console.log('RO API response:', roResult);  // Debugging log

        if (roResult.success) {
            dropdown.innerHTML = ''; // Clear the dropdown before populating it

            // Add a default "Select RO" option at the top
            const defaultOption = document.createElement('option');
            defaultOption.value = ''; // No value for the default option
            defaultOption.textContent = 'Select RO';
            defaultOption.disabled = true;
            defaultOption.selected = true;
            dropdown.appendChild(defaultOption); // Append the default option

            // Loop through the RO data and append each as an option in the dropdown
            roResult.data.forEach(ro => {
                const option = document.createElement('option');
                option.value = ro.id;
                option.textContent = ro.client;  // Use ro.name or ro.roNumber based on your data
                dropdown.appendChild(option);
            });

            console.log('RO dropdown populated successfully for client ID:', clientId);
        } else {
            console.error('Error fetching ROs:', roResult.error);
        }
    } catch (error) {
        console.error('Error loading ROs:', error);
    }
}

async function setupCampaignIds(clientId) {
    const datalist = document.getElementById(`campaignIdList-${clientId}`);
    const campaignsResponse = await fetch(`http://localhost:8000/api/get-campaign-ids?clientId=${clientId}`);
    const campaignsResult = await campaignsResponse.json();

    if (campaignsResult.success) {
        campaignsResult.data.forEach(campaignId => {
            const option = document.createElement('option');
            option.value = campaignId;
            datalist.appendChild(option);
        });
    }
}

function setupDateRangePicker(clientId) {
    $(`#datepicker-${clientId}`).daterangepicker({
        locale: { format: 'YYYY-MM-DD' },
        startDate: moment().subtract(29, 'days'),
        endDate: moment(),
        ranges: {
            'Today': [moment(), moment()],
            'Last 30 Days': [moment().subtract(29, 'days'), moment()],
            'This Month': [moment().startOf('month'), moment().endOf('month')],
            'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
        }
    });
}

async function submitCampaign(clientId) {
    const roId = document.getElementById(`roDropdown-${clientId}`).value;
    const campaignId = document.querySelector(`#campaignIdList-${clientId} input`).value;
    const dateRange = document.getElementById(`datepicker-${clientId}`).value;

    const submitResponse = await fetch('http://localhost:8000/api/submit-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, roId, campaignId, dateRange })
    });
    const submitResult = await submitResponse.json();

    if (submitResult.success) {
        alert('Campaign submitted successfully!');
    } else {
        alert('Failed to submit campaign!');
    }
}
