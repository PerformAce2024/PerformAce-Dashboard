import config from "../helper/config.js";

const fetchCampaignDataTotal = async (selectedRO) => {
  try {
    console.log("Starting to fetch total campaign data for RO:", selectedRO);
    const email = localStorage.getItem("userEmail");
    const authToken = localStorage.getItem("authToken");

    if (!email || !selectedRO) {
      console.error("Missing required data:", { email, selectedRO });
      return;
    }

    // Fetch CPC first
    // const cpcResponse = await fetch(`https://backend-api.performacemedia.com:8000/api/releaseOrders/cpc/${selectedRO}`);
    const cpcResponse = await fetch(
      `${config}/api/releaseOrders/cpc/${selectedRO}`
    );
    if (!cpcResponse.ok) {
      throw new Error("Failed to fetch CPC");
    }
    const cpcData = await cpcResponse.json();
    const cpc = cpcData.cpc || 0;

    // Fetch campaign metrics
    // const campaignRequestUrl = `https://backend-api.performacemedia.com:8000/api/metrics/total-metrics?clientEmail=${encodeURIComponent(
    //   email
    // )}&roNumber=${encodeURIComponent(selectedRO)}&startDate=&endDate=`;
    const campaignRequestUrl = `${
      config.BASE_URL
    }/api/metrics/total-metrics?clientEmail=${encodeURIComponent(
      email
    )}&roNumber=${encodeURIComponent(selectedRO)}&startDate=&endDate=`;
    const campaignResponse = await fetch(campaignRequestUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      credentials: "include",
    });

    if (!campaignResponse.ok) {
      const errorText = await campaignResponse.text();
      throw new Error(`Error fetching campaign totals: ${errorText}`);
    }

    const data = await campaignResponse.json();

    const totalClicks = data.totalClicks || 0;
    const totalImpressions = data.totalImpressions || 0;
    const totalSpent = totalClicks * cpc; // Calculate spent using CPC
    const averageCTR = data.averageCTR || 0;

    const updateElement = (selector, value) => {
      const element = document.querySelector(selector);
      if (element) {
        element.textContent = value;
      }
    };

    const formatNumber = (num) => {
      return typeof num === "number" ? num.toFixed(2) : "0.00";
    };

    updateElement(".total-clicks", `${totalClicks}`);
    updateElement(".clicks-data", `${totalClicks}`);
    updateElement(".spent-data", `₹${formatNumber(totalSpent)}`);
    updateElement(".impressions-data", `${totalImpressions}`);
    updateElement(".ctr-data", `${formatNumber(averageCTR)}% / 0.05%`);

    const updateProgressBar = (selector, value, maxValue) => {
      const progressBar = document.querySelector(selector);
      if (progressBar) {
        const percentage = Math.min(Math.max((value / maxValue) * 100, 0), 100);
        progressBar.style.width = `${percentage}%`;
      }
    };

    updateProgressBar(".progress-bar-clicks", totalClicks, 166000);
    updateProgressBar(".progress-bar-spent", totalSpent, 300000);
    updateProgressBar(".progress-bar-impressions", totalImpressions, 10000000);
    updateProgressBar(".progress-bar-ctr", averageCTR, 0.5);

    if (data.clicksData?.length > 0) {
      // Sort clicksData by clicks in descending order
      data.clicksData.sort((a, b) => b.clicks - a.clicks);
      renderLineChart(data.clicksData);
    }
  } catch (error) {
    console.error("Error fetching total campaign data:", error);
    [
      "total-clicks",
      "clicks-data",
      "spent-data",
      "impressions-data",
      "ctr-data",
    ].forEach((selector) => {
      const element = document.querySelector(selector);
      if (element) element.textContent = "N/A";
    });
  }
};

const renderLineChart = (clicksData) => {
  try {
    const formattedClicksData = clicksData
      .filter((item) => item?.date)
      .map((item) => [new Date(item.date).getTime(), Number(item.clicks) || 0])
      .sort((a, b) => a[0] - b[0]);

    if (formattedClicksData.length === 0) return;

    const options = {
      colors: ["#0dcaf0"],
      series: {
        lines: { show: true, lineWidth: 2, fill: 0.1 },
      },
      points: { show: true },
      grid: {
        borderColor: "rgba(0,0,0,0.05)",
        borderWidth: 1,
        labelMargin: 5,
      },
      xaxis: {
        mode: "time",
        timeformat: "%b %d",
        color: "#F0F0F0",
        tickColor: "rgba(0,0,0,0.05)",
        font: { size: 10, color: "#999" },
      },
      yaxis: {
        min: 0,
        color: "#F0F0F0",
        tickColor: "rgba(0,0,0,0.05)",
        font: { size: 10, color: "#999" },
      },
    };

    const chartContainer = $("#updating-chart");
    if (chartContainer.length) {
      $.plot(chartContainer, [{ data: formattedClicksData }], options);
    }
  } catch (error) {
    console.error("Error rendering chart:", error);
  }
};
