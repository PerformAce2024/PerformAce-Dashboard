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
        const dates = data.map(item => item.date);
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
            labels: dates,  // X-axis: Dates
            datasets: [
                {
                    label: 'Clicks',
                    data: clicks,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    fill: true
                },
                {
                    label: 'Impressions',
                    data: impressions,
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    fill: true
                }
            ]
        },
        options: {
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
};

fetchAndDisplayCampaignPerformance('42564178');