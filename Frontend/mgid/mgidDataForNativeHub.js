const fetchCampaignDataForNativeHub = async () => {
    try {
        console.log("Fetching campaign data for NativeHub...");
        const campaignId = "11924952"; // Example campaignId
        const campaignRequestUrl = `https://backend-api.performacemedia.com:8000/api/mgid/getCampaignDetailsNativeHub/${campaignId}`;

        console.log(`Requesting campaign data from: ${campaignRequestUrl}`);

        const campaignResponse = await fetch(campaignRequestUrl, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });

        console.log('Campaign response status:', campaignResponse.status);

        if (!campaignResponse.ok) {
            const errorText = await campaignResponse.text();
            console.error(`Error fetching campaign totals: ${errorText}`);
            throw new Error(`Error fetching campaign totals: ${errorText}`);
        }

        const data = await campaignResponse.json();
        console.log('Parsed campaign data:', data);

        // Extract the metrics from the response
        const totalSpent = data.totalSpent;
        const totalClicks = data.totalClicks;
        console.log(`Total Spent: ₹${totalSpent}, Total Clicks: ${totalClicks}`);

        // Extract the startDate, endDate, and currentDate
        const startDate = new Date(data.startDate);
        const endDate = new Date(data.endDate);
        const currentDate = new Date(data.currentDate); // Today's date from backend

        console.log(`Start Date: ${startDate}, End Date: ${endDate}, Current Date: ${currentDate}`);

        // Calculate the number of days left
        const timeDiff = endDate.getTime() - currentDate.getTime();
        const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24)); // Days remaining till campaign ends
        console.log(`Days Left: ${daysLeft}`);

        // Update the UI with the fetched data
        console.log('Updating the UI with fetched data...');
        const clicksElement = document.querySelector('.total-clicks');
        const spentElement = document.querySelector('.total-spent');
        const daysLeftElement = document.querySelector('.days-left');

        if (!clicksElement) {
            console.error("Element with class '.total-clicks' not found in the DOM.");
        } else {
            clicksElement.textContent = `${totalClicks}`;
            console.log('Clicks updated.');
        }

        if (!spentElement) {
            console.error("Element with class '.total-spent' not found in the DOM.");
        } else {
            spentElement.textContent = `₹${totalSpent.toFixed(2)}`;
            console.log('Cost updated.');
        }

        if (!daysLeftElement) {
            console.error("Element with class '.days-left' not found in the DOM.");
        } else {
            daysLeftElement.textContent = `${daysLeft} days left`;
            console.log('Days left updated.');
        }
    } catch (error) {
        console.error('Error fetching campaign data for NativeHub:', error);
    }
};

fetchCampaignDataForNativeHub();