import { createROInDB, getROById } from '../services/roService.js';
import { getClientByName } from '../services/clientService.js';

export const createNewRO = async (req, res) => {
    try {
        // Sanitizing the incoming data
        const roData = {
            client: req.body.client,
            description: req.body.description,
            targetClicks: req.body.targetClicks,
            budget: req.body.budget,
            cpc: req.body.cpc,
            cpm: req.body.cpm,
            soldBy: req.body.soldBy,
            saleDate: req.body.saleDate,
            contactName: req.body.contactName,
            contactEmail: req.body.contactEmail,
            contactPhone: req.body.contactPhone,
            roNumber: req.body.roNumber,
        };

        // Log sanitized data for debugging
        console.log('Sanitized RO Data:', roData);

        // Step 1: Check if client exists by name
        const client = await getClientByName(roData.client);

        if (client) {
            // Step 2: If the client exists, add the CUID to the RO data
            roData.CUID = client.CUID;
        }

        // Step 3: Create the new Release Order in the DB
        const createdRO = await createROInDB(roData);

        res.status(201).json({ success: true, data: createdRO });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getRO = async (req, res) => {
    try {
        const roId = req.params.id; // RO ID from URL params
        const ro = await getROById(roId);

        if (!ro) {
            return res.status(404).json({ success: false, message: 'RO not found' });
        }

        res.status(200).json({ success: true, data: ro });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
