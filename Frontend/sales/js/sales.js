import { fetchCampaignDataTotal } from "../../combinedMetrics/combinedDataTotals.js";
import { getclientDetails } from "./getclientDetails.js";
import { getsalesDetails } from "./getsalesDetails.js";

document.addEventListener("DOMContentLoaded", async () => {
  const data = await getsalesDetails();
  console.log(data);
  const salesId = data.sales._id;
  try {
    await getclientDetails(salesId);
  } catch (e) {
    console.error("error in updating metric", e);
  }

  const selectedRo = sessionStorage.getItem("selectedRO");
  console.log(selectedRo, "this is selected");
  console.log(typeof selectedRo, "This is type");

  await fetchCampaignDataTotal(selectedRo);
});
