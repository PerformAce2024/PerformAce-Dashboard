const fetchTop7StatesData = async (campaignId) => {
    try {
        const apiUrl = `http://backend-api.performacemedia.int:8000/api/metrics/top7-states?clientEmail=agarwal11srishti@gmail.com&startDate=2024-10-26&endDate=2024-10-27`;

        const response = await fetch(apiUrl);
        console.log("Raw API response:", response);

        if (!response.ok) {
            throw new Error(`Failed to fetch top 7 states: ${response.statusText}`);
        }

        const responseData = await response.json();
        console.log("Parsed API response:", responseData);

        const top7ClicksData = responseData.top7ClicksData;
        console.log('Top 7 Clicks Data:', top7ClicksData);

        // If no data is available, handle it gracefully
        if (!top7ClicksData || top7ClicksData.length === 0) {
            console.log("No data available for top 7 states");
            return;
        }

        // Extract states and clicks
        const states = top7ClicksData.map(item => item.state);
        const clicks = top7ClicksData.map(item => item.clicks);

        // Call the function to update the bar chart
        updateBarChart(states, clicks);

    } catch (error) {
        console.error('Error fetching top 7 states data:', error);
    }
};

const updateBarChart = (states, clicks) => {
    console.log("Updating bar chart with top 7 states performance...");
    
    const canvasElement = document.getElementById('barStacked').querySelector('canvas');
    if (!canvasElement) {
        console.error("Canvas element for bar chart not found.");
        return;
    }
    
    const ctx = canvasElement.getContext('2d');

    // Bar chart config
    const barStackedData = {
        labels: states,  // X-axis: State names
        datasets: [{
            label: 'Clicks',
            backgroundColor: 'rgba(38, 198, 218, 0.5)',  // Customize color as needed
            borderColor: 'rgba(38, 198, 218, 1)',
            borderWidth: 1,
            data: clicks  // Y-axis: Clicks data
        }]
    };

    const config = {
        type: 'bar',
        data: barStackedData,
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: false  // Hides the legend
                }
            }
        }
    };

    // Create or update the chart
    new Chart(ctx, config);
};

// Call the function to fetch and display the top 7 states
fetchTop7StatesData('42938360');
