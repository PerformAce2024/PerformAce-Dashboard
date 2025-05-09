import { getDb } from "../config/db.js";

const getNumber = (value) => Number(value) || 0;

const aggregateCampaignMetrics = (allCampaigns) => {
  const totalMetrics = {
    clicks: 0,
    impressions: 0,
    visible_impressions: 0,
    spent: 0,
    conversions_value: 0,
    roas: 0,
    roas_clicks: 0,
    roas_views: 0,
  };

  allCampaigns.forEach((campaign) => {
    const taboolaMetrics =
      campaign.rawData.taboola?.campaignPerformanceResult?.results?.[0];
    const outbrainMetrics =
      campaign.rawData.outbrain?.data?.campaignPerformance?.results?.[0]
        ?.metrics;

    if (taboolaMetrics) {
      totalMetrics.clicks += getNumber(taboolaMetrics.clicks);
      totalMetrics.impressions += getNumber(taboolaMetrics.impressions);
      totalMetrics.visible_impressions += getNumber(
        taboolaMetrics.visible_impressions
      );
      totalMetrics.spent += getNumber(taboolaMetrics.spent);
    }

    if (outbrainMetrics) {
      totalMetrics.clicks += getNumber(outbrainMetrics.clicks);
      totalMetrics.impressions += getNumber(outbrainMetrics.impressions);
      totalMetrics.spent += getNumber(outbrainMetrics.spend);
    }
  });

  const derivedMetrics = {
    ctr:
      totalMetrics.impressions > 0
        ? (totalMetrics.clicks / totalMetrics.impressions) * 100
        : 0,
    vctr:
      totalMetrics.visible_impressions > 0
        ? (totalMetrics.clicks / totalMetrics.visible_impressions) * 100
        : 0,
    cpm:
      totalMetrics.impressions > 0
        ? (totalMetrics.spent / totalMetrics.impressions) * 1000
        : 0,
    vcpm:
      totalMetrics.visible_impressions > 0
        ? (totalMetrics.spent / totalMetrics.visible_impressions) * 1000
        : 0,
    cpc: totalMetrics.clicks > 0 ? totalMetrics.spent / totalMetrics.clicks : 0,
    cpa: 0, //flagged to remove
    cpa_clicks: 0,
    cpa_views: 0,
    cpa_actions_num: 0,
    cpa_actions_num_from_clicks: 0,
    cpa_actions_num_from_views: 0,
    cpa_conversion_rate: 0,
    cpa_conversion_rate_clicks: 0,
    cpa_conversion_rate_views: 0, //flagged to remove
  };

  return {
    last_used_rawdata_update_time: new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
      hour12: false,
    }),
    last_used_rawdata_update_time_gmt_millisec: Date.now(),
    timezone: "IST",
    results: [
      {
        date: new Date().toISOString().split("T")[0] + " 00:00:00.0",
        date_end_period: new Date().toISOString().split("T")[0] + " 00:00:00.0",
        ...totalMetrics,
        ...derivedMetrics,
        campaigns_num: allCampaigns.length,
      },
    ],
  };
};

const aggregateDimensionMetrics = (allCampaigns, dimensionType) => {
  const metrics = new Map();

  allCampaigns.forEach((campaign) => {
    // Process Taboola data
    const taboolaData =
      campaign.rawData.taboola?.[`performanceBy${dimensionType}`]?.results ||
      [];
    taboolaData.forEach((item) => {
      const key =
        dimensionType === "Region"
          ? item.region
          : item[dimensionType.toLowerCase()] || "Unknown";
      const current = metrics.get(key) || {
        clicks: 0,
        impressions: 0,
        spent: 0,
        visible_impressions: 0,
      };

      current.clicks += Number(item.clicks) || 0;
      current.impressions += Number(item.impressions) || 0;
      current.spent += Number(item.spent) || 0;
      current.visible_impressions += Number(item.visible_impressions) || 0;

      metrics.set(key, current);
    });

    // Process Outbrain data
    const outbrainResults =
      campaign.rawData.outbrain?.data?.[
        `${dimensionType.toLowerCase()}Performance`
      ]?.results || [];
    outbrainResults.forEach((result) => {
      const key =
        dimensionType === "Region"
          ? result.metadata?.region
          : result.metadata?.name || result.metadata?.code || "Unknown";

      if (result.metrics) {
        const current = metrics.get(key) || {
          clicks: 0,
          impressions: 0,
          spent: 0,
          visible_impressions: 0,
        };

        current.clicks += Number(result.metrics.clicks) || 0;
        current.impressions += Number(result.metrics.impressions) || 0;
        current.spent += Number(result.metrics.spend) || 0;

        metrics.set(key, current);
      }
    });
  });

  return {
    last_used_rawdata_update_time: new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
      hour12: false,
    }),
    last_used_rawdata_update_time_gmt_millisec: Date.now(),
    timezone: "IST",
    results: Array.from(metrics.entries()).map(([key, data]) => ({
      [dimensionType.toLowerCase()]: key,
      ...data,
      ctr: data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0,
      cpc: data.clicks > 0 ? data.spent / data.clicks : 0,
    })),
  };
};

async function aggregateClientData(clientEmail, startDate, endDate) {
  let client;
  try {
    client = await getDb();

    // Log input parameters for debugging
    console.log(
      `Aggregating data for ${clientEmail} from ${startDate} to ${endDate}`
    );

    const clientData = await client
      .collection("clients")
      .findOne({ email: clientEmail });
    if (!clientData) throw new Error(`Client not found: ${clientEmail}`);

    console.log(`Found client: ${clientData.name}`);

    const clientMapping = await client.collection("campaignMappings").findOne({
      clientName: clientData.name,
    });
    if (!clientMapping) {
      throw new Error(
        `No campaign mappings found for client: ${clientData.name}`
      );
    }

    console.log(
      `Found campaign mappings with ${clientMapping.mappings.length} release orders`
    );

    const roResultsMap = {};

    for (const mapping of clientMapping.mappings) {
      const roNumber = mapping.roNumber;
      if (!roResultsMap[roNumber]) {
        roResultsMap[roNumber] = {
          roNumber,
          platforms: {
            taboola: { campaignResults: [] },
            dspOutbrain: { campaignResults: [] },
            mgid: { campaignResults: [] },
          },
        };
      }

      const taboolaCampaignIds = mapping.taboolaCampaignId || [];
      const dspOutbrainCampaignIds = mapping.dspOutbrainCampaignId || [];
      const mgidCampaignIds = mapping.mgidCampaignId || [];

      console.log(
        `RO ${roNumber}: Taboola=${taboolaCampaignIds.length}, DSP Outbrain=${dspOutbrainCampaignIds.length}, MGID=${mgidCampaignIds.length}`
      );

      // Process Taboola campaigns
      if (taboolaCampaignIds && taboolaCampaignIds.length > 0) {
        console.log(
          `Fetching Taboola campaigns: ${taboolaCampaignIds.join(", ")}`
        );

        try {
          const taboolaCampaigns = await client
            .collection("campaignperformances")
            .find({
              campaignId: { $in: taboolaCampaignIds },
            })
            .toArray(); // Convert cursor to array

          console.log(`Found ${taboolaCampaigns.length} Taboola campaigns`);

          for (const campaign of taboolaCampaigns) {
            const campaignId = campaign.campaignId;
            const existingIndex = roResultsMap[
              roNumber
            ].platforms.taboola.campaignResults.findIndex(
              (c) => c.campaignId === campaignId
            );
            if (existingIndex === -1) {
              // Add to results if not already present
              roResultsMap[roNumber].platforms.taboola.campaignResults.push(
                campaign
              );
              console.log(
                `Added Taboola campaign ${campaignId} to RO ${roNumber}`
              );
            }
          }
        } catch (err) {
          console.error(`Error fetching Taboola campaigns:`, err);
        }
      }

      // Process DSP Outbrain campaigns - FIX: moved outside of Taboola if block
      if (dspOutbrainCampaignIds && dspOutbrainCampaignIds.length > 0) {
        console.log(
          `Fetching DSP Outbrain campaigns: ${dspOutbrainCampaignIds.join(
            ", "
          )}`
        );

        try {
          // FIX: Updated query fields to match the schema
          const dspOutbrainCampaigns = await client
            .collection("dspOutbrainData")
            .find({
              campaignId: { $in: dspOutbrainCampaignIds },
            })
            .toArray(); // Convert cursor to array

          console.log(
            `Found ${dspOutbrainCampaigns.length} DSP Outbrain campaigns`
          );

          for (const campaign of dspOutbrainCampaigns) {
            const campaignId = campaign.campaignId;
            const existingIndex = roResultsMap[
              roNumber
            ].platforms.dspOutbrain.campaignResults.findIndex(
              (c) => c.campaignId === campaignId
            );
            if (existingIndex === -1) {
              // Add to results if not already present
              roResultsMap[roNumber].platforms.dspOutbrain.campaignResults.push(
                campaign
              );
              console.log(
                `Added DSP Outbrain campaign ${campaignId} to RO ${roNumber}`
              );
            }
          }
        } catch (err) {
          console.error(`Error fetching DSP Outbrain campaigns:`, err);
        }
      }

      // Process MGID campaigns
      // Process MGID campaigns
      if (mgidCampaignIds && mgidCampaignIds.length > 0) {
        console.log(`Fetching MGID campaigns: ${mgidCampaignIds.join(", ")}`);
        try {
          const mgidCampaigns = await client
            .collection("mgidData")
            .find({
              campaignId: { $in: mgidCampaignIds },
            })
            .toArray(); // Convert cursor to array

          console.log(`Found ${mgidCampaigns.length} MGID campaigns`);

          for (const campaign of mgidCampaigns) {
            const campaignId = campaign.campaignId;
            // Check if MGID platform exists in roResultsMap
            if (!roResultsMap[roNumber].platforms.mgid) {
              roResultsMap[roNumber].platforms.mgid = {
                campaignResults: [],
              };
            }

            // Now check in the correct platform (MGID) instead of Taboola
            const existingIndex = roResultsMap[
              roNumber
            ].platforms.mgid.campaignResults.findIndex(
              (c) => c.campaignId === campaignId
            );

            if (existingIndex === -1) {
              // Add to results if not already present
              roResultsMap[roNumber].platforms.mgid.campaignResults.push(
                campaign
              );
              console.log(
                `Added MGID campaign ${campaignId} to RO ${roNumber}`
              );
            }
          }
        } catch (err) {
          console.error(`Error fetching MGID campaigns:`, err);
        }
      }
    }

    const allRoResults = Object.values(roResultsMap);
    console.log(
      `Found ${allRoResults.length} unique ROs for client ${clientData.name}`
    );
    for (const ro of allRoResults) {
      console.log(
        `RO ${ro.roNumber}: ${ro.platforms.taboola.campaignResults.length} Taboola campaigns, ${ro.platforms.dspOutbrain.campaignResults.length} DSP Outbrain campaigns, ${ro.platforms.mgid.campaignResults.length} MGID campaigns`
      );
    }

    const aggregatedDocument = {
      name: clientData.name,
      email: clientData.email,
      phone: clientData.phone,
      startDate,
      endDate,
      releaseOrders: allRoResults,
      lastUpdated: new Date(),
    };

    console.log(`Updating aggregated data document for ${clientEmail}`);

    const result = await client
      .collection("aggregatedTableFromAllPlatforms")
      .updateOne(
        { email: clientEmail },
        { $set: aggregatedDocument },
        { upsert: true }
      );

    console.log(
      `Update result: ${result.matchedCount} matched, ${result.modifiedCount} modified, ${result.upsertedCount} upserted`
    );
    console.log(
      `Successfully aggregated data for client ${clientData.name} (${clientEmail})`
    );

    return aggregatedDocument;
  } catch (e) {
    console.error("Error in aggregating client data:", e);
    throw e; // Re-throw to propagate the error
  }
}

export default aggregateClientData;
