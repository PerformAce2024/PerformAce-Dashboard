// Fetch campaign data
const fetchCampaignDataAggregates = async () => {
    try {
        const campaignId = "42564178"; // Example campaignId
        const campaignRequestUrl = `http://localhost:8000/api/taboola/getCampaignAggregates/${campaignId}`;

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

        // Calculate totalClicks by summing the clicks from top3ClicksData
        const totalClicks = data.top3ClicksData.reduce((acc, item) => acc + item.clicks, 0);

        if (totalClicks === 0) {
            console.error('Total clicks are zero or undefined');
        }

        // Extract top 3 states + "Other" aggregated data
        const clicksData = data.top3ClicksData;
        console.log('Clicks Data:', clicksData);

        // Update each pie chart with its respective clicks data and state name
        updatePieChart(clicksData[0].clicks, totalClicks, document.querySelector('.js-easy-pie-chart-1'), clicksData[0].state, '.js-state-name-1');
        updatePieChart(clicksData[1].clicks, totalClicks, document.querySelector('.js-easy-pie-chart-2'), clicksData[1].state, '.js-state-name-2');
        updatePieChart(clicksData[2].clicks, totalClicks, document.querySelector('.js-easy-pie-chart-3'), clicksData[2].state, '.js-state-name-3');
        updatePieChart(clicksData[3].clicks, totalClicks, document.querySelector('.js-easy-pie-chart-4'), 'Other States', '.js-state-name-4');
    } catch (error) {
        console.error('Error fetching campaign data:', error);
    }
};

// Update the pie chart dynamically
const updatePieChart = (clicks, totalClicks, pieChartElement, stateName, stateNameSelector) => {
    // Handle edge case if totalClicks is 0 to prevent division by zero
    const clicksReceived = totalClicks > 0 ? (clicks / totalClicks) * 100 : 0;

    // Ensure clicksReceived is a valid number
    if (isNaN(clicksReceived)) {
        console.error('Clicks received is not a valid number:', clicksReceived);
    }

    // Update the chart text and label
    if (pieChartElement && pieChartElement.querySelector('.js-percent')) {
        pieChartElement.querySelector('.js-percent').textContent = `${Math.round(clicksReceived)}%`;
    }

    // Update the state name
    const stateNameElement = document.querySelector(stateNameSelector);
    if (stateNameElement) {
        stateNameElement.textContent = stateName;
    }

    // Update the 'data-percent' attribute dynamically
    pieChartElement.setAttribute('data-percent', Math.round(clicksReceived));

    // Initialize the pie chart (do not call update immediately after initialization)
    if (!$(pieChartElement).data('easyPieChart')) {
        $(pieChartElement).easyPieChart({
            animate: 2000,
            size: 50,
            lineWidth: 5,
            barColor: '#f00'
        });
    } else {
        // If already initialized, update the chart
        $(pieChartElement).data('easyPieChart').update(Math.round(clicksReceived));
    }
};
