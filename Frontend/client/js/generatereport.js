export const generateReportFromAggregatedData = async (
  aggregatedData,
  roNumber
) => {
  if (!aggregatedData) {
    console.error("No aggregated data available for report generation");
    return false;
  }

  try {
    console.log("Preparing report data from aggregated data");

    // Transform daily performance data
    const dailyMetrics = Object.entries(aggregatedData.dailyPerformance || {})
      .filter(([date, data]) => data.clicks > 0 || data.impressions > 0) // Filter out empty days
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString(),
        impressions: data.impressions,
        clicks: data.clicks,
        spent: data.spent.toFixed(2),
        ctr: ((data.clicks / data.impressions) * 100).toFixed(2) + "%",
      }));

    // Transform browser performance data
    const browserMetrics = Object.entries(
      aggregatedData.browserPerformance || {}
    ).map(([browser, data]) => ({
      browser,
      clicks: data.clicks,
      impressions: data.impressions,
      spent: data.spent.toFixed(2),
      ctr: ((data.clicks / data.impressions) * 100).toFixed(2) + "%",
    }));

    // Transform region performance data
    const regionMetrics = Object.entries(
      aggregatedData.regionPerformance || {}
    ).map(([region, data]) => ({
      region,
      clicks: data.clicks,
      impressions: data.impressions,
      spent: data.spent.toFixed(2),
      ctr: ((data.clicks / data.impressions) * 100).toFixed(2) + "%",
    }));

    // Transform OS performance data
    const osMetrics = Object.entries(aggregatedData.osPerformance || {}).map(
      ([os, data]) => ({
        os_family: os,
        clicks: data.clicks,
        impressions: data.impressions,
        spent: data.spent.toFixed(2),
        ctr: ((data.clicks / data.impressions) * 100).toFixed(2) + "%",
      })
    );

    // Create a summary sheet with totals
    const summaryMetrics = [
      {
        metric: "Total Clicks",
        value: aggregatedData.totalClicks,
      },
      {
        metric: "Total Impressions",
        value: aggregatedData.totalImpressions,
      },
      {
        metric: "Total Visible Impressions",
        value: aggregatedData.totalVisibleImpressions || 0,
      },
      {
        metric: "Total Spent",
        value: `$${aggregatedData.totalSpent.toFixed(2)}`,
      },
      {
        metric: "Average CTR",
        value: `${(aggregatedData.averageCTR * 100).toFixed(2)}%`,
      },
      {
        metric: "Report Generated",
        value: new Date().toLocaleString(),
      },
    ];

    // Create a platform summary
    const platformMetrics = Object.entries(aggregatedData.platformStats || {})
      .filter(([platform, data]) => data.clicks > 0 || data.impressions > 0)
      .map(([platform, data]) => ({
        platform,
        clicks: data.clicks,
        impressions: data.impressions,
        spent: data.spent.toFixed(2),
        ctr:
          data.impressions > 0
            ? ((data.clicks / data.impressions) * 100).toFixed(2) + "%"
            : "0%",
      }));

    // Prepare the final data object
    const cleanData = {
      summaryMetrics,
      platformMetrics,
      dailyMetrics,
      browserMetrics,
      regionMetrics,
      osMetrics,
    };

    console.log("Report data prepared:", cleanData);

    // Create Excel workbook
    const workbook = XLSX.utils.book_new();

    // Add each sheet to the workbook
    Object.entries(cleanData).forEach(([name, data]) => {
      if (data && data.length > 0) {
        const sheet = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(
          workbook,
          sheet,
          name.replace("Metrics", " Metrics")
        );
      }
    });

    // Write the Excel file
    XLSX.writeFile(
      workbook,
      `Campaign_Report_${roNumber}_${
        new Date().toISOString().split("T")[0]
      }.xlsx`
    );

    console.log("Report generated successfully");
    return true;
  } catch (error) {
    console.error("Error generating report:", error);
    return false;
  }
};
