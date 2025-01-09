const fetchAndDisplayCombinedMetrics = async (roNumber) => {
    try {
        const email = localStorage.getItem('userEmail');
        const authToken = localStorage.getItem('authToken');
        
        const startDate = sessionStorage.getItem('startDate');
        const endDate = sessionStorage.getItem('endDate');
        
        let apiUrl = `http://localhost:8000/api/metrics/campaign-daily?clientEmail=${email}&roNumber=${roNumber}`;
        
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
        
        if (!response.ok) {
            throw new Error(`Failed to fetch campaign daily data: ${response.statusText}`);
        }
        
        const responseData = await response.json();
        const data = responseData?.dailyMetrics || [];
        
        if (data.length === 0) {
            console.warn('No daily data found.');
            return;
        }

        // Update chart with original data order
        const chartData = [...data];
        const dates = chartData.map(item => new Date(item.date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }));
        const clicks = chartData.map(item => Number(item.clicks) || 0);
        const impressions = chartData.map(item => Number(item.impressions) || 0);
        
        updateAreaChart(dates, clicks, impressions);
        
        // Sort data by clicks in descending order for table only
        const sortedData = [...data].sort((a, b) => (Number(b.clicks) || 0) - (Number(a.clicks) || 0));
        
        // Update table with sorted data
        const tableBody = document.getElementById('metricsTableBody');
        if (!tableBody) {
            console.error('Table body element not found');
            return;
        }
        
        tableBody.innerHTML = '';
        
        sortedData.forEach(item => {
            const clicks = Number(item.clicks) || 0;
            const impressions = Number(item.impressions) || 0;
            const amountSpent = Number(item.amountSpent) || 0;
            
            const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : '0.00';
            const cpc = clicks > 0 ? (amountSpent / clicks).toFixed(2) : '0.00';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(item.date).toLocaleDateString('en-GB')}</td>
                <td>${clicks}</td>
                <td>${impressions}</td>
                <td>₹${cpc}</td>
                <td>₹${amountSpent.toFixed(2)}</td>
                <td>${ctr}%</td>
            `;
            
            tableBody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Error fetching campaign daily performance data:', error);
        const tableBody = document.getElementById('metricsTableBody');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="6">Error loading data. Please try again.</td></tr>';
        }
    }
};

const updateAreaChart = (dates, clicks, impressions) => {
    const canvasElement = document.getElementById('campaignAreaChart');
    if (!canvasElement) {
        console.error("Canvas element not found");
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

const selectedRO = sessionStorage.getItem('selectedRO');
if (selectedRO) {
    fetchAndDisplayCombinedMetrics(selectedRO);
}