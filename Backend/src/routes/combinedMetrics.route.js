// Backend/src/routes/combinedMetrics.route.js
import express from "express";
import CombinedTotalRepo from "../repo/combinedTotalRepo.js";
import CombinedAggregatesRepo from "../repo/combinedAggregatesRepo.js";
import CombinedTopStates from "../repo/combinedTopStatesRepo.js";
import CombinedNativeHubRepo from "../repo/combinedNativeHubRepo.js";
import CombinedOsBasedClicksRepo from "../repo/combinedOsBasedClicksRepo.js";
import CombinedBrowserBasedClicksRepo from "../repo/combinedBrowserBasedClicksRepo.js";
import AdminPageAggregatedRepo from "../repo/adminPageDataAggregatedRepo.js";
import { getDb } from "../config/db.js";

const router = express.Router();

// Get total campaign performance by campaignId
router.get("/combined/getCampaignTotals/:campaignId", async (req, res) => {
  try {
    const { campaignId } = req.params;
    console.log("GET /combined/getCampaignTotals/:campaignId route hit");

    try {
      console.log(
        "Fetching combined total campaign performance for campaignId:",
        campaignId
      );
      const combinedData =
        await CombinedTotalRepo.getCombinedCampaignPerformanceTotals(
          campaignId
        );
      console.log("Combined campaign totals extracted successfully.");
      res.status(200).json(combinedData);
    } catch (error) {
      console.error("Error fetching campaign totals:", error);
      res.status(500).send("An error occurred while fetching campaign totals.");
    }
  } catch (error) {
    res.status(500).json({
      message: "Error fetching combined metrics",
      error: error.message,
    });
  }
});

// router.get("/combinedData", async (req, res) => {
//   try {
//     console.log("fetching combined data of all the campaigns");
//     const clientName = req.query.clientName;

//     let allCampaignData;
//     if (clientName) {
//       console.log(`Filtering data for client: ${clientName}`);
//       allCampaignData = await AdminPageAggregatedRepo.getClientFilteredData(
//         clientName
//       );
//     } else {
//       allCampaignData = await AdminPageAggregatedRepo.getCombinedData();
//     }

//     console.log("Data fetched successfully");
//     res.json(allCampaignData);
//   } catch (error) {
//     console.error("Error in fetching data ", error);
//     res.status(500).send("An error occurred while fetching data.");
//   }
// });

router.get("/clients", async (req, res) => {
  try {
    console.log("Fetching unique client names");
    const clients = await AdminPageAggregatedRepo.getUniqueClients();
    res.json(clients);
  } catch (error) {
    console.error("Error fetching client names:", error);
    res.status(500).send("An error occurred while fetching client names.");
  }
});

// Add this route to your API routes file

// Add this route to get release orders for a client
router.get("/get-release-orders", async (req, res) => {
  try {
    const { clientName } = req.query;

    if (!clientName) {
      return res.status(400).json({ error: "Client name is required" });
    }

    const client = await getDb();
    if (!client) {
      console.error("Failed to connect to MongoDB");
      throw new Error("Failed to connect to MongoDB");
    }

    const collection = client.collection("aggregatedTableFromAllPlatforms");

    // Find the client and extract their release orders
    const result = await collection.findOne(
      { name: clientName },
      { projection: { "releaseOrders.roNumber": 1 } }
    );

    if (!result || !result.releaseOrders) {
      return res.json({ releaseOrders: [] });
    }

    // Return the release orders
    res.json({ releaseOrders: result.releaseOrders });
  } catch (error) {
    console.error(`Error fetching release orders for client:`, error);
    res.status(500).send("An error occurred while fetching release orders.");
  }
});

router.get("/filteredData", async (req, res) => {
  try {
    console.log("Fetching filtered data with parameters:", req.query);

    const { clientName, platform, releaseOrder, startDate, endDate } =
      req.query;

    // Connect to database
    const client = await getDb();
    if (!client) {
      console.error("Failed to connect to MongoDB");
      throw new Error("Failed to connect to MongoDB");
    }

    const collection = client.collection("aggregatedTableFromAllPlatforms");

    const pipeline = [];
    // Build the aggregation pipeline based on filters
    const matchStage = {};

    // Client filter
    if (clientName) {
      matchStage.name = clientName;
    }

    // Release Order filter - Apply before unwinding releaseOrders if possible
    if (releaseOrder && releaseOrder !== "all") {
      // If filtering by RO, we must match it before unwinding potentially irrelevant ROs
      matchStage["releaseOrders.roNumber"] = releaseOrder;
    }

    // Build date filter conditions - This structure seems complex but potentially correct
    // depending on whether a document MUST match ANY date condition or specific ones.
    // Let's assume it needs to match within the date range in *at least one* relevant location.
    const dateConditions = [];
    if (startDate) {
      dateConditions.push({
        $or: [
          // Check top-level dates if they exist
          { startDate: { $gte: startDate } },
          // Check platform-specific start dates
          {
            "releaseOrders.platforms.taboola.campaignResults.startDate": {
              $gte: startDate,
            },
          },
          {
            "releaseOrders.platforms.mgid.campaignResults.startDate": {
              $gte: startDate,
            },
          },
          {
            "releaseOrders.platforms.dspOutbrain.campaignResults.startDate": {
              $gte: startDate,
            },
          },
        ],
      });
    }

    if (endDate) {
      dateConditions.push({
        $or: [
          // Check top-level dates if they exist
          { endDate: { $lte: endDate } },
          // Check platform-specific end dates
          {
            "releaseOrders.platforms.taboola.campaignResults.endDate": {
              $lte: endDate,
            },
          },
          {
            "releaseOrders.platforms.mgid.campaignResults.endDate": {
              $lte: endDate,
            },
          },
          {
            "releaseOrders.platforms.dspOutbrain.campaignResults.endDate": {
              $lte: endDate,
            },
          },
        ],
      });
    }

    // Add date conditions to match stage if present
    if (dateConditions.length > 0) {
      // If both start and end dates are provided, documents must satisfy both conditions
      matchStage.$and = dateConditions;
    }

    // Add initial match stage if there are any filters
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    // --- Platform Specific Logic ---
    if (platform && platform !== "all") {
      // Unwind release orders *after* initial match
      pipeline.push({ $unwind: "$releaseOrders" });

      // If we already filtered by RO number in the initial match, we don't strictly need this,
      // but it ensures we only process the matched RO if the initial match didn't filter it.
      if (releaseOrder && releaseOrder !== "all") {
        pipeline.push({ $match: { "releaseOrders.roNumber": releaseOrder } });
      }

      // Now handle platform-specific unwinding and grouping
      switch (platform) {
        case "taboola":
          pipeline.push({
            $match: {
              "releaseOrders.platforms.taboola": { $exists: true, $ne: null },
            },
          }); // Ensure platform data exists
          pipeline.push({
            $unwind: "$releaseOrders.platforms.taboola.campaignResults",
          });
          pipeline.push({
            $unwind:
              "$releaseOrders.platforms.taboola.campaignResults.campaignPerformanceResult.results",
          });

          // Optional: Add a $match stage here if you need to filter by date specifically within taboola results *after* unwinding
          // if (startDate || endDate) {
          //    const platformDateMatch = {};
          //    if (startDate) platformDateMatch["releaseOrders.platforms.taboola.campaignResults.startDate"] = { $gte: startDate };
          //    if (endDate) platformDateMatch["releaseOrders.platforms.taboola.campaignResults.endDate"] = { $lte: endDate };
          //    pipeline.push({ $match: platformDateMatch });
          // }

          pipeline.push({
            $group: {
              _id: null, // Group all matched documents together
              totalClicks: {
                $sum: {
                  $ifNull: [
                    "$releaseOrders.platforms.taboola.campaignResults.campaignPerformanceResult.results.clicks",
                    0,
                  ],
                },
              },
              totalImpressions: {
                $sum: {
                  $ifNull: [
                    "$releaseOrders.platforms.taboola.campaignResults.campaignPerformanceResult.results.impressions",
                    0,
                  ],
                },
              },
              totalSpent: {
                $sum: {
                  $ifNull: [
                    "$releaseOrders.platforms.taboola.campaignResults.campaignPerformanceResult.results.spent",
                    0,
                  ],
                },
              },
              // For averages like CPC/CTR, $avg might be misleading if some entries are 0.
              // It's often better to calculate totalSpent / totalClicks and totalClicks / totalImpressions later.
              // But sticking to the original approach for now:
              totalCPC: {
                $avg: {
                  $ifNull: [
                    "$releaseOrders.platforms.taboola.campaignResults.campaignPerformanceResult.results.cpc",
                    0,
                  ],
                },
              },
              totalCTR: {
                $avg: {
                  $ifNull: [
                    "$releaseOrders.platforms.taboola.campaignResults.campaignPerformanceResult.results.ctr",
                    0,
                  ],
                },
              },
            },
          });
          break;

        case "mgid":
          pipeline.push({
            $match: {
              "releaseOrders.platforms.mgid": { $exists: true, $ne: null },
            },
          }); // Ensure platform data exists
          pipeline.push({
            $unwind: "$releaseOrders.platforms.mgid.campaignResults",
          });

          // Optional: Add a $match stage here if you need to filter by date specifically within mgid results *after* unwinding
          // if (startDate || endDate) {
          //    const platformDateMatch = {};
          //    if (startDate) platformDateMatch["releaseOrders.platforms.mgid.campaignResults.startDate"] = { $gte: startDate };
          //    if (endDate) platformDateMatch["releaseOrders.platforms.mgid.campaignResults.endDate"] = { $lte: endDate };
          //    pipeline.push({ $match: platformDateMatch });
          // }

          pipeline.push({
            $project: {
              deviceTypeTotals: {
                $first: {
                  $filter: {
                    input:
                      "$releaseOrders.platforms.mgid.campaignResults.performanceByDeviceType",
                    as: "item",
                    cond: { $eq: ["$$item.deviceType", "Total"] },
                  },
                },
              },
              regionTotals: {
                $first: {
                  $filter: {
                    input:
                      "$releaseOrders.platforms.mgid.campaignResults.performanceByRegion",
                    as: "item",
                    cond: { $eq: ["$$item.region", "Total"] },
                  },
                },
              },
              osTotals: {
                $first: {
                  $filter: {
                    input:
                      "$releaseOrders.platforms.mgid.campaignResults.performanceByOS",
                    as: "item",
                    cond: { $eq: ["$$item.os", "Total"] },
                  },
                },
              },
              siteTotals: {
                $first: {
                  $filter: {
                    input:
                      "$releaseOrders.platforms.mgid.campaignResults.performanceBySite",
                    as: "item",
                    cond: { $eq: ["$$item.site", "Total"] },
                  },
                },
              },
              browserTotals: {
                $first: {
                  $filter: {
                    input:
                      "$releaseOrders.platforms.mgid.campaignResults.performanceByBrowser",
                    as: "item",
                    cond: { $eq: ["$$item.browser", "Total"] },
                  },
                },
              },
              countryTotals: {
                $first: {
                  $filter: {
                    input:
                      "$releaseOrders.platforms.mgid.campaignResults.performanceByCountry",
                    as: "item",
                    cond: { $eq: ["$$item.country", "Total"] },
                  },
                },
              },
            },
          });
          pipeline.push({
            $group: {
              _id: null,
              totalclicks: {
                $sum: {
                  $add: [
                    { $ifNull: ["$deviceTypeTotals.clicks", 0] },
                    { $ifNull: ["$regionTotals.clicks", 0] },
                    { $ifNull: ["$osTotals.clicks", 0] },
                    { $ifNull: ["$siteTotals.clicks", 0] },
                    { $ifNull: ["$browserTotals.clicks", 0] },
                    { $ifNull: ["$countryTotals.clicks", 0] },
                  ],
                },
              },
              totalImpressions: {
                $sum: {
                  $add: [
                    { $ifNull: ["$deviceTypeTotals.Impressions (Total)", 0] },
                    { $ifNull: ["$regionTotals.Impressions (Total)", 0] },
                    { $ifNull: ["$osTotals.Impressions (Total)", 0] },
                    { $ifNull: ["$siteTotals.Impressions (Total)", 0] },
                    { $ifNull: ["$browserTotals.Impressions (Total)", 0] },
                    { $ifNull: ["$countryTotals.Impressions (Total)", 0] },
                  ],
                },
              },
              totalSpent: {
                $sum: {
                  $add: [
                    { $ifNull: ["$deviceTypeTotals.spent", 0] },
                    { $ifNull: ["$regionTotals.spent", 0] },
                    { $ifNull: ["$osTotals.spent", 0] },
                    { $ifNull: ["$siteTotals.spent", 0] },
                    { $ifNull: ["$browserTotals.spent", 0] },
                    { $ifNull: ["$countryTotals.spent", 0] },
                  ],
                },
              },
              totalCPC: {
                $sum: {
                  $add: [
                    {
                      $ifNull: [
                        {
                          $multiply: [
                            "$deviceTypeTotals.cpc",
                            "$deviceTypeTotals.clicks",
                          ],
                        },
                        0,
                      ],
                    },
                    {
                      $ifNull: [
                        {
                          $multiply: [
                            "$regionTotals.cpc",
                            "$regionTotals.clicks",
                          ],
                        },
                        0,
                      ],
                    },
                    {
                      $ifNull: [
                        { $multiply: ["$osTotals.cpc", "$osTotals.clicks"] },
                        0,
                      ],
                    },
                    {
                      $ifNull: [
                        {
                          $multiply: ["$siteTotals.cpc", "$siteTotals.clicks"],
                        },
                        0,
                      ],
                    },
                    {
                      $ifNull: [
                        {
                          $multiply: [
                            "$browserTotals.cpc",
                            "$browserTotals.clicks",
                          ],
                        },
                        0,
                      ],
                    },
                    {
                      $ifNull: [
                        {
                          $multiply: [
                            "$countryTotals.cpc",
                            "$countryTotals.clicks",
                          ],
                        },
                        0,
                      ],
                    },
                  ],
                },
              },
              totalCTR: {
                $sum: {
                  $add: [
                    {
                      $ifNull: [
                        {
                          $multiply: [
                            "$deviceTypeTotals['CTR, %']",
                            "$deviceTypeTotals.Impressions (Total)",
                          ],
                        },
                        0,
                      ],
                    },
                    {
                      $ifNull: [
                        {
                          $multiply: [
                            "$regionTotals['CTR, %']",
                            "$regionTotals.Impressions (Total)",
                          ],
                        },
                        0,
                      ],
                    },
                    {
                      $ifNull: [
                        {
                          $multiply: [
                            "$osTotals['CTR, %']",
                            "$osTotals.Impressions (Total)",
                          ],
                        },
                        0,
                      ],
                    },
                    {
                      $ifNull: [
                        {
                          $multiply: [
                            "$siteTotals['CTR, %']",
                            "$siteTotals.Impressions (Total)",
                          ],
                        },
                        0,
                      ],
                    },
                    {
                      $ifNull: [
                        {
                          $multiply: [
                            "$browserTotals['CTR, %']",
                            "$browserTotals.Impressions (Total)",
                          ],
                        },
                        0,
                      ],
                    },
                    {
                      $ifNull: [
                        {
                          $multiply: [
                            "$countryTotals['CTR, %']",
                            "$countryTotals.Impressions (Total)",
                          ],
                        },
                        0,
                      ],
                    },
                  ],
                },
              },
            },
          });
          pipeline.push({
            $project: {
              totalClicks: 1,
              totalImpressions: 1,
              totalSpent: 1,
              totalCPC: {
                $cond: [
                  { $eq: ["$clicks", 0] },
                  0,
                  { $divide: ["$cpcClicks", "$clicks"] },
                ],
              },
              totalCTR: {
                $cond: [
                  { $eq: ["$impressions", 0] },
                  0,
                  { $divide: ["$ctrImpressions", "$impressions"] },
                ],
              },
            },
          });
          break;

        case "dspOutbrain":
          pipeline.push({
            $match: {
              "releaseOrders.platforms.dspOutbrain": {
                $exists: true,
                $ne: null,
              },
            },
          }); // Ensure platform data exists
          pipeline.push({
            $unwind: "$releaseOrders.platforms.dspOutbrain.campaignResults",
          });
          pipeline.push({
            $unwind:
              "$releaseOrders.platforms.dspOutbrain.campaignResults.campaignPerformanceResult",
          });

          // Optional: Add a $match stage here if you need to filter by date specifically within dspOutbrain results *after* unwinding
          // if (startDate || endDate) {
          //    const platformDateMatch = {};
          //    if (startDate) platformDateMatch["releaseOrders.platforms.dspOutbrain.campaignResults.startDate"] = { $gte: startDate };
          //    if (endDate) platformDateMatch["releaseOrders.platforms.dspOutbrain.campaignResults.endDate"] = { $lte: endDate };
          //    pipeline.push({ $match: platformDateMatch });
          // }

          pipeline.push({
            $group: {
              _id: null,
              totalClicks: {
                $sum: {
                  $toInt: {
                    $ifNull: [
                      "$releaseOrders.platforms.dspOutbrain.campaignResults.campaignPerformanceResult.Clicks",
                      0,
                    ],
                  },
                },
              },
              totalImpressions: {
                $sum: {
                  $toInt: {
                    $ifNull: [
                      "$releaseOrders.platforms.dspOutbrain.campaignResults.campaignPerformanceResult.Impressions",
                      0,
                    ],
                  },
                },
              },
              totalSpent: {
                $sum: {
                  $toDouble: {
                    $ifNull: [
                      "$releaseOrders.platforms.dspOutbrain.campaignResults.campaignPerformanceResult['Total Spend']",
                      0,
                    ],
                  },
                },
              },
              totalCPC: {
                $avg: {
                  $toDouble: {
                    $ifNull: [
                      "$releaseOrders.platforms.dspOutbrain.campaignResults.campaignPerformanceResult.Avg[' CPC']",
                      0,
                    ],
                  },
                },
              }, // Note the space in ' CPC'
              totalCTR: {
                $avg: {
                  $toDouble: {
                    $ifNull: [
                      "$releaseOrders.platforms.dspOutbrain.campaignResults.campaignPerformanceResult.CTR",
                      0,
                    ],
                  },
                },
              },
            },
          });
          break;

        default:
          // Ensure this case is handled appropriately
          console.error(`Unsupported platform requested: ${platform}`);
          return res
            .status(400)
            .json({ error: `Unsupported platform: ${platform}` });
      }
      // --- REMOVED the redundant pipeline pushes that were here ---
    } else {
      // --- Logic for 'all' platforms using $facet ---
      // Unwind release orders once before faceting if RO filter is applied
      if (releaseOrder && releaseOrder !== "all") {
        pipeline.push({ $unwind: "$releaseOrders" });
        pipeline.push({ $match: { "releaseOrders.roNumber": releaseOrder } });
        // Note: Facet will now operate on documents where each represents one release order
      }

      pipeline.push({
        $facet: {
          // Taboola facet: Unwind only if necessary
          taboola: [
            // Match stage already applied filters like client name, date range ($and)
            // If releaseOrder filter was applied before facet, unwind ROs here
            ...(releaseOrder && releaseOrder !== "all"
              ? []
              : [
                  {
                    $unwind: {
                      path: "$releaseOrders",
                      preserveNullAndEmptyArrays: true,
                    },
                  },
                ]),
            // Match specific RO *within* the facet if not done before
            ...(releaseOrder && releaseOrder !== "all"
              ? []
              : releaseOrder
              ? [{ $match: { "releaseOrders.roNumber": releaseOrder } }]
              : []),
            // Unwind platform data
            {
              $unwind: {
                path: "$releaseOrders.platforms.taboola.campaignResults",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $unwind: {
                path: "$releaseOrders.platforms.taboola.campaignResults.campaignPerformanceResult.results",
                preserveNullAndEmptyArrays: true,
              },
            },
            // Group results
            {
              $match: {
                "releaseOrders.platforms.taboola.campaignResults.campaignPerformanceResult.results.clicks":
                  { $exists: true },
              },
            }, // Ensure we only group actual results
            {
              $group: {
                _id: null,
                clicks: {
                  $sum: {
                    $ifNull: [
                      "$releaseOrders.platforms.taboola.campaignResults.campaignPerformanceResult.results.clicks",
                      0,
                    ],
                  },
                },
                impressions: {
                  $sum: {
                    $ifNull: [
                      "$releaseOrders.platforms.taboola.campaignResults.campaignPerformanceResult.results.impressions",
                      0,
                    ],
                  },
                },
                spent: {
                  $sum: {
                    $ifNull: [
                      "$releaseOrders.platforms.taboola.campaignResults.campaignPerformanceResult.results.spent",
                      0,
                    ],
                  },
                },
                // Avoid $avg on potentially sparse data in facets, calculate totals first
                totalCpcSpent: {
                  $sum: {
                    $multiply: [
                      {
                        $ifNull: [
                          "$releaseOrders.platforms.taboola.campaignResults.campaignPerformanceResult.results.cpc",
                          0,
                        ],
                      },
                      {
                        $ifNull: [
                          "$releaseOrders.platforms.taboola.campaignResults.campaignPerformanceResult.results.clicks",
                          0,
                        ],
                      },
                    ],
                  },
                }, // To calculate weighted average later
                totalCtrImpressions: {
                  $sum: {
                    $ifNull: [
                      "$releaseOrders.platforms.taboola.campaignResults.campaignPerformanceResult.results.impressions",
                      0,
                    ],
                  },
                }, // Needed for weighted CTR avg
                countForAvg: { $sum: 1 }, // Count documents contributing to the average
              },
            },
          ],
          // MGID facet: Similar structure
          mgid: [
            ...(releaseOrder && releaseOrder !== "all"
              ? []
              : [
                  {
                    $unwind: {
                      path: "$releaseOrders",
                      preserveNullAndEmptyArrays: true,
                    },
                  },
                ]),
            ...(releaseOrder && releaseOrder !== "all"
              ? []
              : releaseOrder
              ? [{ $match: { "releaseOrders.roNumber": releaseOrder } }]
              : []),
            {
              $unwind: {
                path: "$releaseOrders.platforms.mgid.campaignResults",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $project: {
                deviceTypeTotals: {
                  $first: {
                    $filter: {
                      input:
                        "$releaseOrders.platforms.mgid.campaignResults.performanceByDeviceType",
                      as: "item",
                      cond: { $eq: ["$$item.deviceType", "Total"] },
                    },
                  },
                },
                regionTotals: {
                  $first: {
                    $filter: {
                      input:
                        "$releaseOrders.platforms.mgid.campaignResults.performanceByRegion",
                      as: "item",
                      cond: { $eq: ["$$item.region", "Total"] },
                    },
                  },
                },
                osTotals: {
                  $first: {
                    $filter: {
                      input:
                        "$releaseOrders.platforms.mgid.campaignResults.performanceByOS",
                      as: "item",
                      cond: { $eq: ["$$item.os", "Total"] },
                    },
                  },
                },
                siteTotals: {
                  $first: {
                    $filter: {
                      input:
                        "$releaseOrders.platforms.mgid.campaignResults.performanceBySite",
                      as: "item",
                      cond: { $eq: ["$$item.site", "Total"] },
                    },
                  },
                },
                browserTotals: {
                  $first: {
                    $filter: {
                      input:
                        "$releaseOrders.platforms.mgid.campaignResults.performanceByBrowser",
                      as: "item",
                      cond: { $eq: ["$$item.browser", "Total"] },
                    },
                  },
                },
                countryTotals: {
                  $first: {
                    $filter: {
                      input:
                        "$releaseOrders.platforms.mgid.campaignResults.performanceByCountry",
                      as: "item",
                      cond: { $eq: ["$$item.country", "Total"] },
                    },
                  },
                },
              },
            },
            {
              $group: {
                _id: null,
                clicks: {
                  $sum: {
                    $add: [
                      { $ifNull: ["$deviceTypeTotals.clicks", 0] },
                      { $ifNull: ["$regionTotals.clicks", 0] },
                      { $ifNull: ["$osTotals.clicks", 0] },
                      { $ifNull: ["$siteTotals.clicks", 0] },
                      { $ifNull: ["$browserTotals.clicks", 0] },
                      { $ifNull: ["$countryTotals.clicks", 0] },
                    ],
                  },
                },
                impressions: {
                  $sum: {
                    $add: [
                      { $ifNull: ["$deviceTypeTotals.Impressions (Total)", 0] },
                      { $ifNull: ["$regionTotals.Impressions (Total)", 0] },
                      { $ifNull: ["$osTotals.Impressions (Total)", 0] },
                      { $ifNull: ["$siteTotals.Impressions (Total)", 0] },
                      { $ifNull: ["$browserTotals.Impressions (Total)", 0] },
                      { $ifNull: ["$countryTotals.Impressions (Total)", 0] },
                    ],
                  },
                },
                spent: {
                  $sum: {
                    $add: [
                      { $ifNull: ["$deviceTypeTotals.spent", 0] },
                      { $ifNull: ["$regionTotals.spent", 0] },
                      { $ifNull: ["$osTotals.spent", 0] },
                      { $ifNull: ["$siteTotals.spent", 0] },
                      { $ifNull: ["$browserTotals.spent", 0] },
                      { $ifNull: ["$countryTotals.spent", 0] },
                    ],
                  },
                },
                cpcClicks: {
                  $sum: {
                    $add: [
                      {
                        $ifNull: [
                          {
                            $multiply: [
                              "$deviceTypeTotals.cpc",
                              "$deviceTypeTotals.clicks",
                            ],
                          },
                          0,
                        ],
                      },
                      {
                        $ifNull: [
                          {
                            $multiply: [
                              "$regionTotals.cpc",
                              "$regionTotals.clicks",
                            ],
                          },
                          0,
                        ],
                      },
                      {
                        $ifNull: [
                          { $multiply: ["$osTotals.cpc", "$osTotals.clicks"] },
                          0,
                        ],
                      },
                      {
                        $ifNull: [
                          {
                            $multiply: [
                              "$siteTotals.cpc",
                              "$siteTotals.clicks",
                            ],
                          },
                          0,
                        ],
                      },
                      {
                        $ifNull: [
                          {
                            $multiply: [
                              "$browserTotals.cpc",
                              "$browserTotals.clicks",
                            ],
                          },
                          0,
                        ],
                      },
                      {
                        $ifNull: [
                          {
                            $multiply: [
                              "$countryTotals.cpc",
                              "$countryTotals.clicks",
                            ],
                          },
                          0,
                        ],
                      },
                    ],
                  },
                },
                ctrImpressions: {
                  $sum: {
                    $add: [
                      {
                        $ifNull: [
                          {
                            $multiply: [
                              "$deviceTypeTotals['CTR, %']",
                              "$deviceTypeTotals.Impressions (Total)",
                            ],
                          },
                          0,
                        ],
                      },
                      {
                        $ifNull: [
                          {
                            $multiply: [
                              "$regionTotals['CTR, %']",
                              "$regionTotals.Impressions (Total)",
                            ],
                          },
                          0,
                        ],
                      },
                      {
                        $ifNull: [
                          {
                            $multiply: [
                              "$osTotals['CTR, %']",
                              "$osTotals.Impressions (Total)",
                            ],
                          },
                          0,
                        ],
                      },
                      {
                        $ifNull: [
                          {
                            $multiply: [
                              "$siteTotals['CTR, %']",
                              "$siteTotals.Impressions (Total)",
                            ],
                          },
                          0,
                        ],
                      },
                      {
                        $ifNull: [
                          {
                            $multiply: [
                              "$browserTotals['CTR, %']",
                              "$browserTotals.Impressions (Total)",
                            ],
                          },
                          0,
                        ],
                      },
                      {
                        $ifNull: [
                          {
                            $multiply: [
                              "$countryTotals['CTR, %']",
                              "$countryTotals.Impressions (Total)",
                            ],
                          },
                          0,
                        ],
                      },
                    ],
                  },
                },
              },
            },
            {
              $project: {
                clicks: 1,
                impressions: 1,
                spent: 1,
                cpc: {
                  $cond: [
                    { $eq: ["$clicks", 0] },
                    0,
                    { $divide: ["$cpcClicks", "$clicks"] },
                  ],
                },
                ctr: {
                  $cond: [
                    { $eq: ["$impressions", 0] },
                    0,
                    { $divide: ["$ctrImpressions", "$impressions"] },
                  ],
                },
              },
            },
          ],
          // dspOutbrain facet: Similar structure
          dspOutbrain: [
            ...(releaseOrder && releaseOrder !== "all"
              ? []
              : [
                  {
                    $unwind: {
                      path: "$releaseOrders",
                      preserveNullAndEmptyArrays: true,
                    },
                  },
                ]),
            ...(releaseOrder && releaseOrder !== "all"
              ? []
              : releaseOrder
              ? [{ $match: { "releaseOrders.roNumber": releaseOrder } }]
              : []),
            {
              $unwind: {
                path: "$releaseOrders.platforms.dspOutbrain.campaignResults",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $unwind: {
                path: "$releaseOrders.platforms.dspOutbrain.campaignResults.campaignPerformanceResult",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $match: {
                "releaseOrders.platforms.dspOutbrain.campaignResults.campaignPerformanceResult.Clicks":
                  { $exists: true },
              },
            },
            {
              $group: {
                _id: null,
                clicks: {
                  $sum: {
                    $toInt: {
                      $ifNull: [
                        "$releaseOrders.platforms.dspOutbrain.campaignResults.campaignPerformanceResult.Clicks",
                        0,
                      ],
                    },
                  },
                },
                impressions: {
                  $sum: {
                    $toInt: {
                      $ifNull: [
                        "$releaseOrders.platforms.dspOutbrain.campaignResults.campaignPerformanceResult.Impressions",
                        0,
                      ],
                    },
                  },
                },
                spent: {
                  $sum: {
                    $toDouble: {
                      $ifNull: [
                        "$releaseOrders.platforms.dspOutbrain.campaignResults.campaignPerformanceResult['Total Spend']",
                        0,
                      ],
                    },
                  },
                },
                totalCpcSpent: {
                  $sum: {
                    $multiply: [
                      {
                        $toDouble: {
                          $ifNull: [
                            "$releaseOrders.platforms.dspOutbrain.campaignResults.campaignPerformanceResult.Avg[' CPC']",
                            0,
                          ],
                        },
                      },
                      {
                        $toInt: {
                          $ifNull: [
                            "$releaseOrders.platforms.dspOutbrain.campaignResults.campaignPerformanceResult.Clicks",
                            0,
                          ],
                        },
                      },
                    ],
                  },
                },
                totalCtrImpressions: {
                  $sum: {
                    $toInt: {
                      $ifNull: [
                        "$releaseOrders.platforms.dspOutbrain.campaignResults.campaignPerformanceResult.Impressions",
                        0,
                      ],
                    },
                  },
                },
                countForAvg: { $sum: 1 },
              },
            },
          ],
        },
      });

      // Combine results from all facets
      pipeline.push({
        $project: {
          totalClicks: {
            $sum: [
              { $ifNull: [{ $arrayElemAt: ["$taboola.clicks", 0] }, 0] },
              { $ifNull: [{ $arrayElemAt: ["$mgid.clicks", 0] }, 0] },
              { $ifNull: [{ $arrayElemAt: ["$dspOutbrain.clicks", 0] }, 0] },
            ],
          },
          totalImpressions: {
            $sum: [
              { $ifNull: [{ $arrayElemAt: ["$taboola.impressions", 0] }, 0] },
              { $ifNull: [{ $arrayElemAt: ["$mgid.impressions", 0] }, 0] },
              {
                $ifNull: [{ $arrayElemAt: ["$dspOutbrain.impressions", 0] }, 0],
              },
            ],
          },
          totalSpent: {
            $sum: [
              { $ifNull: [{ $arrayElemAt: ["$taboola.spent", 0] }, 0] },
              { $ifNull: [{ $arrayElemAt: ["$mgid.spent", 0] }, 0] },
              { $ifNull: [{ $arrayElemAt: ["$dspOutbrain.spent", 0] }, 0] },
            ],
          },
          // Calculate combined averages correctly
          totalCPC: {
            $cond: [
              // Avoid division by zero
              {
                $eq: [
                  {
                    $sum: [
                      {
                        $ifNull: [{ $arrayElemAt: ["$taboola.clicks", 0] }, 0],
                      },
                      { $ifNull: [{ $arrayElemAt: ["$mgid.clicks", 0] }, 0] },
                      {
                        $ifNull: [
                          { $arrayElemAt: ["$dspOutbrain.clicks", 0] },
                          0,
                        ],
                      },
                    ],
                  },
                  0,
                ],
              },
              0, // If total clicks is 0, CPC is 0
              {
                $divide: [
                  // Total spent across all platforms
                  {
                    $sum: [
                      { $ifNull: [{ $arrayElemAt: ["$taboola.spent", 0] }, 0] },
                      { $ifNull: [{ $arrayElemAt: ["$mgid.spent", 0] }, 0] },
                      {
                        $ifNull: [
                          { $arrayElemAt: ["$dspOutbrain.spent", 0] },
                          0,
                        ],
                      },
                    ],
                  },
                  // Total clicks across all platforms
                  {
                    $sum: [
                      {
                        $ifNull: [{ $arrayElemAt: ["$taboola.clicks", 0] }, 0],
                      },
                      { $ifNull: [{ $arrayElemAt: ["$mgid.clicks", 0] }, 0] },
                      {
                        $ifNull: [
                          { $arrayElemAt: ["$dspOutbrain.clicks", 0] },
                          0,
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          totalCTR: {
            $cond: [
              // Avoid division by zero
              {
                $eq: [
                  {
                    $sum: [
                      {
                        $ifNull: [
                          { $arrayElemAt: ["$taboola.impressions", 0] },
                          0,
                        ],
                      },
                      {
                        $ifNull: [
                          { $arrayElemAt: ["$mgid.impressions", 0] },
                          0,
                        ],
                      },
                      {
                        $ifNull: [
                          { $arrayElemAt: ["$dspOutbrain.impressions", 0] },
                          0,
                        ],
                      },
                    ],
                  },
                  0,
                ],
              },
              0, // If total impressions is 0, CTR is 0
              {
                $divide: [
                  // Total clicks across all platforms
                  {
                    $sum: [
                      {
                        $ifNull: [{ $arrayElemAt: ["$taboola.clicks", 0] }, 0],
                      },
                      { $ifNull: [{ $arrayElemAt: ["$mgid.clicks", 0] }, 0] },
                      {
                        $ifNull: [
                          { $arrayElemAt: ["$dspOutbrain.clicks", 0] },
                          0,
                        ],
                      },
                    ],
                  },
                  // Total impressions across all platforms
                  {
                    $sum: [
                      {
                        $ifNull: [
                          { $arrayElemAt: ["$taboola.impressions", 0] },
                          0,
                        ],
                      },
                      {
                        $ifNull: [
                          { $arrayElemAt: ["$mgid.impressions", 0] },
                          0,
                        ],
                      },
                      {
                        $ifNull: [
                          { $arrayElemAt: ["$dspOutbrain.impressions", 0] },
                          0,
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        },
      });
    }

    console.log(
      "Executing aggregation pipeline:",
      JSON.stringify(pipeline, null, 2)
    );

    // Execute the aggregation pipeline
    const result = await collection.aggregate(pipeline).toArray();

    // Handle empty results or results with no data after grouping/projecting
    const finalResult = result[0] || {
      totalClicks: 0,
      totalImpressions: 0,
      totalSpent: 0,
      totalCPC: 0,
      totalCTR: 0,
    };

    console.log("Filtered data results:", finalResult);
    res.json(finalResult); // Send the first element or default values
  } catch (error) {
    console.error("Error in fetching filtered data:", error);
    // Check if it's the specific Mongo error we identified
    if (
      error.name === "MongoServerError" &&
      error.message.includes("exactly one field")
    ) {
      res
        .status(500)
        .send("Internal Server Error: Aggregation pipeline stage is invalid.");
    } else {
      res.status(500).send("An error occurred while fetching filtered data.");
    }
  }
});
export default router;
