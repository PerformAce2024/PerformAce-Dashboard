let siteChart = null;

const fetchTop10SitesData = async (roNumber) => {
    try {
        const email = localStorage.getItem('userEmail');
        const authToken = localStorage.getItem('authToken');
        const apiUrl = `https://backend-api.performacemedia.com:8000/api/metrics/top10-sites?clientEmail=${email}&roNumber=${roNumber}`;

        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch top 10 sites: ${response.statusText}`);
        }

        const responseData = await response.json();
        const top10SitesData = responseData.top10SitesData;

        if (!top10SitesData?.length) {
            return;
        }

        const sites = top10SitesData.map(item => item.siteName);
        const clicks = top10SitesData.map(item => item.clicks);

        if (siteChart) {
            siteChart.destroy();
        }

        const canvasElement = document.getElementById('publisherBarStacked').querySelector('canvas');
        if (!canvasElement) return;
        
        const ctx = canvasElement.getContext('2d');
        siteChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sites,
                datasets: [{
                    label: 'Clicks',
                    backgroundColor: 'rgba(38, 198, 218, 0.5)',
                    borderColor: 'rgba(38, 198, 218, 1)',
                    borderWidth: 1,
                    data: clicks
                }]
            },
            options: {
                scales: { y: { beginAtZero: true } },
                plugins: { legend: { display: false } }
            }
        });
    } catch (error) {
        console.error('Error:', error);
    }
};

if (typeof window.initializeTopSitesChart === 'undefined') {
    window.initializeTopSitesChart = function() {
        const selectedRO = sessionStorage.getItem('selectedRO');
        if (selectedRO) {
            fetchTop10SitesData(selectedRO);
        }
    };
    window.fetchTop10SitesData = fetchTop10SitesData;
    window.initializeTopSitesChart();
}