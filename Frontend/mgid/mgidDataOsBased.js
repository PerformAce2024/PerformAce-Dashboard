const fetchOSPerformanceData = async (campaignId) => {
    try {
        console.log("Fetching OS performance data...");
        const apiUrl = `http://localhost:8000/api/mgid/getClicksByOS/${campaignId}`;
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

        // Update the radar chart
        updateRadarChart(osFamilies, osClicks);
    } catch (error) {
        console.error('Error fetching OS performance data:', error);
    }
};

const updateRadarChart = (osFamilies, osClicks) => {
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
                label: "Clicks",
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
                data: osClicks, // Dynamic click data for each OS
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
                            return `${tooltipItem.label}: ${tooltipItem.raw} clicks`;
                        }
                    }
                }
            }
        }
    });
};

// Fetch and display OS performance data
fetchOSPerformanceData('11924952');
