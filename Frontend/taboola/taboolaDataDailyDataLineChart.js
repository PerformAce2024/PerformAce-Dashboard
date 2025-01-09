const fetchAndDisplayCampaignPerformance = async (campaignId) => {
    try {
        const apiUrl = `http://localhost:8000/api/taboola/getCampaignDailyData/${campaignId}`;

        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`Failed to fetch campaign daily data: ${response.statusText}`);
        }

        const responseData = await response.json();

        if (!responseData.dailyData) {
            console.error('No daily data found.');
            return;
        }

        const data = responseData.dailyData;

        // Format the date strings to display only the date part (e.g., 'YYYY-MM-DD')
        const dates = data.map(item => new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }));
        const clicks = data.map(item => item.clicks);
        const impressions = data.map(item => item.impressions);

        updateAreaChart(dates, clicks, impressions);
    } catch (error) {
        console.error('Error fetching campaign daily performance data:', error);
    }
};

const updateAreaChart = (dates, clicks, impressions) => {
    console.log("Updating area chart with campaign performance...");
    const canvasElement = document.getElementById('campaignAreaChart');
    if (!canvasElement) {
        console.error("Canvas element with id 'campaignAreaChart' not found in the DOM.");
        return;
    }
    const ctx = canvasElement.getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,  // X-axis: Dates formatted to display only the date part
            datasets: [
                {
                    label: 'Clicks',
                    data: clicks,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0)', // No background fill
                    fill: false // Remove background fill
                },
                {
                    label: 'Impressions',
                    data: impressions,
                    borderColor: 'rgba(153, 102, 255, 1)',
                    backgroundColor: 'rgba(153, 102, 255, 0)', // No background fill
                    fill: false // Remove background fill
                }
            ]
        },
        options: {
            scales: {
                y: { 
                    beginAtZero: true 
                },
                x: {
                    ticks: {
                        autoSkip: true,  // Skips some of the labels to avoid overlap
                        maxRotation: 45, // Controls the maximum rotation of the labels
                        minRotation: 0,  // Controls the minimum rotation of the labels
                    }
                }
            }
        }
    });
};

// Call the function
fetchAndDisplayCampaignPerformance('42938360');
