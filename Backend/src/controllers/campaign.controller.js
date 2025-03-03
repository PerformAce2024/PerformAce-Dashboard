import AWS from "aws-sdk";

import { saveCampaignDataInDB } from "../services/campaignService.js";
import { getDspOutbrainCampaignPerformanceResult } from "../services/dspoutbrainService.js";

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: "us-east-1", // Use the region from .env or a default region
});

// Configure AWS SDK
AWS.config.update({ region: "us-east-1" }); // Replace 'us-east-1' with your AWS region
const sqs = new AWS.SQS({ apiVersion: "2012-11-05" });
const QUEUE_URL =
  "https://sqs.us-east-1.amazonaws.com/209479285380/TaskQueue.fifo"; // Replace with your actual queue URL

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

    // Handle platform-specific processing
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

    const campaignResults = await getDspOutbrainCampaignPerformanceResult(
      campaignId,
      formattedStartDate,
      formattedEndDate
    );

    console.log(
      "DSP Outbrain campaign processed successfully",
      campaignResults
    );
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
