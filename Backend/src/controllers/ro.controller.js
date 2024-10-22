import { createROInDB, getAllROsFromDB } from '../services/roService.js';

export const createRO = async (req, res) => {
    try {
        console.log('POST /create-ro request body:', req.body);

        // Extracting RO data from the request body
        const roData = {
            client: req.body.client,
            targetClicks: req.body.targetClicks,
            budget: req.body.budget,
            cpc: req.body.cpc,
            cpm: req.body.cpm,
            soldBy: req.body.soldBy,
            saleDate: req.body.saleDate,
            roNumber: req.body.roNumber,
            service: req.body.service // Add service data to the RO
        };

        console.log('Creating RO with data:', roData);

        // Call the service to create the RO in the database
        const createdRO = await createROInDB(roData);
        console.log('RO created successfully:', createdRO);

        // Respond with the created RO data
        res.status(201).json({ success: true, data: createdRO });
    } catch (error) {
        console.error('Error creating RO:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getAllROs = async (req, res) => {
    try {
        console.log('GET /get-ros route hit');

        // Call the service to get all ROs from the database
        console.log('Fetching all ROs from the database');
        const ros = await getAllROsFromDB();
        console.log('ROs fetched successfully:', ros);

        // Respond with the list of ROs
        res.status(200).json({ success: true, data: ros });
    } catch (error) {
        console.error('Error fetching ROs:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
