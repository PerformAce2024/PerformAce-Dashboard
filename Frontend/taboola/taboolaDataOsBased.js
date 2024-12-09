document.addEventListener("DOMContentLoaded", function () {
    console.log("OS Performance data handler loaded");

    // Add event listener for the "See All Data" button
    const osPerformanceBtn = document.getElementById("osPerformanceBtn");
    if (osPerformanceBtn) {
        osPerformanceBtn.addEventListener("click", function () {
            // Hide the daily metrics table
            const dailyMetricsTable = document.getElementById("dailyMetricsTable");
            if (dailyMetricsTable) {
                dailyMetricsTable.style.display = "none";
            }

            const geoPerformanceTable = document.getElementById("geoPerformanceTable");
            if (geoPerformanceTable) {
                geoPerformanceTable.style.display = "none";
            }

            const browserPerformanceTable = document.getElementById("browserPerformanceTable");
            if (browserPerformanceTable) {
                browserPerformanceTable.style.display = "none";
            }

            // Show the OS performance table
            const osPerformanceTable = document.getElementById("osPerformanceTable");
            if (osPerformanceTable) {
                osPerformanceTable.style.display = "table";
            }
        });
    }
});

const fetchOSPerformanceData = async (campaignId) => {
    try {
        console.log("Fetching OS performance data...");
        const apiUrl = `http://backend-api.performacemedia.int:8000/api/taboola/getClicksByOS/${campaignId}`;
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
        const osImpressions = responseData.map(item => item.impressions);

        // Populate the OS performance table
        const tableBody = document.querySelector("#osPerformanceTable tbody");
        if (!tableBody) {
            console.error("Table body element not found in the DOM.");
            return;
        }

        tableBody.innerHTML = ''; // Clear existing rows

        responseData.forEach(item => {
            const osFamily = item.osFamily;
            const clicks = item.clicks || 0;
            const impressions = item.impressions || 0;

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${osFamily}</td>
                <td>${clicks}</td>
                <td>${impressions}</td>
            `;
            tableBody.appendChild(row);
        });

        // Optional: If you want to update the radar chart as well
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
                data: osClicks.map(clicks => ((clicks / osClicks.reduce((sum, clicks) => sum + clicks, 0)) * 100).toFixed(2)), // Convert to percentages
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
                            const percentage = parseFloat(tooltipItem.raw).toFixed(1);
                            return `${tooltipItem.label}: ${percentage}% of total clicks`;
                        }
                    }
                }
            }
        }
    });
};

// Fetch and display OS performance data
fetchOSPerformanceData('42938360');  // Replace with actual campaign ID