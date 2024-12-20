// Frontend/combinedMetrics/allStatesClicks.js

document.addEventListener("DOMContentLoaded", function() {
    const geoPerformanceBtn = document.getElementById("geoPerformanceBtn");
    if (geoPerformanceBtn) {
        geoPerformanceBtn.addEventListener("click", function() {
            ["dailyMetricsTable", "osPerformanceTable", "browserPerformanceTable", "sitePerformanceTable"].forEach(id => {
                document.getElementById(id)?.style.setProperty("display", "none");
            });
            document.getElementById("geoPerformanceTable")?.style.setProperty("display", "table");
        });
    }
});

const fetchGeoPerformanceData = async (roNumber, startDate, endDate) => {
    try {
        console.log("Fetching geo performance data...");
        const email = localStorage.getItem('userEmail');
        const authToken = localStorage.getItem('authToken');
        
        // Build URL with date parameters
        const apiUrl = `http://localhost:8000/api/metrics/region?clientEmail=${email}&roNumber=${roNumber}&startDate=${startDate || ''}&endDate=${endDate || ''}`;
        
        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        console.log('Response Status:', response.status);
        const rawResponse = await response.text();
        console.log('Raw API Response:', rawResponse);

        if (!response.ok) {
            throw new Error(`Failed to fetch geo performance data: ${response.statusText}`);
        }

        let responseData;
        try {
            responseData = JSON.parse(rawResponse);
        } catch (error) {
            console.error("Error parsing the response data:", error);
            return;
        }

        console.log('Parsed Geo Performance Data:', responseData);

        if (!responseData.allStatesData || !Array.isArray(responseData.allStatesData)) {
            console.error('No data available or incorrect data format returned');
            return;
        }

        const tableBody = document.querySelector("#geoPerformanceTable tbody");
        if (!tableBody) {
            console.error("Table body element not found in the DOM.");
            return;
        }

        tableBody.innerHTML = '';

        responseData.allStatesData.forEach(item => {
            const region = item.state || "Unknown Region";
            const clicks = item.clicks !== undefined ? item.clicks : 0;
            const impressions = item.impressions !== undefined ? item.impressions : 0;

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${region}</td>
                <td>${clicks}</td>
                <td>${impressions}</td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error fetching geo performance data:', error);
    }
};

if (typeof window.initializeGeoData === 'undefined') {
    window.initializeGeoData = function() {
        const selectedRO = sessionStorage.getItem('selectedRO');
        const startDate = sessionStorage.getItem('startDate');
        const endDate = sessionStorage.getItem('endDate');
        if (selectedRO) {
            fetchGeoPerformanceData(selectedRO, startDate, endDate);
        }
    };
    window.fetchGeoPerformanceData = fetchGeoPerformanceData;
    window.initializeGeoData();
}