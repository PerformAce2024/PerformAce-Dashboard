document.addEventListener("DOMContentLoaded", function () {
  console.log("Checking for table navigation...");

  const targetTable = sessionStorage.getItem("scrollToTable");
  console.log("Target table from session:", targetTable);

  if (targetTable) {
    console.log("Found target table, initializing navigation");

    // Hide all tables
    const tables = [
      "dailyMetricsTable",
      "osPerformanceTable",
      "geoPerformanceTable",
      "sitePerformanceTable",
      "browserPerformanceTable",
    ];
    tables.forEach((tableId) => {
      const table = document.getElementById(tableId);
      if (table) {
        table.style.display = "none";
        console.log(`Hidden table: ${tableId}`);
      }
    });

    // Show target table
    const tableToShow = document.getElementById(targetTable);
    if (tableToShow) {
      console.log(`Showing table: ${targetTable}`);
      tableToShow.style.display = "table";

      // Scroll to table
      setTimeout(() => {
        console.log("Scrolling to table");
        tableToShow.scrollIntoView({ behavior: "smooth", block: "center" });

        // Initialize table data
        const selectedRO = sessionStorage.getItem("selectedRO");
        console.log(`Initializing data for RO: ${selectedRO}`);

        switch (targetTable) {
          case "osPerformanceTable":
            window.initializeOsData?.();
            break;
          case "geoPerformanceTable":
            window.initializeGeoData?.();
            break;
          case "browserPerformanceTable":
            window.initializeBrowserData?.();
            break;
          case "sitePerformanceTable":
            window.initializeSiteData?.();
            break;
        }
      }, 500);
    }

    // Clean up
    sessionStorage.removeItem("scrollToTable");
  }
});
