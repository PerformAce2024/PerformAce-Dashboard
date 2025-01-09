document.addEventListener("DOMContentLoaded", function() {
    const sitePerformanceBtn = document.getElementById("sitePerformanceBtn");
    if (sitePerformanceBtn) {
        sitePerformanceBtn.addEventListener("click", function() {
            ["dailyMetricsTable", "osPerformanceTable", "browserPerformanceTable", "geoPerformanceTable"].forEach(tableId => {
                document.getElementById(tableId)?.style.setProperty("display", "none");
            });
            document.getElementById("sitePerformanceTable")?.style.setProperty("display", "table");
        });
    }
});

const fetchSitePerformanceData = async (roNumber, startDate, endDate) => {
    try {
        const email = localStorage.getItem('userEmail');
        const authToken = localStorage.getItem('authToken');
        const apiUrl = `https://backend-api.performacemedia.com:8000/api/metrics/sites?clientEmail=${email}&roNumber=${roNumber}&startDate=${startDate || ''}&endDate=${endDate || ''}`;
        
        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if (!response.ok) throw new Error(`Failed to fetch site data: ${response.statusText}`);
        const responseData = await response.json();
        responseData.sort((a, b) => b.clicks - a.clicks);

        const tableBody = document.querySelector("#sitePerformanceTable tbody");
        if (!tableBody) return;

        tableBody.innerHTML = '';

        // Add total row if totalCTR is available
        if (responseData.totalCTR !== undefined) {
            const totalRow = document.createElement("tr");
            totalRow.classList.add('total-row');
            totalRow.innerHTML = `
                <td><strong>Total</strong></td>
                <td><strong>${responseData.totalClicks}</strong></td>
                <td><strong>${responseData.totalImpressions}</strong></td>
                <td><strong>${responseData.totalCTR.toUpperCase()}%</strong></td>
            `;
            tableBody.appendChild(totalRow);
        }

        responseData.forEach(item => {
            const ctr = item.impressions > 0 ? 
                ((item.clicks / item.impressions) * 100).toFixed(2) : 
                '0.00';
            
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${item.site_name || "Unknown Site"}</td>
                <td>${item.clicks || 0}</td>
                <td>${item.impressions || 0}</td>
                <td>${ctr.toUpperCase()}%</td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error:', error);
    }
};

if (typeof window.initializeSiteData === 'undefined') {
    window.initializeSiteData = function() {
        const selectedRO = sessionStorage.getItem('selectedRO');
        const startDate = sessionStorage.getItem('startDate');
        const endDate = sessionStorage.getItem('endDate');
        if (selectedRO) {
            fetchSitePerformanceData(selectedRO, startDate, endDate);
        }
    };
    window.fetchSitePerformanceData = fetchSitePerformanceData;
    window.initializeSiteData();
}