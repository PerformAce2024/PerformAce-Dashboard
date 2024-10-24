document.addEventListener('DOMContentLoaded', async () => {
    const clientListContainer = document.getElementById('client-list');
    const clientsResponse = await fetch('http://localhost:8000/api/get-clients');
    const clientsResult = await clientsResponse.json();

    if (clientsResult.success) {
        clientsResult.data.forEach(client => {
            const clientRow = document.createElement('li');
            clientRow.innerHTML = `
                <div>Name: ${client.name}</div>
                <div>Email: ${client.email}</div>
                <select id="roDropdown-${client.id}"></select>
                <input list="campaignIds-${client.id}">
                <datalist id="campaignIds-${client.id}"></datalist>
                <input type="text" id="dateRange-${client.id}">
                <button onclick="submitCampaign('${client.id}')">Submit</button>
            `;
            clientListContainer.appendChild(clientRow);

            setupRODropdown(client.id);
            setupCampaignIds(client.id);
            setupDateRangePicker(client.id);
        });
    }
});

async function setupRODropdown(clientId) {
    const dropdown = document.getElementById(`roDropdown-${clientId}`);
    const roResponse = await fetch('http://localhost:8000/api/get-ros');
    const roResult = await roResponse.json();

    if (roResult.success) {
        roResult.data.forEach(ro => {
            const option = document.createElement('option');
            option.value = ro.id;
            option.textContent = ro.name;
            dropdown.appendChild(option);
        });
    }
}

async function setupCampaignIds(clientId) {
    const datalist = document.getElementById(`campaignIds-${clientId}`);
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
    $(`#dateRange-${clientId}`).daterangepicker({
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
    const campaignId = document.querySelector(`#campaignIds-${clientId} input`).value;
    const dateRange = document.getElementById(`dateRange-${clientId}`).value;

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
