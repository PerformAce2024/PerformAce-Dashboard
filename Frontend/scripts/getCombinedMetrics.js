const fetchCombinedCampaignData = async (campaignId) => {
    try {
        const apiUrl = `https://backend-api.performacemedia.com:8000/api/getCombinedMetrics/${campaignId}`;
        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`Failed to fetch combined campaign data: ${response.statusText}`);
        }

        const combinedData = await response.json();
        console.log('Combined Campaign Data:', combinedData);

        // Now use `combinedData` to update the UI elements as you currently do with separate data
        updateMetricsUI(combinedData);
    } catch (error) {
        console.error('Error fetching combined campaign data:', error);
    }
};

// Call this function with the campaign ID when needed
fetchCombinedCampaignData('42564178');
