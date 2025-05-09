export async function processMgidCampaign(campaignId, startDate, endDate) {
  try {
    const response = await fetch("http://localhost:8001/trigger", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        campaignId,
        startDate,
        endDate,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(data);
    return data;
  } catch (error) {
    console.error("Error in Processing Mgid Data:", error);
    throw error;
  }
}
