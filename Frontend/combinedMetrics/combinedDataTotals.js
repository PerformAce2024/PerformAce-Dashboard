const fetchCampaignDataTotal = async (selectedRO) => {
    try {
        console.log("Starting to fetch total campaign data for RO:", selectedRO);
        
        const email = localStorage.getItem('userEmail');
        const authToken = localStorage.getItem('authToken');
        
        if (!email || !selectedRO) {
            console.error('Missing required data:', { email, selectedRO });
            return;
        }

        const campaignRequestUrl = `http://15.207.100.193:8000/api/metrics/total-metrics?clientEmail=${encodeURIComponent(email)}&roNumber=${encodeURIComponent(selectedRO)}&startDate=&endDate=`;

        console.log(`Requesting campaign totals from URL: ${campaignRequestUrl}`);
        const campaignResponse = await fetch(campaignRequestUrl, {
            method: "GET",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${authToken}`
            },
            credentials: 'include'
        });

        console.log('Campaign response status:', campaignResponse.status);

        if (!campaignResponse.ok) {
            const errorText = await campaignResponse.text();
            console.error(`Error fetching campaign totals: ${errorText}`);
            throw new Error(`Error fetching campaign totals: ${errorText}`);
        }

        const data = await campaignResponse.json();
        console.log('Total Campaign Data:', data);

        // Extract the metrics from the response with default values
        const totalClicks = data.totalClicks || 0;
        const totalImpressions = data.totalImpressions || 0;
        const totalSpent = data.totalSpent || 0;
        const averageCTR = data.averageCTR || 0;

        console.log(`Total Clicks: ${totalClicks}, Total Impressions: ${totalImpressions}, Total Spent: ₹${totalSpent}, CTR: ${averageCTR}%`);

        // Update UI elements with safe number formatting
        const updateElement = (selector, value) => {
            const element = document.querySelector(selector);
            if (element) {
                element.textContent = value;
                console.log(`Updated ${selector}:`, value);
            } else {
                console.warn(`Element with selector '${selector}' not found.`);
            }
        };

        // Safely format numbers
        const formatNumber = (num) => {
            return typeof num === 'number' ? num.toFixed(2) : '0.00';
        };

        updateElement('.total-clicks', `${totalClicks}`);
        updateElement('.clicks-data', `${totalClicks} / 166000`);
        updateElement('.spent-data', `₹${formatNumber(totalSpent)} / 300000`);
        updateElement('.impressions-data', `${totalImpressions} / 10000000`);
        updateElement('.ctr-data', `${formatNumber(averageCTR)}% / 0.5%`);

        // Update progress bars with safe calculations
        const updateProgressBar = (selector, value, maxValue) => {
            const progressBar = document.querySelector(selector);
            if (progressBar) {
                const safeValue = Number(value) || 0;
                const safeMaxValue = Number(maxValue) || 1;
                const percentage = Math.min(Math.max((safeValue / safeMaxValue) * 100, 0), 100);
                progressBar.style.width = `${percentage}%`;
                console.log(`Updated ${selector} width:`, `${percentage}%`);
            } else {
                console.warn(`Progress bar with selector '${selector}' not found.`);
            }
        };

        updateProgressBar('.progress-bar-clicks', totalClicks, 166000);
        updateProgressBar('.progress-bar-spent', totalSpent, 300000);
        updateProgressBar('.progress-bar-impressions', totalImpressions, 10000000);
        updateProgressBar('.progress-bar-ctr', averageCTR, 0.5);

        // Only render chart if data exists
        if (data.clicksData && Array.isArray(data.clicksData) && data.clicksData.length > 0) {
            renderLineChart(data.clicksData);
        } else {
            console.warn('No clicks data available for chart');
        }
    } catch (error) {
        console.error('Error fetching total campaign data:', error);
        // Update UI to show error state
        const updateErrorState = (selector) => {
            const element = document.querySelector(selector);
            if (element) {
                element.textContent = 'N/A';
            }
        };
        
        ['total-clicks', 'clicks-data', 'spent-data', 'impressions-data', 'ctr-data'].forEach(updateErrorState);
    }
};

// Function to render the line chart
const renderLineChart = (clicksData) => {
    try {
        const formattedClicksData = clicksData
            .filter(item => item && item.date) // Filter out invalid data
            .map(item => {
                const timestamp = new Date(item.date).getTime();
                return [timestamp, Number(item.clicks) || 0];
            })
            .sort((a, b) => a[0] - b[0]); // Sort by date

        if (formattedClicksData.length === 0) {
            console.warn('No valid data points for chart');
            return;
        }

        const options = {
            colors: ['#0dcaf0'],
            series: {
                lines: {
                    show: true,
                    lineWidth: 2,
                    fill: 0.1
                }
            },
            points: {
                show: true
            },
            grid: {
                borderColor: 'rgba(0,0,0,0.05)',
                borderWidth: 1,
                labelMargin: 5
            },
            xaxis: {
                mode: 'time',
                timeformat: "%b %d",
                color: '#F0F0F0',
                tickColor: 'rgba(0,0,0,0.05)',
                font: {
                    size: 10,
                    color: '#999'
                }
            },
            yaxis: {
                min: 0,
                color: '#F0F0F0',
                tickColor: 'rgba(0,0,0,0.05)',
                font: {
                    size: 10,
                    color: '#999'
                }
            }
        };

        const chartContainer = $("#updating-chart");
        if (chartContainer.length) {
            $.plot(chartContainer, [{ data: formattedClicksData }], options);
        } else {
            console.warn('Chart container not found');
        }
    } catch (error) {
        console.error('Error rendering chart:', error);
    }
};