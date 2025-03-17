import { connectToMongo, getDb } from "../config/db.js";

const SITE_MAPPING = {
  // ABP Group
  "ABP - English ABP": "ABP",

  // Asianet Group
  "Asianet - Asianet English": "Asianet",
  "Datability India - Asianetnews": "Asianet",

  // Hindustan Times Group
  "Hindustan Times - Display Hindustan Times": "Hindustan Times",
  "Hindustan Times - Hindustan Times": "Hindustan Times",
  "Hindustan Times - Live Mint": "Live Mint",
  "Hindustan Times - SDK Android": "Hindustan Times",

  // Indian Express Group
  "IndianExpress - FinancialExpress": "Financial Express",
  "IndianExpress - IndianExpress": "Indian Express",
  "IndianExpress - Inuth": "Indian Express",
  "Izooto- Indian Express": "Indian Express",

  // India Today Group
  "IndiaToday - BusinessToday": "Business Today",
  "IndiaToday - BusinessToday AMP": "Business Today",
  "IndiaToday - India Today AMP": "Indian Today",
  "IndiaToday - IndiaToday": "Indian Today",
  "Indiatoday - IndiaToday App SDK IOS": "Indian Today",
  "Indiatoday - Indiatoday NE": "Indian Today",

  // Jagran Group
  "Izooto - Jagran Josh": "Jagran Josh",
  "Jagran New Media - Current Affairs SDK Android": "Jagran",
  "Jagran New Media - Her Zindagi English": "Jagran",
  "Jagran New Media - Inext": "Jagran",
  "Jagran New Media - Jagran English": "Jagran",
  "Jagran New Media - Jagran English Android SDK": "Jagran",
  "Jagran New Media - Jagran Josh": "Jagran",
  "Jagran New Media - Jagrantv.com": "Jagran",
  "Jagran New Media - Only my Health": "Jagran",

  // Lokmat Group
  "Lokmat - english.lokmat.com": "Lokmat",

  // Network 18 Group
  "Network 18 Media - Moneycontrol English": "Money Control",
  "Network 18 Media - News18English": "News18",

  // Sakshi Group
  "Sakshi - Education New": "Sakshi",
  "Sakshi - Sakshi Post": "Sakshi",

  // The Hindu Group
  "thehindu - hindu app android": "The Hindu",
  "thehindu - sportstar.thehindu.com": "The Hindu",
  "thehindu - thehindu.com": "The Hindu",
  "thehindu - thehindu.com - AMP": "The Hindu",
  "thehindu - thehindubusinessline.com": "The Hindu",
  "thehindu - thehindubusinessline.com - AMP": "The Hindu",

  // Times Group
  "Times Internet Limited -Economic Times": "Economics Times",

  // News9Live Group
  "TV9 - News9Live": "News9Live",

  // Zee Media Group
  "Zee media - Zeebiz.com": "Zee Media",
};

async function storeDailyMetricsForClient(
  clientEmail,
  specificRoNumber = null
) {
  let client;
  try {
    client = await getDb();

    // Step 1: Get client data
    console.log(`\nProcessing metrics for client: ${clientEmail}`);
    const clientData = await db
      .collection("clients")
      .findOne({ email: clientEmail });
    if (!clientData) throw new Error(`Client not found: ${clientEmail}`);
    console.log(`Found client: ${clientData.name}`);

    // Step 2: Get release orders
    const roQuery = specificRoNumber
      ? { clientEmail: clientEmail, roNumber: specificRoNumber }
      : { clientEmail: clientEmail };

    const releaseOrders = await client
      .collection("releaseOrders")
      .find(roQuery)
      .toArray();
    console.log(
      `Found ROs: ${releaseOrders.map((ro) => ro.roNumber).join(", ")}`
    );

    const results = [];
    // Process each RO separately
    for (const ro of releaseOrders) {
      // Step 3: Get all campaigns for this RO
      const campaigns = await client
        .collection("campaigns")
        .find({ roNumber: ro.roNumber })
        .toArray();

      console.log(`\nProcessing RO ${ro.roNumber}`);
      console.log(
        `Found campaigns: ${campaigns.map((c) => c.campaignId).join(", ")}`
      );

      if (campaigns.length > 0) {
        // Process all campaigns for this RO
        const processedData = await processRoCampaigns(
          db,
          campaigns,
          ro,
          clientData
        );
        await client
          .collection("clientDailyMetrics")
          .updateOne(
            { clientEmail, roNumber: ro.roNumber },
            { $set: processedData },
            { upsert: true }
          );
        results.push(processedData);
      }
    }

    return results;
  } finally {
    if (client) await client.close();
  }
}

async function processRoCampaigns(db, campaigns, ro, clientData) {
  const dateRange = getDateRange(campaigns);
  console.log(
    `\nProcessing date range: ${dateRange.startDate} to ${dateRange.endDate}`
  );

  const dailyMetrics = {};
  const dimensionMetrics = {
    performanceByBrowser: {},
    performanceByOS: {},
    performanceByRegion: {},
    performanceByCountry: {},
    performanceBySite: {},
  };

  // Initialize metrics structure
  for (
    let date = new Date(dateRange.startDate);
    date <= new Date(dateRange.endDate);
    date.setDate(date.getDate() + 1)
  ) {
    const dateStr = date.toISOString().split("T")[0];
    dailyMetrics[dateStr] = {
      clicks: 0,
      impressions: 0,
      spent: 0,
      platforms: new Set(),
      platformData: {
        taboola: { clicks: 0, impressions: 0, spent: 0 },
        mgid: { clicks: 0, impressions: 0, spent: 0 },
        outbrain: { clicks: 0, impressions: 0, spent: 0 },
        dv360: { clicks: 0, impressions: 0, spent: 0 },
      },
    };
  }

  // First, collect all platform data
  const platformData = {
    taboola: [],
    mgid: [],
    outbrain: [],
    dv360: [],
  };

  // Gather all campaign data
  for (const campaign of campaigns) {
    console.log(`\nFetching data for campaign ${campaign.campaignId}`);

    const [taboola, outbrain, mgid, dv360] = await Promise.all([
      client
        .collection("taboolaData")
        .find({ campaignId: campaign.campaignId })
        .toArray(),

      client
        .collection("outbrainNewDataFormat")
        .find({ campaignId: campaign.campaignId })
        .toArray(),
      client
        .collection("mgid_transformed_data")
        .find({ campaignId: campaign.campaignId })
        .toArray(),
      client
        .collection("dv360Data")
        .find({ campaignId: campaign.campaignId })
        .toArray(),
    ]);

    platformData.taboola.push(...taboola);
    platformData.mgid.push(...mgid);
    platformData.outbrain.push(...outbrain);
    platformData.dv360.push(...dv360);
  }

  // Process each date's data from all campaigns
  for (const dateStr in dailyMetrics) {
    const metrics = dailyMetrics[dateStr];

    // Process Taboola data
    console.log(`\nProcessing Taboola data for date ${dateStr}`);
    let taboolaTotalClicks = 0;
    let taboolaTotalImpressions = 0;
    let taboolaTotalSpent = 0;

    for (const doc of platformData.taboola) {
      if (!doc?.campaignPerformanceResult?.results?.[0]) continue;

      const result = doc.campaignPerformanceResult.results[0];
      if (!result.date) continue;

      const docDate = result.date.split(" ")[0]; // Strip time part
      const formattedDate = formatDate(docDate);

      if (formattedDate === dateStr) {
        const clicks = getNumber(result.clicks);
        const impressions = getNumber(result.impressions);
        const spent = getNumber(result.spent);

        console.log(
          `Campaign ${doc.campaignId}: clicks=${clicks}, impressions=${impressions}, spent=${spent}`
        );

        taboolaTotalClicks += clicks;
        taboolaTotalImpressions += impressions;
        taboolaTotalSpent += spent;
      }
    }

    if (taboolaTotalClicks > 0 || taboolaTotalImpressions > 0) {
      metrics.platforms.add("taboola");
      metrics.platformData.taboola = {
        clicks: taboolaTotalClicks,
        impressions: taboolaTotalImpressions,
        spent: taboolaTotalSpent,
      };
      console.log(
        `Taboola totals for ${dateStr}: clicks=${taboolaTotalClicks}, impressions=${taboolaTotalImpressions}, spent=${taboolaTotalSpent}`
      );
    }

    // Process MGID data
    for (const doc of platformData.mgid) {
      if (!doc?.campaignPerformanceResult?.results?.[1]) continue;
      const result = doc.campaignPerformanceResult.results[1];
      if (!result.date) continue;
      const docDate = formatDate(result.date);

      if (docDate === dateStr) {
        metrics.platforms.add("mgid");
        metrics.platformData.mgid.clicks += getNumber(result.clicks);
        metrics.platformData.mgid.impressions += getNumber(result.impressions);
        metrics.platformData.mgid.spent += getNumber(result.spent);
      }
    }

    // Process Outbrain data
    for (const doc of platformData.outbrain) {
      if (!doc?.campaignPerformanceResult?.results?.[0]) continue;
      const result = doc.campaignPerformanceResult.results[0];
      const docDate = formatDate(result.date);

      if (docDate === dateStr) {
        metrics.platforms.add("outbrain");
        metrics.platformData.outbrain.clicks += getNumber(result.clicks);
        metrics.platformData.outbrain.impressions += getNumber(
          result.impressions
        );
        metrics.platformData.outbrain.spent += getNumber(
          result.spend || result.spent
        );
      }
    }

    // Process DV360 data
    for (const doc of platformData.dv360) {
      if (!doc?.campaignPerformanceResult?.results?.[0]) continue;
      const result = doc.campaignPerformanceResult.results[0];
      const docDate = formatDate(result.date);

      if (docDate === dateStr) {
        metrics.platforms.add("dv360");
        metrics.platformData.dv360.clicks += getNumber(result.total_clicks);
        metrics.platformData.dv360.impressions += getNumber(
          result.total_impressions
        );
        metrics.platformData.dv360.spent += getNumber(result.total_cost);
      }
    }

    // Calculate daily totals
    metrics.clicks = 0;
    metrics.impressions = 0;
    metrics.spent = 0;

    // Sum up platform totals
    Object.entries(metrics.platformData).forEach(([platform, data]) => {
      if (data.clicks > 0 || data.impressions > 0) {
        metrics.clicks += data.clicks;
        metrics.impressions += data.impressions;
        metrics.spent += data.spent;
      } else {
        delete metrics.platformData[platform];
      }
    });

    // Log verification
    console.log(`\n=== ${dateStr} Platform Totals ===`);
    Object.entries(metrics.platformData).forEach(([platform, data]) => {
      console.log(
        `${platform}: ${data.clicks} clicks, ${data.impressions} impressions, ${data.spent} spent`
      );
    });
    console.log(
      `Total: ${metrics.clicks} clicks, ${metrics.impressions} impressions, ${metrics.spent} spent`
    );
  }

  // Process dimension metrics
  processTaboolaSitePerformance(
    dimensionMetrics.performanceBySite,
    platformData.taboola
  );
  processMgidSitePerformance(
    dimensionMetrics.performanceBySite,
    platformData.mgid
  );
  processDimensionMetrics(dimensionMetrics, "taboola", platformData.taboola);
  processDimensionMetrics(dimensionMetrics, "mgid", platformData.mgid);
  processDimensionMetrics(dimensionMetrics, "outbrain", platformData.outbrain);
  processDimensionMetrics(dimensionMetrics, "dv360", platformData.dv360);

  return {
    roNumber: ro.roNumber,
    clientEmail: clientData.email,
    clientName: clientData.name,
    startDate: new Date(dateRange.startDate),
    endDate: new Date(dateRange.endDate),
    lastUpdated: new Date(),
    dailyMetrics: Object.entries(dailyMetrics)
      .map(([date, metrics]) => ({
        date: new Date(date),
        clicks: metrics.clicks,
        impressions: metrics.impressions,
        spent: metrics.spent,
        platforms: Array.from(metrics.platforms),
        platformData: metrics.platformData,
      }))
      .sort((a, b) => a.date - b.date),
    ...formatDimensionMetrics(dimensionMetrics),
  };
}

function calculateMetrics(metrics) {
  metrics.ctr =
    metrics.impressions > 0 ? (metrics.clicks / metrics.impressions) * 100 : 0;
  metrics.cpc = metrics.clicks > 0 ? metrics.spent / metrics.clicks : 0;
}

function processTaboolaSitePerformance(siteMetrics, taboolaData) {
  console.log("\nProcessing Taboola Site Performance Data");

  taboolaData.forEach((doc) => {
    if (doc?.performanceBySite?.results) {
      console.log(`Processing document for campaign: ${doc.campaignId}`);

      doc.performanceBySite.results.forEach((site) => {
        const siteName = site.site_name;
        if (!siteName) return;

        // Get mapped site name
        const mappedSiteName = SITE_MAPPING[siteName] || siteName;
        console.log(`Mapping site: ${siteName} -> ${mappedSiteName}`);

        // Initialize metrics if not exists
        if (!siteMetrics[mappedSiteName]) {
          siteMetrics[mappedSiteName] = {
            site_name: mappedSiteName,
            clicks: 0,
            impressions: 0,
            visible_impressions: 0,
            spent: 0,
            ctr: 0,
            cpc: 0,
            vctr: 0,
            platforms: ["taboola"], // Initialize as array instead of Set
            platform_data: {
              taboola: {
                clicks: 0,
                impressions: 0,
                visible_impressions: 0,
                spent: 0,
              },
            },
          };
        } else if (!siteMetrics[mappedSiteName].platforms.includes("taboola")) {
          // Add platform if not already present
          siteMetrics[mappedSiteName].platforms.push("taboola");
          siteMetrics[mappedSiteName].platform_data.taboola = {
            clicks: 0,
            impressions: 0,
            visible_impressions: 0,
            spent: 0,
          };
        }

        // Aggregate metrics
        const metrics = siteMetrics[mappedSiteName];
        const platformData = metrics.platform_data.taboola;

        // Add current document's metrics
        const newClicks = getNumber(site.clicks);
        const newImpressions = getNumber(site.impressions);
        const newVisibleImpressions = getNumber(site.visible_impressions);
        const newSpent = getNumber(site.spent);

        // Update platform-specific data
        platformData.clicks += newClicks;
        platformData.impressions += newImpressions;
        platformData.visible_impressions += newVisibleImpressions;
        platformData.spent += newSpent;

        // Update total metrics
        metrics.clicks += newClicks;
        metrics.impressions += newImpressions;
        metrics.visible_impressions += newVisibleImpressions;
        metrics.spent += newSpent;

        console.log(`Updated metrics for ${mappedSiteName}:`, {
          total_clicks: metrics.clicks,
          total_impressions: metrics.impressions,
          total_spent: metrics.spent,
        });
      });
    }
  });
}

function processMgidSitePerformance(siteMetrics, mgidData) {
  console.log("\nProcessing MGID Site Performance Data");

  mgidData.forEach((doc) => {
    if (doc?.performanceByDomain) {
      console.log(`Processing document for campaign: ${doc.campaignId}`);

      Object.entries(doc.performanceByDomain).forEach(([date, sites]) => {
        console.log(`Processing data for date: ${date}`);

        sites.forEach((siteData) => {
          const siteName = siteData.site || siteData._id?.$oid || "Unknown";
          const mappedSiteName = SITE_MAPPING[siteName] || siteName;

          console.log(`Mapping site: ${siteName} -> ${mappedSiteName}`);

          // Initialize metrics if not exists
          if (!siteMetrics[mappedSiteName]) {
            siteMetrics[mappedSiteName] = {
              site_name: mappedSiteName,
              clicks: 0,
              impressions: 0,
              visible_impressions: 0,
              spent: 0,
              ctr: 0,
              cpc: 0,
              platforms: ["mgid"], // Initialize as array instead of Set
              platform_data: {
                mgid: {
                  clicks: 0,
                  impressions: 0,
                  spent: 0,
                },
              },
            };
          } else if (!siteMetrics[mappedSiteName].platforms.includes("mgid")) {
            // Add platform if not already present
            siteMetrics[mappedSiteName].platforms.push("mgid");
            siteMetrics[mappedSiteName].platform_data.mgid = {
              clicks: 0,
              impressions: 0,
              spent: 0,
            };
          }

          // Get current metrics
          const metrics = siteMetrics[mappedSiteName];
          const platformData = metrics.platform_data.mgid;

          // Add current document's metrics
          const newClicks = getNumber(siteData.Clicks);
          const newSpent = getNumber(
            siteData["Spent, INR"]?.replace(/[^0-9.]/g, "")
          );

          // Update platform-specific data
          platformData.clicks += newClicks;
          platformData.spent += newSpent;

          // Update total metrics
          metrics.clicks += newClicks;
          metrics.spent += newSpent;

          console.log(`Updated metrics for ${mappedSiteName}:`, {
            total_clicks: metrics.clicks,
            total_spent: metrics.spent,
          });
        });
      });
    }
  });

  // Calculate final metrics
  Object.values(siteMetrics).forEach((metrics) => {
    // Calculate CTR only if impressions exist
    if (metrics.impressions > 0) {
      metrics.ctr = (metrics.clicks / metrics.impressions) * 100;
    }

    // Calculate CPC if there are clicks
    if (metrics.clicks > 0) {
      metrics.cpc = metrics.spent / metrics.clicks;
    }

    // Calculate vCTR if visible impressions exist
    if (metrics.visible_impressions > 0) {
      metrics.vctr = (metrics.clicks / metrics.visible_impressions) * 100;
    }
  });
}

function processDimensionMetrics(dimensionMetrics, platform, documents) {
  documents.forEach((doc) => {
    // Process Browser metrics
    if (doc.performanceByBrowser) {
      processBrowserMetrics(
        dimensionMetrics.performanceByBrowser,
        doc.performanceByBrowser,
        platform
      );
    }

    // Process OS metrics
    if (doc.performanceByOS) {
      processOSMetrics(
        dimensionMetrics.performanceByOS,
        doc.performanceByOS,
        platform
      );
    }

    // Process Region metrics
    if (doc.performanceByRegion) {
      processRegionMetrics(
        dimensionMetrics.performanceByRegion,
        doc.performanceByRegion,
        platform
      );
    }
  });
}

function processOSMetrics(osMetrics, data, platform) {
  const metrics =
    platform === "mgid"
      ? Object.values(data).flat().filter(Boolean)
      : Array.isArray(data)
      ? data.filter(Boolean)
      : Object.values(data).flat().filter(Boolean);

  metrics.forEach((metric) => {
    const osName = mapOperatingSystem(
      metric["Operating system"] || metric.os_family
    );
    if (!osMetrics[osName]) {
      osMetrics[osName] = {
        os_family: osName,
        clicks: 0,
        impressions: 0,
        spent: 0,
        visible_impressions: 0,
        platform: "DESK",
        platform_name: "Desktop",
      };
    }

    osMetrics[osName].clicks += getNumber(metric.clicks || metric.Clicks);
    osMetrics[osName].impressions += getNumber(metric.impressions);
    osMetrics[osName].spent += getNumber(metric.spent || metric["Spent, INR"]);
    osMetrics[osName].visible_impressions += getNumber(
      metric.visible_impressions || 0
    );
  });
}

function processRegionMetrics(regionMetrics, data, platform) {
  if (platform === "taboola") {
    // Initialize with Taboola data first
    if (data.results) {
      data.results.forEach((item) => {
        const regionName = standardizeRegionName(item.region);
        if (!regionName) return;

        regionMetrics[regionName] = {
          region: regionName,
          country: "India",
          country_code: "IN",
          clicks: getNumber(item.clicks),
          impressions: getNumber(item.impressions),
          spent: getNumber(item.spent),
          platform_data: {
            taboola: {
              clicks: getNumber(item.clicks),
              impressions: getNumber(item.impressions),
              spent: getNumber(item.spent),
            },
          },
          platforms: ["taboola"],
        };
      });
    }
    return;
  }

  // For other platforms, only add data if region exists in Taboola data
  const metrics = [];

  switch (platform) {
    case "mgid":
      Object.values(data).forEach((dateData) => {
        if (Array.isArray(dateData)) {
          metrics.push(
            ...dateData.map((item) => ({
              region: standardizeRegionName(item.State),
              clicks: getNumber(item.Clicks),
              impressions: 0,
              spent: getNumber(item["Spent, INR"]?.replace(/[^0-9.]/g, "")),
              platform: "mgid",
            }))
          );
        }
      });
      break;

    case "outbrain":
      if (Array.isArray(data)) {
        metrics.push(
          ...data.map((item) => ({
            region: standardizeRegionName(item.region || item.Region),
            clicks: getNumber(item.clicks),
            impressions: getNumber(item.impressions),
            spent: getNumber(item.spend || item.spent),
            platform: "outbrain",
          }))
        );
      }
      break;

    case "dv360":
      if (Array.isArray(data)) {
        metrics.push(
          ...data.map((item) => ({
            region: standardizeRegionName(item.region || item.Region),
            clicks: getNumber(item.clicks || item.total_clicks),
            impressions: getNumber(item.impressions || item.total_impressions),
            spent: getNumber(item.spent || item.total_cost),
            platform: "dv360",
          }))
        );
      }
      break;
  }

  // Only process regions that exist in Taboola data
  metrics.forEach((metric) => {
    const regionName = metric.region;
    if (!regionName || !regionMetrics[regionName]) return;

    // Update total metrics
    regionMetrics[regionName].clicks += metric.clicks;
    regionMetrics[regionName].impressions += metric.impressions;
    regionMetrics[regionName].spent += metric.spent;

    // Update platform-specific data
    if (!regionMetrics[regionName].platform_data[metric.platform]) {
      regionMetrics[regionName].platform_data[metric.platform] = {
        clicks: metric.clicks,
        impressions: metric.impressions,
        spent: metric.spent,
      };
      regionMetrics[regionName].platforms.push(metric.platform);
    } else {
      regionMetrics[regionName].platform_data[metric.platform].clicks +=
        metric.clicks;
      regionMetrics[regionName].platform_data[metric.platform].impressions +=
        metric.impressions;
      regionMetrics[regionName].platform_data[metric.platform].spent +=
        metric.spent;
    }
  });

  // Calculate metrics for each region
  Object.values(regionMetrics).forEach((region) => {
    region.ctr =
      region.impressions > 0 ? (region.clicks / region.impressions) * 100 : 0;
    region.cpc = region.clicks > 0 ? region.spent / region.clicks : 0;
  });
}

const standardizeRegionName = (region) => {
  if (!region) return "";

  const regionMappings = {
    UP: "Uttar Pradesh",
    "Tamil Nadu": "Tamil Nadu",
    TN: "Tamil Nadu",
    Maharashtra: "Maharashtra",
    MH: "Maharashtra",
    Karnataka: "Karnataka",
    KA: "Karnataka",
    Delhi: "Delhi",
    NCR: "Delhi",
    Kerala: "Kerala",
    KL: "Kerala",
    Gujarat: "Gujarat",
    GJ: "Gujarat",
    "West Bengal": "West Bengal",
    WB: "West Bengal",
  };

  return regionMappings[region] || region.trim();
};

function processTaboolaData(taboola, dateStr) {
  let metrics = null;

  for (const doc of taboola) {
    if (doc?.campaignPerformanceResult?.results?.[0]) {
      const result = doc.campaignPerformanceResult.results[0];
      const docDateStr = formatDate(result.date);

      if (docDateStr === dateStr) {
        if (!metrics) {
          metrics = { clicks: 0, impressions: 0, spent: 0 };
        }
        metrics.clicks += getNumber(result.clicks);
        metrics.impressions += getNumber(result.impressions);
        metrics.spent += getNumber(result.spent);
      }
    }
  }

  return metrics;
}

function processMgidData(mgid, dateStr) {
  let metrics = null;

  for (const doc of mgid) {
    if (doc?.campaignPerformanceResult?.results?.[1]) {
      // Note: Using index 1 for MGID
      const result = doc.campaignPerformanceResult.results[1];
      if (!result.date) continue;

      const docDateStr = formatDate(result.date);
      if (docDateStr === dateStr) {
        if (!metrics) {
          metrics = { clicks: 0, impressions: 0, spent: 0 };
        }
        metrics.clicks += getNumber(result.clicks);
        metrics.impressions += getNumber(result.impressions);
        metrics.spent += getNumber(result.spent);
      }
    }
  }

  return metrics;
}

function processOutbrainData(outbrain, dateStr) {
  let metrics = null;

  for (const doc of outbrain) {
    if (doc?.campaignPerformanceResult?.results?.[0]) {
      const result = doc.campaignPerformanceResult.results[0];
      const docDateStr = formatDate(result.date);

      if (docDateStr === dateStr) {
        if (!metrics) {
          metrics = { clicks: 0, impressions: 0, spent: 0 };
        }
        metrics.clicks += getNumber(result.clicks);
        metrics.impressions += getNumber(result.impressions);
        metrics.spent += getNumber(result.spend || result.spent);
      }
    }
  }

  return metrics;
}

function processDV360Data(dv360, dateStr) {
  let metrics = null;

  for (const doc of dv360) {
    if (doc?.campaignPerformanceResult?.results?.[0]) {
      const result = doc.campaignPerformanceResult.results[0];
      const docDateStr = formatDate(result.date);

      if (docDateStr === dateStr) {
        if (!metrics) {
          metrics = { clicks: 0, impressions: 0, spent: 0 };
        }
        metrics.clicks += getNumber(result.total_clicks);
        metrics.impressions += getNumber(result.total_impressions);
        metrics.spent += getNumber(result.total_cost);
      }
    }
  }

  return metrics;
}

function mapBrowserName(browser) {
  if (!browser) return "Other";
  const name = browser.toLowerCase();
  if (name.includes("chrome")) return "Chrome";
  if (name.includes("firefox")) return "Firefox";
  if (name.includes("safari")) return "Safari";
  if (name.includes("edge")) return "Edge";
  if (name.includes("opera")) return "Opera";
  if (name.includes("explorer")) return "Internet Explorer";
  return "Other";
}

function mapOperatingSystem(os) {
  if (!os) return "Other";
  const name = os.toLowerCase();
  if (name.includes("windows")) return "Windows";
  if (name.includes("mac") || name.includes("ios")) return "Mac OS X";
  if (name.includes("android")) return "Android";
  if (name.includes("linux")) return "Linux";
  return "Other";
}

function getNumber(value) {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    // Remove any non-numeric characters except decimal point
    const cleanValue = value.replace(/[^0-9.-]+/g, "");
    return cleanValue.includes(".")
      ? parseFloat(cleanValue)
      : parseInt(cleanValue) || 0;
  }
  return 0;
}

function getDateRange(campaigns) {
  const allDates = campaigns
    .flatMap((c) => [new Date(c.startDate), new Date(c.endDate)])
    .filter((d) => !isNaN(d.getTime()));

  return {
    startDate: new Date(Math.min(...allDates)).toISOString().split("T")[0],
    endDate: new Date(Math.max(...allDates)).toISOString().split("T")[0],
  };
}

function formatDimensionMetrics(metrics) {
  return {
    performanceByBrowser: Object.values(metrics.performanceByBrowser)
      .filter((m) => m.clicks > 0 || m.impressions > 0)
      .map((m) => ({
        ...m,
        ctr: m.impressions > 0 ? (m.clicks / m.impressions) * 100 : 0,
        cpc: m.clicks > 0 ? m.spent / m.clicks : 0,
      })),
    performanceByOS: Object.values(metrics.performanceByOS)
      .filter((m) => m.clicks > 0 || m.impressions > 0)
      .map((m) => ({
        ...m,
        ctr: m.impressions > 0 ? (m.clicks / m.impressions) * 100 : 0,
        cpc: m.clicks > 0 ? m.spent / m.clicks : 0,
      })),
    performanceByRegion: Object.values(metrics.performanceByRegion).filter(
      (m) => m.clicks > 0 || m.impressions > 0
    ),
    performanceByCountry: [],
    performanceBySite: Object.values(metrics.performanceBySite)
      .filter((m) => m.clicks > 0 || m.spent > 0)
      .map((m) => ({
        ...m,
        ctr: m.impressions > 0 ? (m.clicks / m.impressions) * 100 : 0,
        cpc: m.clicks > 0 ? m.spent / m.clicks : 0,
      })),
  };
}

function formatDate(dateStr) {
  if (!dateStr) return null;

  try {
    // Handle MGID date format (DD/MM/YYYY)
    if (dateStr.includes("/")) {
      const [day, month, year] = dateStr.split("/");
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }

    // Handle other date formats
    const date = new Date(dateStr);
    return date.toISOString().split("T")[0];
  } catch (error) {
    console.error(`Error formatting date: ${dateStr}`, error);
    return null;
  }
}

function processBrowserMetrics(browserMetrics, data, platform) {
  const metrics =
    platform === "mgid"
      ? Object.values(data).flat().filter(Boolean)
      : Array.isArray(data)
      ? data.filter(Boolean)
      : Object.values(data).flat().filter(Boolean);

  metrics.forEach((metric) => {
    const browserName = mapBrowserName(metric.Browser || metric.browser);
    if (!browserMetrics[browserName]) {
      browserMetrics[browserName] = {
        browser: browserName,
        clicks: 0,
        impressions: 0,
        spent: 0,
        visible_impressions: 0,
        platform: "DESK",
        platform_name: "Desktop",
      };
    }

    browserMetrics[browserName].clicks += getNumber(
      metric.clicks || metric.Clicks
    );
    browserMetrics[browserName].impressions += getNumber(metric.impressions);
    browserMetrics[browserName].spent += getNumber(
      metric.spent || metric["Spent, INR"]
    );
    browserMetrics[browserName].visible_impressions += getNumber(
      metric.visible_impressions || 0
    );
  });
}

async function testWithRealData() {
  let client;
  try {
    client = await getDb();
    const clientEmail = "test@gmail.com";

    console.log("\n=== Starting Data Integrity Test ===");
    console.log(`Testing for client: ${clientEmail}`);

    // Store and get metrics
    const results = await storeDailyMetricsForClient(clientEmail);

    for (const ro of results) {
      console.log(`\n=== Testing RO: ${ro.roNumber} ===`);

      // Get all campaigns for this RO
      const campaigns = await client
        .db("campaignAnalytics")
        .collection("campaigns")
        .find({ roNumber: ro.roNumber })
        .toArray();

      console.log(
        `Found campaigns: ${campaigns.map((c) => c.campaignId).join(", ")}`
      );

      // Get all platform data for these campaigns
      const platformData = await getAllPlatformData(client, campaigns);

      // Test daily metrics
      console.log("\n--- Daily Metrics Verification ---");
      await testDailyMetrics(ro.dailyMetrics, platformData);

      // Test site performance
      console.log("\n--- Site Performance Verification ---");
      await testSitePerformance(ro.performanceBySite, platformData);
    }

    return true;
  } catch (error) {
    console.error("Test failed:", error);
    throw error;
  } finally {
    if (client) await client.close();
  }
}

async function getAllPlatformData(client, campaigns) {
  const campaignIds = campaigns.map((c) => c.campaignId);

  const [taboola, outbrain, mgid, dv360] = await Promise.all([
    client
      .collection("taboolaData")
      .find({ campaignId: { $in: campaignIds } })
      .toArray(),
    client
      .collection("outbrainNewDataFormat")
      .find({ campaignId: { $in: campaignIds } })
      .toArray(),
    client
      .collection("mgid_transformed_data_final")
      .find({ campaignId: { $in: campaignIds } })
      .toArray(),
    client
      .collection("dv360Data")
      .find({ campaignId: { $in: campaignIds } })
      .toArray(),
  ]);

  return { taboola, outbrain, mgid, dv360 };
}

async function testDailyMetrics(storedMetrics, platformData) {
  for (const dayMetrics of storedMetrics) {
    const date = dayMetrics.date.toISOString().split("T")[0];
    console.log(`\nTesting metrics for date: ${date}`);

    // Calculate expected metrics
    const expected = {
      taboola: calculateTaboolaMetrics(platformData.taboola, date),
      mgid: calculateMgidMetrics(platformData.mgid, date),
      outbrain: calculateOutbrainMetrics(platformData.outbrain, date),
      dv360: calculateDV360Metrics(platformData.dv360, date),
    };

    // Compare with stored metrics
    for (const [platform, metrics] of Object.entries(dayMetrics.platformData)) {
      const expectedMetrics = expected[platform];
      console.log(`\n${platform.toUpperCase()} Comparison:`);
      console.log("Stored:", metrics);
      console.log("Expected:", expectedMetrics);

      if (Math.abs(metrics.clicks - expectedMetrics.clicks) > 0) {
        console.error(
          `❌ Clicks mismatch for ${platform}: stored=${metrics.clicks}, expected=${expectedMetrics.clicks}`
        );
      }
      if (Math.abs(metrics.impressions - expectedMetrics.impressions) > 0) {
        console.error(
          `❌ Impressions mismatch for ${platform}: stored=${metrics.impressions}, expected=${expectedMetrics.impressions}`
        );
      }
      if (Math.abs(metrics.spent - expectedMetrics.spent) > 1) {
        console.error(
          `❌ Spent mismatch for ${platform}: stored=${metrics.spent}, expected=${expectedMetrics.spent}`
        );
      }
    }

    // Verify totals
    const expectedTotal = {
      clicks: Object.values(expected).reduce((sum, m) => sum + m.clicks, 0),
      impressions: Object.values(expected).reduce(
        (sum, m) => sum + m.impressions,
        0
      ),
      spent: Object.values(expected).reduce((sum, m) => sum + m.spent, 0),
    };

    console.log("\nTotal Metrics Comparison:");
    console.log("Stored:", {
      clicks: dayMetrics.clicks,
      impressions: dayMetrics.impressions,
      spent: dayMetrics.spent,
    });
    console.log("Expected:", expectedTotal);

    if (Math.abs(dayMetrics.clicks - expectedTotal.clicks) > 0) {
      console.error(
        `❌ Total clicks mismatch: stored=${dayMetrics.clicks}, expected=${expectedTotal.clicks}`
      );
    }
    if (Math.abs(dayMetrics.impressions - expectedTotal.impressions) > 0) {
      console.error(
        `❌ Total impressions mismatch: stored=${dayMetrics.impressions}, expected=${expectedTotal.impressions}`
      );
    }
    if (Math.abs(dayMetrics.spent - expectedTotal.spent) > 1) {
      console.error(
        `❌ Total spent mismatch: stored=${dayMetrics.spent}, expected=${expectedTotal.spent}`
      );
    }
  }
}

function calculateTaboolaMetrics(taboolaData, date) {
  const metrics = { clicks: 0, impressions: 0, spent: 0 };

  for (const doc of taboolaData) {
    if (!doc?.campaignPerformanceResult?.results?.[0]) continue;
    const result = doc.campaignPerformanceResult.results[0];
    const docDate = formatDate(result.date);

    if (docDate === date) {
      metrics.clicks += getNumber(result.clicks);
      metrics.impressions += getNumber(result.impressions);
      metrics.spent += getNumber(result.spent);
    }
  }

  return metrics;
}

function calculateMgidMetrics(mgidData, date) {
  const metrics = { clicks: 0, impressions: 0, spent: 0 };

  for (const doc of mgidData) {
    if (!doc?.campaignPerformanceResult?.results?.[1]) continue;
    const result = doc.campaignPerformanceResult.results[1];
    if (!result.date) continue;
    const docDate = formatDate(result.date);

    if (docDate === date) {
      metrics.clicks += getNumber(result.clicks);
      metrics.impressions += getNumber(result.impressions);
      metrics.spent += getNumber(result.spent);
    }
  }

  return metrics;
}

function calculateOutbrainMetrics(outbrainData, date) {
  const metrics = { clicks: 0, impressions: 0, spent: 0 };

  for (const doc of outbrainData) {
    if (!doc?.campaignPerformanceResult?.results?.[0]) continue;
    const result = doc.campaignPerformanceResult.results[0];
    const docDate = formatDate(result.date);

    if (docDate === date) {
      metrics.clicks += getNumber(result.clicks);
      metrics.impressions += getNumber(result.impressions);
      metrics.spent += getNumber(result.spend || result.spent);
    }
  }

  return metrics;
}

function calculateDV360Metrics(dv360Data, date) {
  const metrics = { clicks: 0, impressions: 0, spent: 0 };

  for (const doc of dv360Data) {
    if (!doc?.campaignPerformanceResult?.results?.[0]) continue;
    const result = doc.campaignPerformanceResult.results[0];
    const docDate = formatDate(result.date);

    if (docDate === date) {
      metrics.clicks += getNumber(result.total_clicks);
      metrics.impressions += getNumber(result.total_impressions);
      metrics.spent += getNumber(result.total_cost);
    }
  }

  return metrics;
}

async function testSitePerformance(storedSiteMetrics, platformData) {
  // Calculate expected site metrics
  const expectedSiteMetrics = {};

  // Process Taboola site data
  for (const doc of platformData.taboola) {
    if (!doc?.performanceBySite?.results) continue;

    doc.performanceBySite.results.forEach((site) => {
      const siteName = SITE_MAPPING[site.site_name] || site.site_name;
      if (!expectedSiteMetrics[siteName]) {
        expectedSiteMetrics[siteName] = {
          clicks: 0,
          impressions: 0,
          spent: 0,
          platforms: new Set(["taboola"]),
        };
      }

      expectedSiteMetrics[siteName].clicks += getNumber(site.clicks);
      expectedSiteMetrics[siteName].impressions += getNumber(site.impressions);
      expectedSiteMetrics[siteName].spent += getNumber(site.spent);
    });
  }

  // Process MGID site data
  for (const doc of platformData.mgid) {
    if (!doc?.performanceByDomain) continue;

    Object.values(doc.performanceByDomain).forEach((sites) => {
      sites.forEach((site) => {
        const siteName =
          SITE_MAPPING[site.site || site._id?.$oid] ||
          site.site ||
          site._id?.$oid ||
          "Unknown";
        if (!expectedSiteMetrics[siteName]) {
          expectedSiteMetrics[siteName] = {
            clicks: 0,
            impressions: 0,
            spent: 0,
            platforms: new Set(["mgid"]),
          };
        }

        expectedSiteMetrics[siteName].clicks += getNumber(site.Clicks);
        expectedSiteMetrics[siteName].spent += getNumber(
          site["Spent, INR"]?.replace(/[^0-9.]/g, "")
        );
        expectedSiteMetrics[siteName].platforms.add("mgid");
      });
    });
  }

  // Compare with stored metrics
  for (const [siteName, storedMetrics] of Object.entries(storedSiteMetrics)) {
    console.log(`\nTesting site: ${siteName}`);
    const expectedMetrics = expectedSiteMetrics[siteName] || {
      clicks: 0,
      impressions: 0,
      spent: 0,
      platforms: new Set(),
    };

    console.log("Stored:", storedMetrics);
    console.log("Expected:", expectedMetrics);

    if (Math.abs(storedMetrics.clicks - expectedMetrics.clicks) > 0) {
      console.error(
        `❌ Site clicks mismatch for ${siteName}: stored=${storedMetrics.clicks}, expected=${expectedMetrics.clicks}`
      );
    }
    if (Math.abs(storedMetrics.impressions - expectedMetrics.impressions) > 0) {
      console.error(
        `❌ Site impressions mismatch for ${siteName}: stored=${storedMetrics.impressions}, expected=${expectedMetrics.impressions}`
      );
    }
    if (Math.abs(storedMetrics.spent - expectedMetrics.spent) > 1) {
      console.error(
        `❌ Site spent mismatch for ${siteName}: stored=${storedMetrics.spent}, expected=${expectedMetrics.spent}`
      );
    }
  }
}
// Similar functions for OS and Region metrics testing...

export { storeDailyMetricsForClient, testWithRealData };
