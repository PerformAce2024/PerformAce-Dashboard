// PerformAce-Dashboard/Backend/src/controllers/campaign.controller.js
import { saveCampaignDataInDB, getCampaignIdsFromDB } from '../services/campaignService.js';

export const submitCampaign = async (req, res) => {
    try {
        const { clientName, clientEmail, roName, campaignId, dateRange } = req.body;
        console.log('POST /submit-campaign request body:', req.body);

        // Ensure all required fields are present
        if (!clientName || !clientEmail || !roName || !campaignId || !dateRange) {
            console.error('Missing required fields');
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        // Extract start date and end date from the dateRange
        const [startDate, endDate] = dateRange.split(' - ');
        console.log(`Extracted start date: ${startDate}, end date: ${endDate}`);

        const campaignData = {
            clientName,
            clientEmail,
            roName,
            campaignId,
            startDate,   // Start Date
            endDate      // End Date
        };

        // Save the campaign data into the DB
        console.log('Saving campaign data into the DB:', campaignData);
        const savedCampaign = await saveCampaignDataInDB(campaignData);
        console.log('Campaign data saved successfully:', savedCampaign);

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
        console.log(`Fetching campaign IDs for clientId: ${clientId} and roName: ${roName}`);
        const campaignIds = await getCampaignIdsFromDB(clientId, roName);
        console.log('Campaign IDs fetched successfully:', campaignIds);

        res.status(200).json({ success: true, data: campaignIds });
    } catch (error) {
        console.error('Error fetching campaign IDs:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
