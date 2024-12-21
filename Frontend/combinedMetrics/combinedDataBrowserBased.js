document.addEventListener("DOMContentLoaded", function() {
    console.log("Browser Performance data handler loaded");
    
    const browserPerformanceBtn = document.getElementById("browserPerformanceBtn");
    if (browserPerformanceBtn) {
        browserPerformanceBtn.addEventListener("click", function() {
            console.log("See All Data button clicked");
            
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

        console.log("Response status:", response.status);

        if (!response.ok) {
            throw new Error(`Failed to fetch browser statistics: ${response.statusText}`);
        }

        const responseData = await response.json();
        console.log('Browser Statistics:', responseData);

        if (!responseData?.length) {
            console.error('No browser statistics found');
            return;
        }

        const browserNames = responseData.map(item => item.browser);
        const clicksData = responseData.map(item => item.clicks);
        const impressionsData = responseData.map(item => item.impressions);

        populateBrowserTable(browserNames, clicksData, impressionsData);
        updateBrowserPieChart(browserNames, clicksData);
    } catch (error) {
        console.error('Error:', error);
    }
};

const populateBrowserTable = (browserNames, clicksData, impressionsData) => {
    const tableBody = document.querySelector("#browserPerformanceTable tbody");
    if (!tableBody) return;

    tableBody.innerHTML = '';
    browserNames.forEach((browser, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${browser}</td>
            <td>${clicksData[index] || 0}</td>
            <td>${impressionsData[index] || 0}</td>
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
                data: data,
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
            legend: {
                display: true,
                position: 'bottom'
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