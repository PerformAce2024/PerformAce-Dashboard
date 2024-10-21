import { createROInDB, getAllROsFromDB } from '../services/roService.js';

export const createRO = async (req, res) => {
    try {
        // Extracting RO data from the request body
        const roData = {
            client: req.body.client,
            description: req.body.description,
            targetClicks: req.body.targetClicks,
            budget: req.body.budget,
            cpc: req.body.cpc,
            cpm: req.body.cpm,
            soldBy: req.body.soldBy,
            saleDate: req.body.saleDate,
            roNumber: req.body.roNumber
        };

        // Call the service to create the RO in the database
        const createdRO = await createROInDB(roData);

        // Respond with the created RO data
        res.status(201).json({ success: true, data: createdRO });
    } catch (error) {
        console.error('Error fetching ROs:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

export const getAllROs = async (req, res) => {
    try {
        // Call the service to get all ROs from the database
        const ros = await getAllROsFromDB();

        // Respond with the list of ROs
        res.status(200).json({ success: true, data: ros });
    } catch (error) {
        console.error('Error fetching ROs:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
