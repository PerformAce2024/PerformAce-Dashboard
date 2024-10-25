// Function to fetch browser statistics and update the pie chart
const fetchBrowserStatistics = async () => {
    try {
        // Replace with the correct API URL
        const apiUrl = `http://localhost:8000/api/taboola/getClicksByBrowser/42564178`;

        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`Failed to fetch browser statistics: ${response.statusText}`);
        }

        const responseData = await response.json();

        if (!responseData || responseData.length === 0) {
            console.error('No browser statistics data found.');
            return;
        }

        // Extract browser names and clicks from the response data
        const browserNames = responseData.map(item => item.browser);
        const clicksData = responseData.map(item => item.clicks);

        // Update the pie chart with the fetched data
        updateBrowserPieChart(browserNames, clicksData);
    } catch (error) {
        console.error('Error fetching browser statistics:', error);
    }
};

// Function to update the pie chart with dynamic data
const updateBrowserPieChart = (labels, data) => {
    const canvasElement = document.getElementById('pieChart').querySelector('canvas');
    if (!canvasElement) {
        console.error("Canvas element not found in the DOM.");
        return;
    }
    const ctx = canvasElement.getContext('2d');

    const config = {
        type: 'pie',
        data: {
            datasets: [{
                data: data, // Dynamic data for clicks
                backgroundColor: [
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)',
                    'rgba(255, 159, 64, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 99, 132, 0.6)'
                ],
                label: 'Browser Statistics' // for legend
            }],
            labels: labels // Dynamic labels for browser names
        },
        options: {
            responsive: true,
            legend: {
                display: true,
                position: 'bottom',
            }
        }
    };

    new Chart(ctx, config);
};

// Call the function to fetch and display browser statistics on page load
fetchBrowserStatistics();
