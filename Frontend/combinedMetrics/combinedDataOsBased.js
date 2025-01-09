document.addEventListener("DOMContentLoaded", function() {
    console.log("OS Performance handler loaded");
    
    const osPerformanceBtn = document.getElementById("osPerformanceBtn");
    if (osPerformanceBtn) {
        osPerformanceBtn.addEventListener("click", function() {
            ["dailyMetricsTable", "geoPerformanceTable", "browserPerformanceTable", "sitePerformanceTable"].forEach(id => {
                document.getElementById(id)?.style.setProperty("display", "none");
            });
            document.getElementById("osPerformanceTable")?.style.setProperty("display", "table");
        });
    }
});

let osPerformanceChart = null;

const fetchOSPerformanceData = async (roNumber) => {
    try {
        console.log("Fetching OS performance data...");
        const email = localStorage.getItem('userEmail');
        const authToken = localStorage.getItem('authToken');
        const apiUrl = `http://localhost:8000/api/metrics/os?clientEmail=${email}&roNumber=${roNumber}&startDate=&endDate=`;
        
        console.log("API URL:", apiUrl);
        
        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });
        
        console.log("Raw API response:", response);

        if (!response.ok) {
            throw new Error(`Failed to fetch OS data: ${response.statusText}`);
        }

        const responseData = await response.json();
        console.log('OS Performance Data:', responseData);

        if (!responseData?.length) {
            console.error('No OS performance data available');
            return;
        }

        const transformedData = responseData
            .map(item => ({
                osFamily: item.os_family,
                clicks: item.clicks,
                impressions: item.impressions,
                ctr: item.impressions > 0 ? ((item.clicks / item.impressions) * 100).toFixed(2) : '0.00'
            }))
            .sort((a, b) => b.clicks - a.clicks);

        console.log('Transformed data:', transformedData);

        const osFamilies = transformedData.map(item => item.osFamily);
        const osClicks = transformedData.map(item => item.clicks);
        const osImpressions = transformedData.map(item => item.impressions);

        // Calculate total CTR
        const totalClicks = osClicks.reduce((a, b) => a + b, 0);
        const totalImpressions = osImpressions.reduce((a, b) => a + b, 0);
        const totalCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';

        const tableBody = document.querySelector("#osPerformanceTable tbody");
        if (tableBody) {
            tableBody.innerHTML = '';

            // Add total row
            const totalRow = document.createElement("tr");
            totalRow.classList.add('total-row');
            totalRow.innerHTML = `
                <td><strong>Total</strong></td>
                <td><strong>${totalClicks}</strong></td>
                <td><strong>${totalImpressions}</strong></td>
                <td><strong>${totalCTR.toUpperCase()}%</strong></td>
            `;
            tableBody.appendChild(totalRow);

            transformedData.forEach(item => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${item.osFamily}</td>
                    <td>${item.clicks}</td>
                    <td>${item.impressions}</td>
                    <td>${item.ctr.toUpperCase()}%</td>
                `;
                tableBody.appendChild(row);
            });
        }

        updateRadarChart(osFamilies, osClicks);
    } catch (error) {
        console.error('Error fetching OS data:', error);
    }
};

const updateRadarChart = (osFamilies, osClicks) => {
    console.log("Updating pie chart with OS data...");
    const canvasElement = document.getElementById('radarChart')?.getElementsByTagName('canvas')[0];
    if (!canvasElement) {
        console.error("Canvas element not found");
        return;
    }

    const ctx = canvasElement.getContext('2d');
    
    if (osPerformanceChart) {
        osPerformanceChart.destroy();
    }

    osPerformanceChart = new Chart(ctx, {
        type: "pie",
        data: {
            labels: osFamilies,
            datasets: [{
                label: "Clicks (%)",
                backgroundColor: [
                    'rgba(136,106,181, 0.2)',
                    'rgba(29,201,183, 0.2)',
                    'rgba(255,206,86, 0.2)',
                    'rgba(54,162,235, 0.2)',
                    'rgba(255,99,132, 0.2)'
                ],
                borderColor: [
                    'rgba(136,106,181, 1)',
                    'rgba(29,201,183, 1)',
                    'rgba(255,206,86, 1)',
                    'rgba(54,162,235, 1)',
                    'rgba(255,99,132, 1)'
                ],
                borderWidth: 1,
                data: osClicks.map(clicks => ((clicks / osClicks.reduce((a, b) => a + b, 0)) * 100).toFixed(2))
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(tooltipItem) {
                            const percentage = parseFloat(tooltipItem.raw).toFixed(1);
                            return `${tooltipItem.label}: ${percentage}% of total clicks`;
                        }
                    }
                }
            }
        }
    });
};

if (typeof window.initializeOSChart === 'undefined') {
    window.initializeOSChart = function() {
        const selectedRO = sessionStorage.getItem('selectedRO');
        if (selectedRO) {
            fetchOSPerformanceData(selectedRO);
        }
    };
    window.fetchOSPerformanceData = fetchOSPerformanceData;
    window.initializeOSChart();
}