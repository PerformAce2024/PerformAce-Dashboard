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
            
            // Set the dropdown value to the previously selected RO if it exists
            const savedRO = sessionStorage.getItem('selectedRO');
            if (savedRO && data.data.includes(savedRO)) {
                roDropdown.value = savedRO;
                // Trigger change event to load data
                roDropdown.dispatchEvent(new Event('change'));
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
                await fetchCampaignDataTotal(selectedRO);
                await fetchStatePerformanceData(selectedRO);
                await fetchTop7StatesData(selectedRO);
                await fetchOSPerformanceData(selectedRO);
                await fetchBrowserStatistics(selectedRO);
                await fetchAndDisplayCampaignPerformance(selectedRO);
                await fetchCampaignDataForNativeHub(selectedRO);
            }
        });
    }
});