import { saveCampaignDataInDB, getCampaignIdsFromDB } from '../services/campaignService.js';

export const submitCampaign = async (req, res) => {
    try {
        const { clientName, clientEmail, roName, campaignId, dateRange } = req.body;

        // Ensure all required fields are present
        if (!clientName || !clientEmail || !roName || !campaignId || !dateRange) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        // Extract start date and end date from the dateRange
        const [startDate, endDate] = dateRange.split(' - ');

        const campaignData = {
            clientName,
            clientEmail,
            roName,
            campaignId,
            startDate,   // Start Date
            endDate      // End Date
        };

        // Save the campaign data into the DB
        const savedCampaign = await saveCampaignDataInDB(campaignData);
        res.status(201).json({ success: true, data: savedCampaign });
    } catch (error) {
        console.error('Error submitting campaign:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getCampaignIdsByClientEmailAndRO = async (req, res) => {
    try {
        const { clientId, roName } = req.query;

        if (!clientId || !roName) {
            return res.status(400).json({ success: false, error: 'Missing required parameters' });
        }

        const campaignIds = await getCampaignIdsFromDB(clientId, roName);
        res.status(200).json({ success: true, data: campaignIds });
    } catch (error) {
        console.error('Error fetching campaign IDs:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
