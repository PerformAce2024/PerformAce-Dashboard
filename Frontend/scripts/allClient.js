document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('Fetching client data...');
        const response = await fetch('http://localhost:8000/api/get-clients');
        const result = await response.json();

        if (result.success) {
            const clientList = result.data;
            const clientUl = document.getElementById('client-list');

            // Clear the list before appending new data
            clientUl.innerHTML = '';

            // Loop through client data and append it to the table
            for (const client of clientList) {
                const row = document.createElement('tr');

                // Dynamically set unique datepicker ID based on client ID
                const datepickerId = `datepicker-${client.id}`;

                // Client name, email, RO dropdown, campaign ID input box with dropdown, and date selection
                row.innerHTML = `
                    <td>${client.name}</td>
                    <td>${client.email}</td>
                    <td>
                        <select class="form-select roDropdown">
                            <option value="">Loading ROs...</option>
                        </select>
                    </td>
                    <td>
                        <div class="input-group">
                            <input list="campaignIdList-${client.id}" class="form-control campaignIdInput" placeholder="Enter Campaign ID">
                            <datalist id="campaignIdList-${client.id}">
                                <!-- Campaign IDs will be populated here -->
                            </datalist>
                        </div>
                    </td>
                    <td>
                        <input type="text" class="form-control date-range-input" id="${datepickerId}" placeholder="Select Date Range">
                    </td>
                    <td>
                        <button class="btn btn-primary submit-btn">Submit</button>
                    </td>
                `;
                clientUl.appendChild(row);

                // Fetch and populate the RO dropdown for each client
                const roDropdown = row.querySelector('.roDropdown');
                populateRODropdown(roDropdown);

                // Fetch and populate campaign IDs for each client
                const campaignIdList = row.querySelector(`#campaignIdList-${client.id}`);
                populateCampaignIds(client.id, campaignIdList);

                // Initialize date range picker for each client with unique ID
                initializeDateRangePicker(`#${datepickerId}`);

                // Add event listener for the submit button
                const submitButton = row.querySelector('.submit-btn');
                submitButton.addEventListener('click', async () => {
                    const selectedRO = roDropdown.value;
                    const campaignId = row.querySelector('.campaignIdInput').value;
                    const dateRange = row.querySelector(`#${datepickerId}`).value;

                    // Validate and submit campaign data
                    handleCampaignSubmission(row, selectedRO, campaignId, client.name, client.email, dateRange, submitButton);
                });
            }
        } else {
            console.error('Error fetching clients:', result.error);
        }
    } catch (error) {
        console.error('Error during client fetch:', error);
    }
});

// Function to populate RO dropdown with data from the server
async function populateRODropdown(dropdown) {
    try {
        const response = await fetch('http://localhost:8000/api/get-ros');
        const result = await response.json();

        if (result.success) {
            dropdown.innerHTML = '<option value="">Select RO</option>';
            result.data.forEach((ro) => {
                const option = document.createElement('option');
                option.value = ro.name || ro.client || ro.roNumber;
                option.textContent = ro.name || ro.client || ro.roNumber;
                dropdown.appendChild(option);
            });
        } else {
            console.error('Error fetching ROs:', result.error);
        }
    } catch (error) {
        console.error('Error loading ROs:', error);
    }
}

// Function to populate campaign IDs for each client in the datalist
async function populateCampaignIds(clientId, campaignIdList) {
    try {
        const response = await fetch(`http://localhost:8000/api/get-campaign-ids?clientId=${clientId}`);
        const result = await response.json();

        if (result.success && result.data.length > 0) {
            // Populate the datalist with campaign IDs
            campaignIdList.innerHTML = '';
            result.data.forEach(campaignId => {
                const option = document.createElement('option');
                option.value = campaignId;
                campaignIdList.appendChild(option);
            });
        } else {
            // No campaign IDs, leave the input as manual entry
            console.log(`No campaign IDs found for client ${clientId}`);
        }
    } catch (error) {
        console.error(`Error loading campaign IDs for client ${clientId}:`, error);
    }
}

// Function to initialize the date range picker with start and end date
function initializeDateRangePicker(datePickerSelector) {
    $(document).ready(function () {
        // Initialize the date range picker
        $('#daterange').daterangepicker({
            opens: 'left', // Calendar opens to the left
            startDate: moment().subtract(7, 'days'), // Default start date: 21 days ago
            endDate: moment(), // Default end date: today
            locale: {
                format: 'YYYY-MM-DD' // Date format
            },
            ranges: {
                'Today': [moment(), moment()], // Quick range for today
                'Last 7 Days': [moment().subtract(6, 'days'), moment()], // Last 7 days
                'Last 30 Days': [moment().subtract(29, 'days'), moment()], // Last 30 days
                'This Month': [moment().startOf('month'), moment().endOf('month')], // This month
                'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')] // Last month
            }
        }, function (start, end, label) {
            console.log("A new date range was chosen: " + start.format('YYYY-MM-DD') + ' to ' + end.format('YYYY-MM-DD'));
        });
    
        // Handle any further actions after date selection
        $('#daterange').on('apply.daterangepicker', function(ev, picker) {
            var startDate = picker.startDate.format('YYYY-MM-DD');
            var endDate = picker.endDate.format('YYYY-MM-DD');
            console.log("Date range selected: " + startDate + " to " + endDate);
        });
    });
}

// Function to handle the campaign submission logic
async function handleCampaignSubmission(row, selectedRO, campaignId, clientName, clientEmail, dateRange, submitButton) {
    // Remove previous error states
    row.querySelector('.roDropdown').classList.remove('is-invalid');
    row.querySelector('.campaignIdInput').classList.remove('is-invalid');
    row.querySelector('.date-range-input').classList.remove('is-invalid');

    let hasError = false;

    // Validate RO
    if (!selectedRO) {
        const roDropdown = row.querySelector('.roDropdown');
        roDropdown.classList.add('is-invalid');
        hasError = true;
    }

    // Validate Campaign ID
    if (!campaignId) {
        const campaignInput = row.querySelector('.campaignIdInput');
        campaignInput.classList.add('is-invalid');
        hasError = true;
    }

    // Validate Date Range
    if (!dateRange) {
        const dateInput = row.querySelector('.date-range-input');
        dateInput.classList.add('is-invalid');
        hasError = true;
    }

    // Submit if no errors
    if (!hasError) {
        try {
            // Extract start and end dates from the date range
            const [startDate, endDate] = dateRange.split(' - ');

            const response = await fetch('http://localhost:8000/api/submit-campaign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientName,
                    clientEmail,
                    roName: selectedRO,
                    campaignId,
                    startDate, // Submit start date
                    endDate    // Submit end date
                })
            });
            const result = await response.json();

            if (result.success) {
                submitButton.textContent = 'Saved';
                submitButton.classList.remove('btn-primary');
                submitButton.classList.add('btn-success');
            } else {
                console.error('Error submitting campaign data:', result.error);
            }
        } catch (error) {
            console.error('Error during campaign submission:', error);
        }
    }
}
