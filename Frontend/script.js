const fetchCampaignData = async () => {
    try {
        const campaignId = "42564178"; // Example campaignId
        const campaignRequestUrl = `http://localhost:8000/api/taboola/getCampaignTotals/${campaignId}`;

        const campaignResponse = await fetch(campaignRequestUrl, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });

        if (!campaignResponse.ok) {
            const errorText = await campaignResponse.text();
            throw new Error(`Error fetching campaign totals: ${errorText}`);
        }

        const data = await campaignResponse.json();
        console.log('Campaign Data:', data);

        // Extract the metrics from the response
        const totalClicks = data.totalClicks;
        const totalImpressions = data.totalImpressions;
        const totalSpent = data.totalSpent;
        const averageCTR = data.averageCTR;

        // Update the UI
        document.querySelector('.total-clicks').textContent = `${totalClicks}`;
        document.querySelector('.clicks-data').textContent = `${totalClicks}`;
        document.querySelector('.impressions-data').textContent = `${totalImpressions}`;
        document.querySelector('.spent-data').textContent = `${totalSpent.toFixed(2)}`;
        document.querySelector('.ctr-data').textContent = `${averageCTR}%`;

        // Update progress bars (example for clicks)
        const maxClicks = 10000; // Set a target for the progress bar
        const clicksProgressPercentage = (totalClicks / maxClicks) * 100;
        document.querySelector('.progress-bar-clicks').style.width = `${clicksProgressPercentage}%`;

        // Update progress bars for other metrics (optional)
        const maxImpressions = 1000000; // Set a target for impressions (example)
        const impressionsProgressPercentage = (totalImpressions / maxImpressions) * 100;
        document.querySelector('.progress-bar-impressions').style.width = `${impressionsProgressPercentage}%`;

    } catch (error) {
        console.error('Error fetching campaign data:', error);
    }
};

window.onload = fetchCampaignData;
