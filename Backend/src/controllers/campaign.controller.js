import AWS from 'aws-sdk';
import dotenv from 'dotenv';
import { saveCampaignDataInDB } from '../services/campaignService.js';

dotenv.config();

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region:'us-east-1' // Use the region from .env or a default region
});


// Configure AWS SDK
AWS.config.update({ region: 'us-east-1' }); // Replace 'us-east-1' with your AWS region
const sqs = new AWS.SQS({ apiVersion: '2012-11-05' });
const QUEUE_URL = 'https://sqs.us-east-1.amazonaws.com/209479285380/TaskQueue.fifo'; // Replace with your actual queue URL

export const submitCampaign = async (req, res) => {
    try {
        const { clientName, clientEmail, platform, roNumber, campaignId, dateRange } = req.body;
        console.log('POST /submit-campaign request body:', req.body);

        // Ensure all required fields are present
        if (!clientName || !clientEmail || !platform || !roNumber || !campaignId || !dateRange) {
            console.error('Missing required fields');
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        // Extract start date and end date from the dateRange
        const [startDate, endDate] = dateRange.split(' - ');
        console.log(`Extracted start date: ${startDate}, end date: ${endDate}`);

        const campaignData = {
            clientName,
            clientEmail,
            platform,
            roNumber,
            campaignId,
            startDate,   // Start Date
            endDate      // End Date
        };

        // Save the campaign data into the DB
        console.log('Saving campaign data into the DB:', campaignData);
        const savedCampaign = await saveCampaignDataInDB(campaignData);
        console.log('Campaign data saved successfully:', savedCampaign);


        // Create the message body for SQS
        const messageBody = JSON.stringify({
            clientName,
            clientEmail,
            platform,
            roNumber,
            campaignId,
            startDate,
            endDate
        });

        // Send the message to SQS
        const params = {
            QueueUrl: QUEUE_URL,
            MessageBody: messageBody,
            MessageGroupId: `group-${Date.now()}`, // Required for FIFO queues
            MessageDeduplicationId: Date.now().toString() // Unique ID to avoid duplicate messages
        };

        try {
            const sqsResult = await sqs.sendMessage(params).promise();
            console.log('Message sent to SQS:', sqsResult.MessageId);
        } catch (sqsError) {
            console.error('Error sending message to SQS:', sqsError);
            // Optionally, handle errors related to SQS (e.g., log or retry mechanism)
        }

        res.status(201).json({ success: true, data: savedCampaign });
    } catch (error) {
        console.error('Error submitting campaign:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getCampaignIdsByClientEmailAndRO = async (req, res) => {
    try {
        const { clientId, roName } = req.query;
        console.log('GET /get-campaign-ids request query:', req.query);

        // Validate required parameters
        if (!clientId || !roName) {
            console.error('Missing required parameters: clientId or roName');
            return res.status(400).json({ success: false, error: 'Missing required parameters' });
        }

        // Fetch campaign IDs from the DB
        
        const campaignIds = await getCampaignIdsFromDB(clientId, roName);
        console.log('Campaign IDs fetched successfully:', campaignIds);

        res.status(200).json({ success: true, data: campaignIds });
    } catch (error) {
        console.error('Error fetching campaign IDs:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
