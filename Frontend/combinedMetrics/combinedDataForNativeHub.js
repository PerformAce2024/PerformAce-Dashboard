// Frontend/combinedMetrics/combinedDataForNativeHub.js

const fetchCampaignDataForNativeHub = async () => {
    try {
        // Get stored values
        const email = localStorage.getItem('userEmail');
        const selectedRO = sessionStorage.getItem('selectedRO');
        const authToken = localStorage.getItem('authToken');

        console.log("Fetching campaign data for NativeHub...", {
            email,
            roNumber: selectedRO
        });

        if (!email || !selectedRO) {
            console.error('Missing required data:', { email, selectedRO });
            return;
        }

        // Construct the API URL with query parameters
        const campaignRequestUrl = `http://backend-api.performacemedia.int:8000/api/metrics/native-hub?clientEmail=${email}&roNumber=${selectedRO}&startDate=&endDate=`;

        console.log(`Requesting campaign data from: ${campaignRequestUrl}`);

        const campaignResponse = await fetch(campaignRequestUrl, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${authToken}`
            },
            credentials: 'include'
        });

        console.log('Campaign response status:', campaignResponse.status);

        if (!campaignResponse.ok) {
            const errorText = await campaignResponse.text();
            console.error(`Error fetching campaign totals: ${errorText}`);
            throw new Error(`Error fetching campaign totals: ${errorText}`);
        }

        const data = await campaignResponse.json();
        console.log('Parsed campaign data:', data);

        // Extract metrics from the response
        const totalSpent = data.totalSpent;
        const totalClicks = data.totalClicks;
        console.log(`Total Spent: ₹${totalSpent}, Total Clicks: ${totalClicks}`);

        // Extract dates
        const startDate = new Date(data.startDate);
        const endDate = new Date(data.endDate);
        const currentDate = new Date(data.currentDate);

        console.log(`Start Date: ${startDate}, End Date: ${endDate}, Current Date: ${currentDate}`);

        // Calculate days left if dates are available
        let daysLeft = 0;
        if (endDate && currentDate) {
            const timeDiff = endDate.getTime() - currentDate.getTime();
            daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
            console.log(`Days Left: ${daysLeft}`);
        }

        // Helper function to safely update DOM elements
        const updateElement = (selector, value) => {
            const element = document.querySelector(selector);
            if (!element) {
                console.error(`Element with selector '${selector}' not found in the DOM.`);
            } else {
                element.textContent = value;
                console.log(`${selector} updated.`);
            }
        };

        // Update UI elements
        updateElement('.total-clicks', `${totalClicks}`);
        updateElement('.total-spent', `₹${totalSpent.toFixed(2)}`);
        
        // Only update days left if the element exists and we have valid dates
        if (daysLeft) {
            updateElement('.days-left', `${daysLeft} days left`);
        }

    } catch (error) {
        console.error('Error fetching campaign data for NativeHub:', error);
        
        // Update UI to show error state
        const updateErrorState = (selector) => {
            const element = document.querySelector(selector);
            if (element) {
                element.textContent = 'Error loading data';
                element.classList.add('error-state');
            }
        };

        updateErrorState('.total-clicks');
        updateErrorState('.total-spent');
        updateErrorState('.days-left');
    }
};

// Initialize when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('NativeHub page loaded, checking for RO...');
    
    // Check if we have a selected RO
    const selectedRO = sessionStorage.getItem('selectedRO');
    if (selectedRO) {
        console.log('Found selected RO, fetching data...');
        fetchCampaignDataForNativeHub();
    } else {
        console.warn('No RO selected. Please select an RO from the dashboard first.');
        
        // Update UI to show warning state
        const updateWarningState = (selector) => {
            const element = document.querySelector(selector);
            if (element) {
                element.textContent = 'Please select an RO';
                element.classList.add('warning-state');
            }
        };

        updateWarningState('.total-clicks');
        updateWarningState('.total-spent');
        updateWarningState('.days-left');
    }
});

// Export for use in other modules if needed
window.fetchCampaignDataForNativeHub = fetchCampaignDataForNativeHub;