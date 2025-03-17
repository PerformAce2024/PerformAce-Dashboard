import config from "../helper/config.js";

let stateChart = null;

export const fetchTop7StatesData = async (roNumber) => {
  try {
    const email = localStorage.getItem("userEmail");
    const authToken = localStorage.getItem("authToken");
    const apiUrl = `${config.BASE_URL}/api/metrics/top7-states?clientEmail=${email}&roNumber=${roNumber}`;

    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch top 7 states: ${response.statusText}`);
    }

    const responseData = await response.json();
    const top7ClicksData = responseData.top7ClicksData;

    if (!top7ClicksData?.length) {
      return;
    }

    const states = top7ClicksData.map((item) => item.state);
    const clicks = top7ClicksData.map((item) => item.clicks);

    if (stateChart) {
      stateChart.destroy();
    }

    updateBarChart(states, clicks);
  } catch (error) {
    console.error("Error:", error);
  }
};

const updateBarChart = (states, clicks) => {
  const canvasElement = document
    .getElementById("barStacked")
    .querySelector("canvas");
  if (!canvasElement) return;

  const ctx = canvasElement.getContext("2d");
  stateChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: states,
      datasets: [
        {
          label: "Clicks",
          backgroundColor: "rgba(38, 198, 218, 0.5)",
          borderColor: "rgba(38, 198, 218, 1)",
          borderWidth: 1,
          data: clicks,
        },
      ],
    },
    options: {
      scales: { y: { beginAtZero: true } },
      plugins: { legend: { display: false } },
    },
  });
};

if (typeof window.initializeTopStatesChart === "undefined") {
  window.initializeTopStatesChart = function () {
    const selectedRO = sessionStorage.getItem("selectedRO");
    if (selectedRO) {
      fetchTop7StatesData(selectedRO);
    }
  };
  window.fetchTop7StatesData = fetchTop7StatesData;
  window.initializeTopStatesChart();
}
