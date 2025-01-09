document.addEventListener("DOMContentLoaded", function() {
    console.log("Browser Performance data handler loaded");
    const browserPerformanceBtn = document.getElementById("browserPerformanceBtn");
    if (browserPerformanceBtn) {
        browserPerformanceBtn.addEventListener("click", function() {
            ["dailyMetricsTable", "osPerformanceTable", "geoPerformanceTable", "sitePerformanceTable"].forEach(id => {
                document.getElementById(id)?.style.setProperty("display", "none");
            });
            document.getElementById("browserPerformanceTable")?.style.setProperty("display", "table");
        });
    }
});

const fetchBrowserStatistics = async (roNumber) => {
    try {
        console.log("Fetching browser statistics...");
        const email = localStorage.getItem('userEmail');
        const authToken = localStorage.getItem('authToken');
        const apiUrl = `https://backend-api.performacemedia.com:8000/api/metrics/browser?clientEmail=${email}&roNumber=${roNumber}&startDate=&endDate=`;

        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch browser statistics: ${response.statusText}`);
        }

        const responseData = await response.json();
        if (!responseData?.length) {
            console.error('No browser statistics found');
            return;
        }

        const transformedData = responseData.map(item => ({
            browser: item.browser,
            clicks: item.clicks || 0,
            impressions: item.impressions || 0,
            ctr: item.impressions > 0 ? ((item.clicks / item.impressions) * 100).toFixed(2) : '0.00'
        })).sort((a, b) => b.clicks - a.clicks);

        const totalClicks = transformedData.reduce((sum, item) => sum + item.clicks, 0);
        const totalImpressions = transformedData.reduce((sum, item) => sum + item.impressions, 0);
        const totalCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';

        populateBrowserTable(transformedData, totalClicks, totalImpressions, totalCTR);
        updateBrowserPieChart(
            transformedData.map(item => item.browser),
            transformedData.map(item => item.clicks)
        );
    } catch (error) {
        console.error('Error:', error);
    }
};

const populateBrowserTable = (data, totalClicks, totalImpressions, totalCTR) => {
    const tableBody = document.querySelector("#browserPerformanceTable tbody");
    if (!tableBody) return;

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

    data.forEach(item => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${item.browser}</td>
            <td>${item.clicks}</td>
            <td>${item.impressions}</td>
            <td>${item.ctr.toUpperCase()}%</td>
        `;
        tableBody.appendChild(row);
    });
};

const updateBrowserPieChart = (labels, data) => {
    const canvas = document.getElementById('pieChart')?.querySelector('canvas');
    if (!canvas) return;

    if (window.browserChart) {
        window.browserChart.destroy();
    }

    window.browserChart = new Chart(canvas.getContext('2d'), {
        type: 'pie',
        data: {
            datasets: [{
                data: data.map(clicks => ((clicks / data.reduce((a, b) => a + b, 0)) * 100).toFixed(2)),
                backgroundColor: [
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)',
                    'rgba(255, 159, 64, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 99, 132, 0.6)'
                ],
                label: 'Browser Statistics'
            }],
            labels: labels
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(tooltipItem) {
                            return `${tooltipItem.label}: ${tooltipItem.raw}% of total clicks`;
                        }
                    }
                }
            }
        }
    });
};

if (typeof window.initializeBrowserStats === 'undefined') {
    window.initializeBrowserStats = function() {
        const selectedRO = sessionStorage.getItem('selectedRO');
        if (selectedRO) {
            fetchBrowserStatistics(selectedRO);
        }
    };
    window.fetchBrowserStatistics = fetchBrowserStatistics;
    window.initializeBrowserStats();
}