export const renderLineChart = (chartData) => {
  // Using the existing renderLineChart function from your code
  try {
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
      $.plot(chartContainer, [{ data: chartData }], options);
    }
  } catch (error) {
    console.error("Error rendering chart:", error);
  }
};
