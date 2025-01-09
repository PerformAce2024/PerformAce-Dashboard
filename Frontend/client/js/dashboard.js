async function fetchAndPopulateROs() {
    try {
        const userEmail = localStorage.getItem('userEmail');
        console.log('Fetching ROs for:', userEmail);

        if (!userEmail) {
            console.error('No user email found');
            return;
        }

        const response = await fetch(`http://localhost:8000/api/client/ros/${userEmail}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            credentials: 'include'
        });

        const data = await response.json();
        console.log('Received data:', data);

        const roDropdown = document.getElementById('roDropdown');
        if (!roDropdown) {
            console.error('Dropdown element not found');
            return;
        }

        roDropdown.innerHTML = '<option value="">List of ROs</option>';

        if (data.success && Array.isArray(data.data)) {
            data.data.forEach(roNumber => {
                console.log('Adding RO:', roNumber);
                const option = new Option(roNumber, roNumber);
                roDropdown.add(option);
            });
            
            // Get the first RO from the list or use saved RO
            const savedRO = sessionStorage.getItem('selectedRO');
            const defaultRO = savedRO && data.data.includes(savedRO) 
                ? savedRO 
                : data.data[0];
            
            if (defaultRO) {
                roDropdown.value = defaultRO;
                // Trigger change event to load data
                roDropdown.dispatchEvent(new Event('change'));
                // Save to session storage
                sessionStorage.setItem('selectedRO', defaultRO);
            }
        }
    } catch (error) {
        console.error('Error fetching ROs:', error);
        const errorDiv = document.getElementById('roError');
        if (errorDiv) {
            errorDiv.textContent = 'Failed to load ROs';
            errorDiv.style.display = 'block';
        }
    }
}

async function fetchAndDisplayClientName() {
    try {
        
        const userEmail = localStorage.getItem('userEmail');
        const authToken = localStorage.getItem('authToken');
        
        console.log('Attempting to fetch client name with:', { userEmail, authTokenExists: !!authToken });

        const clientNameUrl = `http://localhost:8000/api/clientname/${encodeURIComponent(userEmail)}`;
        const response = await fetch(clientNameUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            credentials: 'include'
        });
        
        const data = await response.json();
        console.log('API Response:', data);

        // Get by ID instead of class
        const clientNameElement = document.getElementById('clientNameDisplay');
        if (data.success && clientNameElement) {
            clientNameElement.textContent = data.clientName;
            console.log('Updated client name to:', data.clientName);
        }
    } catch (error) {
        console.error('Failed to fetch client name:', error);
    }
}


document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded');
    fetchAndPopulateROs();

    const roDropdown = document.getElementById('roDropdown');
    if (roDropdown) {
        roDropdown.addEventListener('change', async (e) => {
            const selectedRO = e.target.value;
            const errorDiv = document.getElementById('roError');

            if (selectedRO === '') {
                if (errorDiv) errorDiv.style.display = 'block';
                // Clear the session storage if no RO is selected
                sessionStorage.removeItem('selectedRO');
            } else {
                if (errorDiv) errorDiv.style.display = 'none';
                console.log('Selected RO:', selectedRO);
                
                // Store the selected RO in session storage
                sessionStorage.setItem('selectedRO', selectedRO);
                
                // Call all API endpoints with selected RO
                await fetchAndDisplayClientName();
                await fetchCampaignDataTotal(selectedRO);
                await fetchStatePerformanceData(selectedRO);
                await fetchTop7StatesData(selectedRO);
                await fetchOSPerformanceData(selectedRO);
                await fetchBrowserStatistics(selectedRO);
                await fetchAndDisplayCampaignPerformance(selectedRO);
                await fetchCampaignDataForNativeHub(selectedRO);
                await fetchTop10SitesData(selectedRO)
                await fetchSitePerformanceData(selectedRO) // New addition
                

            }
        });
    }
});

window.addEventListener('load', fetchAndDisplayClientName);
document.addEventListener('DOMContentLoaded', fetchAndDisplayClientName);