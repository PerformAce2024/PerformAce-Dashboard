import { connectToMongo, getDb } from "../config/db.js";

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

    const [clientData, releaseOrders] = await Promise.all([
      client.collection("clients").findOne({ email: clientEmail }),
      client
        .collection("releaseOrders")
        .find({ clientEmail: { $in: [clientEmail] } })
        .toArray(),
    ]);

    if (!clientData) throw new Error(`Client not found: ${clientEmail}`);

    const allCampaigns = [];
    for (const ro of releaseOrders) {
      const campaigns = await db
        .collection("campaigns")
        .find({ roName: ro.roNumber })
        .toArray();

      for (const campaign of campaigns) {
        const [taboolaData, outbrainData] = await Promise.all([
          client.collection("taboolaData").findOne({
            campaignId: campaign.campaignId,
            startDate: { $lte: endDate },
            endDate: { $gte: startDate },
          }),
          client.collection("outbrainNewDataFormat").findOne({
            campaignId: campaign.campaignId,
            "dateRange.from": startDate,
            "dateRange.to": endDate,
          }),
        ]);

        allCampaigns.push({
          campaignInfo: campaign,
          rawData: { taboola: taboolaData, outbrain: outbrainData },
        });
      }
    }

    const aggregatedDocument = {
      name: clientData.name,
      email: clientData.email,
      phone: clientData.phone,
      startDate,
      endDate,
      releaseOrders: releaseOrders.map((ro) => ro.roNumber),
      campaignPerformanceResult: aggregateCampaignMetrics(allCampaigns),
      performanceByBrowser: aggregateDimensionMetrics(allCampaigns, "Browser"),
      performanceByOS: aggregateDimensionMetrics(allCampaigns, "OS"),
      performanceByCountry: aggregateDimensionMetrics(allCampaigns, "Country"),
      performanceByRegion: aggregateDimensionMetrics(allCampaigns, "Region"),
      lastUpdated: new Date(),
    };

    await client
      .collection("aggregatedTableFromAllPlatforms")
      .updateOne(
        { email: clientEmail, startDate, endDate },
        { $set: aggregatedDocument },
        { upsert: true }
      );

    return aggregatedDocument;
  } catch (e) {
    console.log("Error in creating", e);
  }
}

export default aggregateClientData;
