import config from "../helper/config.js";

export const fetchPlatformPerformanceData = async (
  platform,
  campaignIds,
  authToken
) => {
  if (!campaignIds || campaignIds.length === 0) {
    return []; // No campaigns for this platform
  }

  // Validate platform
  const validPlatforms = ["taboola", "outbrain", "dspOutbrain", "mgid"];
  if (!validPlatforms.includes(platform)) {
    console.error(`Unknown platform: ${platform}`);
    return [];
  }

  // Map platform names to collection endpoints
  // This keeps the existing endpoint naming pattern
  const endpoints = {
    taboola: "campaignperformances",
    outbrain: "outbrainPerformances",
    dspOutbrain: "dspOutbrainPerformances",
    mgid: "mgidPerformances",
  };

  const endpoint = endpoints[platform];

  const campaignPerformancePromises = campaignIds.map((campaignId) =>
    fetch(`${config.BASE_URL}/api/${endpoint}/${campaignId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    }).then((response) => {
      if (!response.ok) {
        console.warn(
          `Failed to fetch ${platform} performance for campaign ${campaignId}`
        );
        return null;
      }
      return response.json();
    })
  );

  const performances = await Promise.all(campaignPerformancePromises);
  return performances.filter((p) => p !== null);
};
