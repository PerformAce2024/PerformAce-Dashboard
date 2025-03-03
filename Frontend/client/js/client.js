import config from "../../config.js";

document.addEventListener("DOMContentLoaded", () => {
  const generatePDFButton = document.querySelector(
    ".btn.btn-default.btn-block"
  );

  if (!generatePDFButton) {
    console.error("Generate PDF button not found");
    return;
  }

  generatePDFButton.addEventListener("click", async function (e) {
    e.preventDefault();
    const email = localStorage.getItem("userEmail");
    const roNumber = sessionStorage.getItem("selectedRO");
    const authToken = localStorage.getItem("authToken");

    if (!email || !roNumber) {
      alert("Please select an RO first");
      return;
    }

    try {
      this.disabled = true;
      this.textContent = "Generating...";

      const [
        dailyMetrics,
        browserMetrics,
        regionMetrics,
        siteMetrics,
        osMetrics,
      ] = await Promise.all([
        fetch(
          `${config.BASE_URL}/api/metrics/campaign-daily?clientEmail=${email}&roNumber=${roNumber}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
            credentials: "include",
          }
        ).then((res) => res.json()),
        fetch(
          `${config.BASE_URL}/api/metrics/browser?clientEmail=${email}&roNumber=${roNumber}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
            credentials: "include",
          }
        ).then((res) => res.json()),
        fetch(
          `${config.BASE_URL}/api/metrics/region?clientEmail=${email}&roNumber=${roNumber}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
            credentials: "include",
          }
        ).then((res) => res.json()),
        fetch(
          `${config.BASE_URL}/api/metrics/sites?clientEmail=${email}&roNumber=${roNumber}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
            credentials: "include",
          }
        ).then((res) => res.json()),
        fetch(
          `${config.BASE_URL}/api/metrics/os?clientEmail=${email}&roNumber=${roNumber}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
            credentials: "include",
          }
        ).then((res) => res.json()),
      ]);

      const cleanData = {
        dailyMetrics: dailyMetrics.dailyMetrics?.map(
          ({ date, impressions, clicks }) => ({
            date: new Date(date).toLocaleDateString(),
            impressions,
            clicks,
          })
        ),

        browserMetrics: browserMetrics?.map(
          ({ browser, clicks, impressions, spent, visible_impressions }) => ({
            browser,
            clicks,
            impressions,
            spent,
            visible_impressions,
          })
        ),

        regionMetrics: regionMetrics.allStatesData?.map(
          ({ state, clicks, impressions }) => ({
            state,
            clicks,
            impressions,
          })
        ),

        siteMetrics: siteMetrics?.map(
          ({
            site_name,
            clicks,
            impressions,
            visible_impressions,
            spent,
            ctr,
          }) => ({
            site_name,
            clicks,
            impressions,
            visible_impressions,
            spent,
            ctr,
          })
        ),

        osMetrics: osMetrics?.map(
          ({ os_family, clicks, impressions, spent, visible_impressions }) => ({
            os_family,
            clicks,
            impressions,
            spent,
            visible_impressions,
          })
        ),
      };

      const workbook = XLSX.utils.book_new();

      Object.entries(cleanData).forEach(([name, data]) => {
        const sheet = XLSX.utils.json_to_sheet(data || []);
        XLSX.utils.book_append_sheet(
          workbook,
          sheet,
          name.replace("Metrics", " Metrics")
        );
      });

      XLSX.writeFile(workbook, `Campaign_Report_${roNumber}.xlsx`);
    } catch (error) {
      console.error("Error:", error);
      alert("Error generating report. Please try again.");
    } finally {
      this.disabled = false;
      this.textContent = "Generate PDF";
    }
  });
});
