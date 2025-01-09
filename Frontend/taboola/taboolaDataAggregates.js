const fetchCampaignDataAggregates = async () => {
    try {
        console.log("Fetching campaign aggregates...");
        const campaignId = "42938360"; // Example campaignId
        const campaignRequestUrl = `https://backend-api.performacemedia.com:8000/api/taboola/getCampaignAggregates/${campaignId}`;

        console.log(`Requesting campaign aggregates from URL: ${campaignRequestUrl}`);
        const campaignResponse = await fetch(campaignRequestUrl, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });

        console.log('Campaign response status:', campaignResponse.status);

        if (!campaignResponse.ok) {
            const errorText = await campaignResponse.text();
            console.error(`Error fetching campaign aggregates: ${errorText}`);
            throw new Error(`Error fetching campaign aggregates: ${errorText}`);
        }

        const data = await campaignResponse.json();
        console.log('Campaign Aggregates Data:', data);

        // Calculate totalClicks by summing the clicks from top3ClicksData
        const totalClicks = data.top3ClicksData.reduce((acc, item) => acc + item.clicks, 0);
        console.log('Total Clicks from Aggregates:', totalClicks);

        if (totalClicks === 0) {
            console.warn('Total clicks are zero or undefined.');
        }

        // Extract top 3 states + "Other" aggregated data
        const clicksData = data.top3ClicksData;
        console.log('Top 3 States Clicks Data:', clicksData);

        // Update each pie chart with respective clicks data and state name
        updatePieChart(clicksData[0].clicks, totalClicks, document.querySelector('.js-easy-pie-chart-1'), clicksData[0].state, '.js-state-name-1');
        updatePieChart(clicksData[1].clicks, totalClicks, document.querySelector('.js-easy-pie-chart-2'), clicksData[1].state, '.js-state-name-2');
        updatePieChart(clicksData[2].clicks, totalClicks, document.querySelector('.js-easy-pie-chart-3'), clicksData[2].state, '.js-state-name-3');
        updatePieChart(clicksData[3].clicks, totalClicks, document.querySelector('.js-easy-pie-chart-4'), 'Other States', '.js-state-name-4');
    } catch (error) {
        console.error('Error fetching campaign data aggregates:', error);
    }
};

// Update the pie chart dynamically
const updatePieChart = (clicks, totalClicks, pieChartElement, stateName, stateNameSelector) => {
    console.log(`Updating pie chart for state: ${stateName} with clicks: ${clicks}`);

    // Calculate percentage clicks received
    const clicksReceived = totalClicks > 0 ? (clicks / totalClicks) * 100 : 0;

    // Log if clicksReceived is not a valid number
    if (isNaN(clicksReceived)) {
        console.error('Clicks received is not a valid number:', clicksReceived);
        return;
    }

    // Check if pieChartElement exists before setting attributes
    if (pieChartElement) {
        pieChartElement.setAttribute('data-percent', Math.round(clicksReceived));
        const percentElement = pieChartElement.querySelector('.js-percent');
        if (percentElement) {
            percentElement.textContent = `${Math.round(clicksReceived)}%`;
            console.log(`Updated pie chart percentage for ${stateName}: ${Math.round(clicksReceived)}%`);
        }
    } else {
        console.warn(`Pie chart element for ${stateName} not found.`);
    }

    // Update the state name if the element exists
    const stateNameElement = document.querySelector(stateNameSelector);
    if (stateNameElement) {
        stateNameElement.textContent = stateName;
        console.log(`Updated state name: ${stateName}`);
    } else {
        console.warn(`State name element for ${stateName} not found.`);
    }

    // Initialize or update the pie chart if the element exists
    if (pieChartElement && !$(pieChartElement).data('easyPieChart')) {
        console.log("Initializing the pie chart for the first time.");
        $(pieChartElement).easyPieChart({
            animate: 2000,
            size: 50,
            lineWidth: 5,
            barColor: '#f00'
        });
    } else if (pieChartElement) {
        console.log("Updating the already initialized pie chart.");
        $(pieChartElement).data('easyPieChart').update(Math.round(clicksReceived));
    }
};

fetchCampaignDataAggregates();