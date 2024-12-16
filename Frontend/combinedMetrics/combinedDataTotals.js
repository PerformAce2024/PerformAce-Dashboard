const fetchCampaignDataTotal = async (selectedRO) => {
    try {
        console.log("Starting to fetch total campaign data for RO:", selectedRO);
        
        const email = localStorage.getItem('userEmail');
        const authToken = localStorage.getItem('authToken');
        
        if (!email) {
            console.error('User email not found in localStorage!');
            return;
        }

        const campaignRequestUrl = `http://localhost:8000/api/metrics/total-metrics?clientEmail=${email}&roNumber=${selectedRO}&startDate=&endDate=`;

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

        // Extract the metrics from the response
        const totalClicks = data.totalClicks;
        const totalImpressions = data.totalImpressions;
        const totalSpent = data.totalSpent;
        const averageCTR = data.averageCTR;

        console.log(`Total Clicks: ${totalClicks}, Total Impressions: ${totalImpressions}, Total Spent: ₹${totalSpent}, CTR: ${averageCTR}%`);

        // Update UI elements
        const updateElement = (selector, value) => {
            const element = document.querySelector(selector);
            if (element) {
                element.textContent = value;
                console.log(`Updated ${selector}:`, value);
            } else {
                console.warn(`Element with selector '${selector}' not found.`);
            }
        };

        updateElement('.total-clicks', `${totalClicks}`);
        updateElement('.clicks-data', `${totalClicks} / 166000`);
        updateElement('.spent-data', `₹${totalSpent.toFixed(2)} / 300000`);
        updateElement('.impressions-data', `${totalImpressions} / 10000000`);
        updateElement('.ctr-data', `${averageCTR}% / 0.5%`);

        // Update progress bars
        const updateProgressBar = (selector, value, maxValue) => {
            const progressBar = document.querySelector(selector);
            if (progressBar) {
                const percentage = (value / maxValue) * 100;
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

        // Pass the clicks data to the line chart function
        renderLineChart(data.clicksData);
    } catch (error) {
        console.error('Error fetching total campaign data:', error);
    }
};



// Function to render the line chart
const renderLineChart = (clicksData) => {
    const formattedClicksData = clicksData.map(item => [new Date(item.date).getTime(), item.clicks]);

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
            timeformat: "%b %d", // Format date as needed
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

    // Use the data to plot the chart
    const plot = $.plot($("#updating-chart"), [{ data: formattedClicksData }], options);
};

fetchCampaignDataTotal();