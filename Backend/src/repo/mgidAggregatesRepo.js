import { connectToMongo, getDb } from "../config/db.js";

class MgidAggregatesRepo {
  static async getMgidCampaignRegionAggregates(campaignId) {
    console.log("Connecting to MongoDB...");
    const client = await getDb();
    if (!client) {
      console.error("Failed to connect to MongoDB");
      throw new Error("Failed to connect to MongoDB");
    }

    const mgidCollection = client.collection("mgid_transformed_data");

    console.log(`Fetching MGID campaign data for campaignId: ${campaignId}`);
    // Find the specific campaign by ID
    const campaign = await mgidCollection.findOne({ campaignId });
    console.log("MGID Campaign Data:", campaign);

    if (!campaign || !campaign.performanceByRegion) {
      console.error(
        `Campaign not found or malformed data for campaignId: ${campaignId}`
      );
      throw new Error("Campaign data not found or malformed");
    }

    // Extract performance by region for the given date (assumes one date)
    const dateKey = Object.keys(campaign.performanceByRegion)[0]; // Assumes a date key is present
    const results = campaign.performanceByRegion[dateKey];
    console.log("Region Performance Results:", results);

    if (!results || results.length === 0) {
      console.error(
        "No region performance results found for campaignId:",
        campaignId
      );
      throw new Error("No performance results found");
    }

    // Sort results by clicks in descending order
    console.log("Sorting results by clicks...");
    const sortedResults = results.sort(
      (a, b) => parseInt(b.Clicks, 10) - parseInt(a.Clicks, 10)
    );

    // Extract the top 3 regions by clicks
    console.log("Extracting top 3 regions by clicks...");
    const top3Regions = sortedResults.slice(0, 3);

    // Aggregate the clicks for all remaining regions as "Other"
    console.log("Aggregating clicks for other regions...");
    const otherRegions = sortedResults.slice(3);
    const otherRegionTotals = otherRegions.reduce(
      (acc, region) => {
        acc.clicks += parseInt(region.Clicks || 0, 10);
        return acc;
      },
      {
        clicks: 0,
      }
    );

    // Prepare the data for the chart
    console.log("Preparing top 3 clicks data...");
    const top3ClicksData = top3Regions.map((r) => ({
      region: r.Region || "Unknown", // Assumes each result has a 'Region' field
      clicks: parseInt(r.Clicks || 0, 10),
    }));

    // Add the aggregated "Other" regions
    top3ClicksData.push({
      region: "Other",
      clicks: otherRegionTotals.clicks,
    });

    console.log("Top 3 Clicks Data with Other:", top3ClicksData);

    // Calculate the total clicks across all regions
    console.log("Calculating total clicks...");
    const totalClicks = results.reduce((acc, result) => {
      acc += parseInt(result.Clicks || 0, 10);
      return acc;
    }, 0);

    // Log totalClicks for debugging
    console.log("Total Clicks:", totalClicks);

    // Return the aggregated data
    return {
      totalClicks, // Return total clicks here
      top3ClicksData, // Data for top 3 regions and "Other"
    };
  }
}

export default MgidAggregatesRepo;
