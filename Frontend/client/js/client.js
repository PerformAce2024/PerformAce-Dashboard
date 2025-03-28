import { fetchCampaignDataTotal } from "../../combinedMetrics/combinedDataTotals.js";
import { generateReportFromAggregatedData } from "./generatereport.js";

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

      // Use the fetchCampaignDataTotal function to get aggregated data
      const campaignData = await fetchCampaignDataTotal(roNumber);

      if (!campaignData || !campaignData.aggregatedData) {
        throw new Error("Failed to fetch campaign data");
      }

      // Generate the report using the aggregated data
      const reportGenerated = await generateReportFromAggregatedData(
        campaignData.aggregatedData,
        campaignData.roNumber
      );

      if (!reportGenerated) {
        throw new Error("Failed to generate report");
      }

      // Success notification
      console.log("Report generated successfully");
      alert("Report generated successfully!");
    } catch (error) {
      console.error("Error:", error);
      alert("Error generating report. Please try again.");
    } finally {
      this.disabled = false;
      this.textContent = "Generate PDF";
    }
  });
});
