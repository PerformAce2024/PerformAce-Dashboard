import AWS from "aws-sdk";
import {
  getCampaignIdsFromDB,
  saveCampaignDataInDB,
} from "../services/campaignService.js";
import DspOutbrainRepo from "../repo/dspOutbrainRepo.js";

import {
  getDspOutbrainCampaignPerformanceResult,
  processDspOutbrainCampaign,
} from "../services/dspoutbrainService.js";
import { saveCampaignMapping } from "../services/campaignMappingservice.js";
import { getDb } from "../config/db.js";
import aggregateClientData from "../services/aggregationService.js";

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: "us-east-1",
});

// Configure AWS SDK
AWS.config.update({ region: "us-east-1" });
const sqs = new AWS.SQS({ apiVersion: "2012-11-05" });
const QUEUE_URL =
  "https://sqs.us-east-1.amazonaws.com/209479285380/TaskQueue.fifo";

export const submitCampaign = async (req, res) => {
  try {
    const {
      clientName,
      clientEmail,
      platform,
      roNumber,
      campaignId,
      dateRange,
    } = req.body;
    console.log("POST /submit-campaign request body:", req.body);

    // Ensure all required fields are present
    if (
      !clientName ||
      !clientEmail ||
      !platform ||
      !roNumber ||
      !campaignId ||
      !dateRange
    ) {
      console.error("Missing required fields");
      return res
        .status(400)
        .json({ success: false, error: "Missing required fields" });
    }

    // Extract start date and end date from the dateRange
    const [startDate, endDate] = dateRange.split(" - ");
    console.log(`Extracted start date: ${startDate}, end date: ${endDate}`);

    const campaignData = {
      clientName,
      clientEmail,
      platform,
      roNumber,
      campaignId,
      startDate,
      endDate,
    };

    // Save the campaign data into the DB
    console.log("Saving campaign data into the DB:", campaignData);
    const savedCampaign = await saveCampaignDataInDB(campaignData);
    console.log("Campaign data saved successfully:", savedCampaign);

    try {
      const mappingData = {
        clientName,
        roNumber,
        platform,
        campaignId,
      };

      await saveCampaignMapping(mappingData);
      console.log("Campaign mapping saved successfully");
    } catch (mappingError) {
      console.error("Error saving campaign mapping:", mappingError);
      // Continue with the process even if mapping fails
    }
    // Handle platform-specific processing
    try {
      switch (platform.toLowerCase()) {
        case "taboola":
          await handleTaboolaCampaign(campaignData);
          break;

        case "dspoutbrain":
          await handleDspOutbrainCampaign(campaignData);
          break;

        default:
          console.warn(
            `No specific handler for platform: ${platform}. Using default processing.`
          );
          await handleDefaultCampaign(campaignData);
      }

      try {
        // Import the aggregateClientData function
        // Call the aggregation function to update the aggregated data
        console.log(
          `Aggregating data for client: ${clientEmail}, date range: ${startDate} to ${endDate}`
        );
        await aggregateClientData(clientEmail, startDate, endDate);
        console.log("Client data aggregation completed successfully");
      } catch (aggregationError) {
        console.error(
          "Error during client data aggregation:",
          aggregationError
        );
        // Don't fail the overall request if aggregation fails
      }
    } catch (error) {
      console.error(`Error during ${platform} data processing:`, error);
    }
    res.status(201).json({ success: true, data: savedCampaign });
  } catch (error) {
    console.error("Error submitting campaign:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Handler for Taboola campaigns
const handleTaboolaCampaign = async (campaignData) => {
  try {
    // Create the message body for SQS
    const messageBody = JSON.stringify(campaignData);

    // Send the message to SQS
    const params = {
      QueueUrl: QUEUE_URL,
      MessageBody: messageBody,
      MessageGroupId: `taboola-${Date.now()}`, // Required for FIFO queues
      MessageDeduplicationId: `taboola-${Date.now()}-${
        campaignData.campaignId
      }`, // Unique ID to avoid duplicate messages
    };

    const sqsResult = await sqs.sendMessage(params).promise();
    console.log("Taboola campaign sent to SQS:", sqsResult.MessageId);
    return sqsResult;
  } catch (error) {
    console.error("Error processing Taboola campaign:", error);
    throw new Error(`Failed to process Taboola campaign: ${error.message}`);
  }
};

// Handler for DSP Outbrain campaigns
const handleDspOutbrainCampaign = async (campaignData) => {
  try {
    // Process DSP Outbrain campaign directly
    console.log("Processing DSP Outbrain campaign:", campaignData);

    // Example: Fetch campaign performance data directly
    const { campaignId, startDate, endDate } = campaignData;

    const formattedStartDate = formatDateForOutbrain(startDate);
    const formattedEndDate = formatDateForOutbrain(endDate);

    const campaignResults = await processDspOutbrainCampaign(
      campaignId,
      formattedStartDate,
      formattedEndDate
    );
    console.log(campaignResults, "These are campaignResult");

    const savedData = await DspOutbrainRepo.saveDspOutbrainDataInDB(
      campaignResults
    );

    console.log("DSP Outbrain campaign saved successfully", savedData);
    return campaignResults;
  } catch (error) {
    console.error("Error processing DSP Outbrain campaign:", error);
    throw new Error(
      `Failed to process DSP Outbrain campaign: ${error.message}`
    );
  }
};

const handleDefaultCampaign = async (campaignData) => {
  try {
    const messageBody = JSON.stringify(campaignData);

    const params = {
      QueueUrl: QUEUE_URL,
      MessageBody: messageBody,
      MessageGroupId: `default-${Date.now()}`,
      MessageDeduplicationId: `default-${Date.now()}-${
        campaignData.campaignId
      }`,
    };

    const sqsResult = await sqs.sendMessage(params).promise();
    console.log(
      `Default campaign processing (${campaignData.platform}) sent to SQS:`,
      sqsResult.MessageId
    );
    return sqsResult;
  } catch (error) {
    console.error(
      `Error with default processing for ${campaignData.platform}:`,
      error
    );
    throw new Error(`Failed in default campaign processing: ${error.message}`);
  }
};

const formatDateForOutbrain = (dateString) => {
  // Check which format the date is in
  let formattedDate;

  // If the date is in MM/DD/YYYY format (common in US)
  if (dateString.includes("/")) {
    const parts = dateString.split("/");
    // Make sure we have month, day, year and pad with zeros if needed
    if (parts.length === 3) {
      const month = parts[0].padStart(2, "0");
      const day = parts[1].padStart(2, "0");
      const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2]; // Handle 2-digit years
      formattedDate = `${year}-${month}-${day}`;
    }
  }
  // If the date is in MM-DD-YYYY format
  else if (dateString.includes("-")) {
    const parts = dateString.split("-");
    // Check if it's already in YYYY-MM-DD format
    if (parts[0].length === 4) {
      // It's already in the right format
      formattedDate = dateString;
    } else if (parts.length === 3) {
      // It's in MM-DD-YYYY format
      const month = parts[0].padStart(2, "0");
      const day = parts[1].padStart(2, "0");
      const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
      formattedDate = `${year}-${month}-${day}`;
    }
  }
  // If the date is in another format or couldn't be parsed
  if (!formattedDate) {
    try {
      // Try to parse it as a JavaScript Date
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        // Format as YYYY-MM-DD
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        formattedDate = `${year}-${month}-${day}`;
      } else {
        throw new Error("Invalid date format");
      }
    } catch (error) {
      console.error(`Error formatting date: ${dateString}`, error);
      throw new Error(
        `Invalid date format: ${dateString}. Required format is YYYY-MM-DD`
      );
    }
  }

  return formattedDate;
};
export const getCampaignIdsByClientEmailAndRO = async (req, res) => {
  try {
    const { clientId, roName } = req.query;
    console.log("GET /get-campaign-ids request query:", req.query);

    // Validate required parameters
    if (!clientId || !roName) {
      console.error("Missing required parameters: clientId or roName");
      return res
        .status(400)
        .json({ success: false, error: "Missing required parameters" });
    }

    // Fetch campaign IDs from the DB

    const campaignIds = await getCampaignIdsFromDB(clientId, roName);
    console.log("Campaign IDs fetched successfully:", campaignIds);

    res.status(200).json({ success: true, data: campaignIds });
  } catch (error) {
    console.error("Error fetching campaign IDs:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getCampaignMappingsByClient = async (req, res) => {
  try {
    const { clientName, roNumber } = req.query;

    if (!clientName) {
      return res.status(400).json({
        success: false,
        error: "Client name is required",
      });
    }

    const mappings = await getCampaignMappings(clientName, roNumber);

    return res.status(200).json({
      success: true,
      data: mappings,
    });
  } catch (error) {
    console.error("Error fetching campaign mappings:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export async function getCampaignPerformanceByRo(req, res) {
  try {
    const { roNumber } = req.params;

    if (!roNumber) {
      return res
        .status(400)
        .json({ success: false, message: "RO Number is required" });
    }

    const db = await getDb();

    // Step 1: Query the campaignMappings collection to find the mapping for this RO
    const campaignMapping = await db
      .collection("campaignMappings")
      .findOne(
        { "mappings.roNumber": roNumber },
        { projection: { "mappings.$": 1, clientName: 1 } }
      );

    if (
      !campaignMapping ||
      !campaignMapping.mappings ||
      campaignMapping.mappings.length === 0
    ) {
      return res.status(404).json({
        success: false,
        message: "No campaign mapping found for this RO number",
      });
    }

    const mapping = campaignMapping.mappings[0];
    const taboolaCampaignIds = mapping.taboolaCampaignId || [];

    if (taboolaCampaignIds.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No Taboola campaign IDs found for this RO number",
      });
    }

    // Step 2: Query the campaignPerformances collection using the campaign IDs
    const campaignPerformances = await db
      .collection("campaignperformances")
      .find({ campaignId: { $in: taboolaCampaignIds } })
      .sort({ dateStored: -1 })
      .toArray();

    if (!campaignPerformances || campaignPerformances.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No campaign performance data found for the campaign IDs",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        clientName: campaignMapping.clientName,
        mapping: mapping,
        performances: campaignPerformances,
      },
    });
  } catch (error) {
    console.error("Error fetching campaign performance:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching campaign performance",
      error: error.message,
    });
  }
}

export const getCampaignMappings = async (req, res) => {
  try {
    const { clientName, roNumber } = req.query;

    // Validate required parameters
    if (!clientName) {
      return res
        .status(400)
        .json({ success: false, message: "Client name is required" });
    }
    const db = req.app.locals.db;
    const CampaignMapping = await db.collection("campaignMappings");
    // Find the campaign mapping document for this client
    const campaignMapping = await CampaignMapping.findOne({ clientName });

    if (!campaignMapping) {
      return res.status(404).json({
        success: false,
        message: "No campaign mappings found for this client",
      });
    }

    // If roNumber is provided, filter to just that mapping
    // Otherwise return all mappings for this client
    if (roNumber) {
      const filteredMapping = {
        clientName: campaignMapping.clientName,
        mappings: campaignMapping.mappings.filter(
          (mapping) => mapping.roNumber === roNumber
        ),
      };

      if (filteredMapping.mappings.length === 0) {
        return res.status(404).json({
          success: false,
          message: `No mappings found for RO Number: ${roNumber}`,
        });
      }

      return res.status(200).json(filteredMapping);
    }

    // Return all mappings for this client
    return res.status(200).json(campaignMapping);
  } catch (error) {
    console.error("Error fetching campaign mappings:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching campaign mappings",
    });
  }
};

// Campaign Performance endpoint - GET /api/:endpoint/:campaignId
export const getCampaignPerformance = async (req, res) => {
  try {
    const { platform, campaignId } = req.params;

    // Map platform names to collection names
    const collectionMappings = {
      campaignperformances: "campaignperformances",
      outbrainPerformances: "outbrainPerformances",
      dspOutbrainPerformances: "dspOutbrainData",
      mgidPerformances: "mgidPerformances",
    };

    const collectionName = collectionMappings[platform];

    if (!collectionName) {
      return res.status(400).json({
        success: false,
        message: `Invalid platform: ${platform}`,
      });
    }

    // Find the campaign performance document
    const db = req.app.locals.db; // Access your MongoDB connection
    const performance = await db
      .collection(collectionName)
      .findOne({ campaignId });

    if (!performance) {
      return res.status(404).json({
        success: false,
        message: `No ${platform} data found for campaign ID: ${campaignId}`,
      });
    }

    return res.status(200).json(performance);
  } catch (error) {
    console.error(`Error fetching campaign performance:`, error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching campaign performance data",
    });
  }
};
