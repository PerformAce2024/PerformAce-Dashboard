// Frontend/combinedMetrics/combinedDataDailyDataLineChart.js

const fetchAndDisplayCombinedMetrics = async (roNumber) => {
    try {
        const email = localStorage.getItem('userEmail');
        const authToken = localStorage.getItem('authToken');
        
        // Get the dates from sessionStorage
        const startDate = sessionStorage.getItem('startDate');
        const endDate = sessionStorage.getItem('endDate');

        // Build the API URL with dates if they exist
        let apiUrl = `http://15.207.100.193:8000/api/metrics/campaign-daily?clientEmail=${email}&roNumber=${roNumber}`;
        
        if (startDate && endDate) {
            apiUrl += `&startDate=${startDate}&endDate=${endDate}`;
        }

        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        // Rest of your existing code remains the same
        if (!response.ok) {
            throw new Error(`Failed to fetch campaign daily data: ${response.statusText}`);
        }

        const responseData = await response.json();

        if (!responseData.dailyMetrics) {
            console.error('No daily data found.');
            return;
        }

        const data = responseData.dailyMetrics;

        const dates = data.map(item => new Date(item.date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }));
        const clicks = data.map(item => item.clicks);
        const impressions = data.map(item => item.impressions);

        updateAreaChart(dates, clicks, impressions);
    } catch (error) {
        console.error('Error fetching campaign daily performance data:', error);
    }
};

// Rest of your existing code remains the same

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
            labels: dates,
            datasets: [
                {
                    label: 'Clicks',
                    data: clicks,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0)',
                    fill: false
                },
                {
                    label: 'Impressions',
                    data: impressions,
                    borderColor: 'rgba(153, 102, 255, 1)',
                    backgroundColor: 'rgba(153, 102, 255, 0)',
                    fill: false
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
                        autoSkip: true,
                        maxRotation: 45,
                        minRotation: 0,
                    }
                }
            }
        }
    });
};

// Call the function directly with the RO number from session storage
const selectedRO = sessionStorage.getItem('selectedRO');
if (selectedRO) {
    fetchAndDisplayCombinedMetrics(selectedRO);
}