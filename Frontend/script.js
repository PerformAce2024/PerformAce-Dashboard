const fetchCampaignData = async () => {
    try {

        const campaignRequestUrl = 'http://localhost:8000/api/taboola/getCampaignDetails';
        const campaignResponse = await fetch(campaignRequestUrl, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });

        if (!campaignResponse.ok) {
            const errorText = await campaignResponse.text();
            throw new Error(`Error generating creatives: ${errorText}`);
        }

        const data = await campaignResponse.json();
        const results = data[0].campaignPerformanceResult.results;

        // Calculate total clicks
        const totalClicks = results.reduce((sum, result) => sum + result.clicks, 0);
        console.log('Total Clicks are: ', totalClicks);
        const maxClicks = 10000; // Set a target for the progress bar (adjust as needed)
        const progressPercentage = (totalClicks / maxClicks) * 100;
        console.log('Progress % is: ', progressPercentage);

        // Update clicks in the UI
        document.querySelector('.clicks-data').textContent = `${totalClicks} / ${maxClicks}`;
        document.querySelector('.progress-bar-clicks').style.width = `${progressPercentage}%`;
    } catch (error) {
        console.error('Error fetching data:', error);
    }
};

window.onload = fetchCampaignData;