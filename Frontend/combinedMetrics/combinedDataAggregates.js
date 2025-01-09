const fetchMetricsData = async (selectedRO) => {
    try {
        const email = localStorage.getItem('userEmail');
        const authToken = localStorage.getItem('authToken');

        if (!email || !selectedRO) {
            console.error('Missing required data:', { email, selectedRO });
            return;
        }

        const baseUrl = 'https://backend-api.performacemedia.com:8000/api/metrics';
        const endpoints = {
            os: '/os',
            region: '/region',
            browser: '/browser',
            sites: '/top10-sites'
        };

        const fetchData = async (endpoint) => {
            const url = `${baseUrl}${endpoint}?clientEmail=${email}&roNumber=${selectedRO}&startDate=&endDate=`;
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authToken}`
                },
                credentials: 'include'
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        };

        const [osData, regionData, browserData, sitesData] = await Promise.all([
            fetchData(endpoints.os),
            fetchData(endpoints.region),
            fetchData(endpoints.browser),
            fetchData(endpoints.sites)
        ]);

        const metricsConfig = {
            os: {
                data: processOsData(osData),
                chartElement: '.js-easy-pie-chart-1',
                labelElement: '.js-state-name-1',
                targetTable: 'osPerformanceTable',
                clickable: true
            },
            region: {
                data: processRegionData(regionData),
                chartElement: '.js-easy-pie-chart-2',
                labelElement: '.js-state-name-2',
                targetTable: 'geoPerformanceTable',
                clickable: true
            },
            browser: {
                data: processBrowserData(browserData),
                chartElement: '.js-easy-pie-chart-3',
                labelElement: '.js-state-name-3',
                targetTable: 'browserPerformanceTable',
                clickable: true
            },
            sites: {
                data: processSitesData(sitesData),
                chartElement: '.js-easy-pie-chart-4',
                labelElement: '.js-state-name-4',
                targetTable: 'sitePerformanceTable',
                clickable: true
            }
        };

        Object.entries(metricsConfig).forEach(([key, metric]) => {
            const chartElement = document.querySelector(metric.chartElement);
            if (chartElement) {
                updatePieChart(
                    metric.data.clicks,
                    metric.data.total,
                    chartElement,
                    metric.data.name,
                    metric.labelElement
                );

                if (metric.clickable && metric.targetTable) {
                    makeChartClickable(chartElement, metric.targetTable);
                }
            }
        });

    } catch (error) {
        console.error('Error fetching metrics data:', error);
    }
};

const handleTableNavigation = () => {
    const tables = ['dailyMetricsTable', 'osPerformanceTable', 'geoPerformanceTable', 'sitePerformanceTable', 'browserPerformanceTable'];
    const activeTable = localStorage.getItem('activePerformanceTable') || 'dailyMetricsTable';

    // Hide all tables first
    tables.forEach(tableId => {
        const table = document.getElementById(tableId);
        if (table) {
            table.style.display = 'none';
        }
    });

    // Show the active table
    const selectedTable = document.getElementById(activeTable);
    if (selectedTable) {
        selectedTable.style.display = 'table';
        populateTableData(activeTable);
    }
};



// Update makeChartClickable function
const makeChartClickable = (element, targetTable) => {
    element.style.cursor = 'pointer';
    const container = element.closest('.pie-chart-container') || element;
    
    container.addEventListener('click', () => {
        console.log('Clicked:', targetTable);
        sessionStorage.setItem('scrollToTable', targetTable);
        sessionStorage.setItem('selectedRO', document.getElementById('roDropdown')?.value || '');
        window.location.href = 'nativeHub.html';
    });
};

// Keep existing processing functions
const processOsData = (data) => {
    if (!Array.isArray(data)) return { clicks: 0, total: 0, name: 'OS-Unknown' };
    const sortedData = [...data].sort((a, b) => b.clicks - a.clicks);
    const topOs = sortedData[0] || {};
    return {
        clicks: topOs.clicks || 0,
        total: sortedData.reduce((acc, item) => acc + (item.clicks || 0), 0),
        name: `OS-${topOs.os_family || 'Unknown'}`
    };
};

const processRegionData = (data) => {
    const statesData = data?.allStatesData || [];
    const topRegion = statesData[0] || {};
    return {
        clicks: topRegion.clicks || 0,
        total: data?.totalClicks || 0,
        name: `Region-${topRegion.state || 'Unknown'}`
    };
};

const processBrowserData = (data) => {
    if (!Array.isArray(data)) return { clicks: 0, total: 0, name: 'Browser-Unknown' };
    const sortedData = [...data].sort((a, b) => b.clicks - a.clicks);
    const topBrowser = sortedData[0] || {};
    return {
        clicks: topBrowser.clicks || 0,
        total: sortedData.reduce((acc, item) => acc + (item.clicks || 0), 0),
        name: `Browser-${topBrowser.browser || 'Unknown'}`
    };
};

const processSitesData = (data) => {
    const sitesArr = data?.top10SitesData || [];
    const topSite = sitesArr[0] || {};
    return {
        clicks: topSite.clicks || 0,
        total: data?.totalClicks || 0,
        name: `Site-${topSite.siteName || 'Unknown'}`
    };
};

const updatePieChart = (clicks, totalClicks, pieChartElement, label, labelSelector) => {
    const clicksReceived = totalClicks > 0 ? (clicks / totalClicks) * 100 : 0;

    if (isNaN(clicksReceived)) {
        console.error('Clicks received is not a valid number:', clicksReceived);
        return;
    }

    if (pieChartElement) {
        pieChartElement.setAttribute('data-percent', Math.round(clicksReceived));
        const percentElement = pieChartElement.querySelector('.js-percent');
        if (percentElement) {
            percentElement.textContent = `${Math.round(clicksReceived)}%`;
        }
    }

    const labelElement = document.querySelector(labelSelector);
    if (labelElement) {
        labelElement.textContent = label;
    }

    if (pieChartElement && !$(pieChartElement).data('easyPieChart')) {
        $(pieChartElement).easyPieChart({
            animate: 2000,
            size: 50,
            lineWidth: 5,
            barColor: '#f00'
        });
    } else if (pieChartElement) {
        $(pieChartElement).data('easyPieChart').update(Math.round(clicksReceived));
    }
};

document.addEventListener('DOMContentLoaded', () => {
    fetchAndPopulateROs();

    const roDropdown = document.getElementById('roDropdown');
    if (roDropdown) {
        roDropdown.addEventListener('change', (e) => {
            const selectedRO = e.target.value;
            const errorDiv = document.getElementById('roError');

            if (selectedRO === '') {
                if (errorDiv) errorDiv.style.display = 'block';
            } else {
                if (errorDiv) errorDiv.style.display = 'none';
                fetchMetricsData(selectedRO);
            }
        });
    }
});

fetchMetricsData();