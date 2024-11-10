const fetchOSPerformanceData = async (campaignId) => {
    try {
        console.log("Fetching OS performance data...");
        const apiUrl = `http://localhost:8000/api/taboola/getClicksByOS/${campaignId}`;
        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`Failed to fetch OS performance data: ${response.statusText}`);
        }

        const responseData = await response.json();
        console.log('OS Performance Data:', responseData);

        if (!responseData || responseData.length === 0) {
            console.error('No data available for OS performance');
            return;
        }

        // Extract OS families and clicks from the response data
        const osFamilies = responseData.map(item => item.osFamily);
        const osClicks = responseData.map(item => item.clicks);

        // Calculate total clicks for percentage calculation
        const totalClicks = osClicks.reduce((sum, clicks) => sum + clicks, 0);
        const osClickPercentages = osClicks.map(clicks => ((clicks / totalClicks) * 100).toFixed(2)); // Convert to percentages

        // Update the radar chart
        updateRadarChart(osFamilies, osClickPercentages);
    } catch (error) {
        console.error('Error fetching OS performance data:', error);
    }
};

const updateRadarChart = (osFamilies, osClickPercentages) => {
    console.log("Updating pie chart with OS performance...");
    const canvasElement = document.getElementById('radarChart').getElementsByTagName('canvas')[0];
    if (!canvasElement) {
        console.error("Canvas element not found for pie chart.");
        return;
    }
    const ctx = canvasElement.getContext('2d');

    // Destroy the previous chart instance, if it exists
    if (window.osPerformanceChart) {
        window.osPerformanceChart.destroy();
    }

    // Create a new pie chart
    window.osPerformanceChart = new Chart(ctx, {
        type: "pie",
        data: {
            labels: osFamilies, // Dynamic OS families
            datasets: [{
                label: "Clicks (%)",
                backgroundColor: [
                    'rgba(136,106,181, 0.2)',
                    'rgba(29,201,183, 0.2)',
                    'rgba(255,206,86, 0.2)',
                    'rgba(54,162,235, 0.2)',
                    'rgba(255,99,132, 0.2)'
                ], // You can change the colors to match your design
                borderColor: [
                    'rgba(136,106,181, 1)',
                    'rgba(29,201,183, 1)',
                    'rgba(255,206,86, 1)',
                    'rgba(54,162,235, 1)',
                    'rgba(255,99,132, 1)'
                ],
                borderWidth: 1,
                data: osClickPercentages, // Dynamic percentage data for each OS
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function (tooltipItem) {
                            // Check if the value is being accessed correctly
                            const percentage = parseFloat(tooltipItem.raw || tooltipItem.parsed).toFixed(1);
                            return `${tooltipItem.label}: ${percentage}% of total clicks`;
                        }
                    }
                }
            }
        }
    });
};

// Fetch and display OS performance data
fetchOSPerformanceData('42938360');
