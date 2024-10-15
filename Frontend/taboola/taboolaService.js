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
        const startDate = new Date(data.startDate);  // Convert to Date object
        const endDate = new Date(data.endDate);      // Convert to Date object
        const todayDate = new Date(data.lastUsedRawDataUpdateTime);  // Convert to Date object

        // Extract the day from the dates
        const start = startDate.getUTCDate();
        console.log('Start Date: ', start);

        const end = endDate.getUTCDate();
        console.log('End Date: ', end);

        const current = todayDate.getUTCDate();
        console.log('Today: ', current);

        // Calculate the campaign percentage of delivery
        const campaignCovered = current - start;
        const totalDuration = end - start + 1;
        const campaignDelivered = (campaignCovered / totalDuration) * 100;

        console.log(`Campaign Delivery: ${campaignDelivered}%`);

        // Update the UI
        document.querySelector('.total-clicks').textContent = `${totalClicks}`;
        document.querySelector('.clicks-data').textContent = `${totalClicks} / 166000`;
        document.querySelector('.spent-data').textContent = `${totalSpent.toFixed(2)} / 300000`;
        document.querySelector('.impressions-data').textContent = `${totalImpressions} / 10000000`;
        document.querySelector('.ctr-data').textContent = `${averageCTR}% / 0.5%`;

        // Update progress bars (example for clicks)
        const maxClicks = 166000; // Set a target for the progress bar
        const clicksProgressPercentage = (totalClicks / maxClicks) * 100;
        document.querySelector('.progress-bar-clicks').style.width = `${clicksProgressPercentage}%`;

        // Update progress bars for other metrics (optional)
        const maxSpent = 300000; // Set a target for impressions (example)
        const spentProgressPercentage = (totalSpent / maxSpent) * 100;
        document.querySelector('.progress-bar-spent').style.width = `${spentProgressPercentage}%`;

        // Update progress bars for other metrics (optional)
        const maxImpressions = 10000000; // Set a target for impressions (example)
        const impressionsProgressPercentage = (totalImpressions / maxImpressions) * 100;
        document.querySelector('.progress-bar-impressions').style.width = `${impressionsProgressPercentage}%`;

        // Update progress bars for other metrics (optional)
        const maxCTR = 0.5; // Set a target for impressions (example)
        const ctrProgressPercentage = (averageCTR / maxCTR) * 100;
        document.querySelector('.progress-bar-ctr').style.width = `${ctrProgressPercentage}%`;

        // Function to update the pie chart with new percentage
        const updatePieChart = (campaignDelivered) => {
            // Update the text content dynamically
            document.querySelector('.js-percent').textContent = `${Math.round(campaignDelivered)}%`;

            // Update the 'data-percent' attribute dynamically
            const pieChartElement = document.querySelector('.js-easy-pie-chart');
            pieChartElement.setAttribute('data-percent', Math.round(campaignDelivered));

            // update the chart
            $(pieChartElement).data('easyPieChart').update(Math.round(campaignDelivered));
        };

        // Call this function after calculating the campaignDelivered value
        updatePieChart(campaignDelivered);

        // Pass the clicks data to the line chart function
        renderLineChart(data.clicksData); // Pass clicksData for line chart

    } catch (error) {
        console.error('Error fetching campaign data:', error);
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

// Fetch the campaign data and render the chart when the page loads
window.onload = fetchCampaignData;
