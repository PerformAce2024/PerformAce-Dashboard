const fetchCampaignDataTotal = async () => {
    try {
        console.log("Starting to fetch total campaign data...");
        const campaignId = "42938360"; // Example campaignId
        const campaignRequestUrl = `http://localhost:8000/api/combined/getCampaignTotals/${campaignId}`;

        console.log(`Requesting campaign totals from URL: ${campaignRequestUrl}`);
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
        console.log('Total Campaign Data:', data);

        // Extract the metrics from the response
        const totalClicks = data.totalClicks;
        const totalImpressions = data.totalImpressions;
        const totalSpent = data.totalSpent;
        const averageCTR = data.averageCTR;

        console.log(`Total Clicks: ${totalClicks}, Total Impressions: ${totalImpressions}, Total Spent: ₹${totalSpent}, CTR: ${averageCTR}%`);

        // Check and update the UI elements only if they exist
        const clicksElement = document.querySelector('.total-clicks');
        if (clicksElement) {
            clicksElement.textContent = `${totalClicks}`;
            console.log("Updated total clicks:", totalClicks);
        } else {
            console.warn("Element with class '.total-clicks' not found.");
        }

        const clicksDataElement = document.querySelector('.clicks-data');
        if (clicksDataElement) {
            clicksDataElement.textContent = `${totalClicks} / 166000`;
            console.log("Updated clicks data:", `${totalClicks} / 166000`);
        } else {
            console.warn("Element with class '.clicks-data' not found.");
        }

        const spentDataElement = document.querySelector('.spent-data');
        if (spentDataElement) {
            spentDataElement.textContent = `₹${totalSpent.toFixed(2)} / 300000`;
            console.log("Updated spent data:", `₹${totalSpent.toFixed(2)} / 300000`);
        } else {
            console.warn("Element with class '.spent-data' not found.");
        }

        const impressionsDataElement = document.querySelector('.impressions-data');
        if (impressionsDataElement) {
            impressionsDataElement.textContent = `${totalImpressions} / 10000000`;
            console.log("Updated impressions data:", `${totalImpressions} / 10000000`);
        } else {
            console.warn("Element with class '.impressions-data' not found.");
        }

        const ctrDataElement = document.querySelector('.ctr-data');
        if (ctrDataElement) {
            ctrDataElement.textContent = `${averageCTR}% / 0.5%`;
            console.log("Updated CTR data:", `${averageCTR}% / 0.5%`);
        } else {
            console.warn("Element with class '.ctr-data' not found.");
        }

        // Update progress bars for each metric if applicable
        const maxClicks = 166000;
        const clicksProgressPercentage = (totalClicks / maxClicks) * 100;
        const clicksProgressBar = document.querySelector('.progress-bar-clicks');
        if (clicksProgressBar) {
            clicksProgressBar.style.width = `${clicksProgressPercentage}%`;
            console.log("Updated clicks progress bar width:", `${clicksProgressPercentage}%`);
        } else {
            console.warn("Element with class '.progress-bar-clicks' not found.");
        }

        const maxSpent = 300000;
        const spentProgressPercentage = (totalSpent / maxSpent) * 100;
        const spentProgressBar = document.querySelector('.progress-bar-spent');
        if (spentProgressBar) {
            spentProgressBar.style.width = `${spentProgressPercentage}%`;
            console.log("Updated spent progress bar width:", `${spentProgressPercentage}%`);
        } else {
            console.warn("Element with class '.progress-bar-spent' not found.");
        }

        const maxImpressions = 10000000;
        const impressionsProgressPercentage = (totalImpressions / maxImpressions) * 100;
        const impressionsProgressBar = document.querySelector('.progress-bar-impressions');
        if (impressionsProgressBar) {
            impressionsProgressBar.style.width = `${impressionsProgressPercentage}%`;
            console.log("Updated impressions progress bar width:", `${impressionsProgressPercentage}%`);
        } else {
            console.warn("Element with class '.progress-bar-impressions' not found.");
        }

        const maxCTR = 0.5;
        const ctrProgressPercentage = (averageCTR / maxCTR) * 100;
        const ctrProgressBar = document.querySelector('.progress-bar-ctr');
        if (ctrProgressBar) {
            ctrProgressBar.style.width = `${ctrProgressPercentage}%`;
            console.log("Updated CTR progress bar width:", `${ctrProgressPercentage}%`);
        } else {
            console.warn("Element with class '.progress-bar-ctr' not found.");
        }

        // Pass the clicks data to the line chart function
        renderLineChart(data.clicksData); // Pass clicksData for line chart
    } catch (error) {
        console.error('Error fetching total campaign data:', error);
    }
};

// Function to render the line chart
const renderLineChart = (clicksData) => {
    const formattedClicksData = clicksData.map(item => [new Date(item.date).getTime(), item.clicks]);

    const options = {
        colors: ['#0dcaf0'],
        series: {
            lines: {
                show: true,
                lineWidth: 2,
                fill: 0.1
            }
        },
        points: {
            show: true
        },
        grid: {
            borderColor: 'rgba(0,0,0,0.05)',
            borderWidth: 1,
            labelMargin: 5
        },
        xaxis: {
            mode: 'time',
            timeformat: "%b %d", // Format date as needed
            color: '#F0F0F0',
            tickColor: 'rgba(0,0,0,0.05)',
            font: {
                size: 10,
                color: '#999'
            }
        },
        yaxis: {
            min: 0,
            color: '#F0F0F0',
            tickColor: 'rgba(0,0,0,0.05)',
            font: {
                size: 10,
                color: '#999'
            }
        }
    };

    // Use the data to plot the chart
    const plot = $.plot($("#updating-chart"), [{ data: formattedClicksData }], options);
};

fetchCampaignDataTotal();