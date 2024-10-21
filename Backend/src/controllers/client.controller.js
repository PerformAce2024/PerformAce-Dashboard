import { createClientInDB } from '../services/clientService.js';
import { updateROWithClientEmail } from '../services/roService.js';

export const createClientAndAddEmailToRO = async (req, res) => {
    try {
        // Collect client data from request
        const clientData = {
            name: req.body.name,
            email: req.body.email,  // Only this will be added to the RO
            phone: req.body.phone,
            address: req.body.address,
            city: req.body.city,
            state: req.body.state,
            postcode: req.body.postcode,
            country: req.body.country
        };

        // Create a new client
        const newClient = await createClientInDB(clientData);

        // Get the roId from the request and add only the client’s email to the RO
        const roId = req.body.roId;  // This should come from the form or frontend
        if (!roId) throw new Error("RO ID is missing from the request");

        const updatedRO = await updateROWithClientEmail(roId, clientData.email);

        // Return success with the new client and updated RO
        res.status(201).json({ success: true, data: { newClient, updatedRO } });
    } catch (error) {
        console.error('Error creating client and updating RO with email:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getAllClients = async (req, res) => {
    try {
        const clients = await allClientList();  // Fetch all clients from the DB
        res.status(200).json({ success: true, data: clients });
    } catch (error) {
        console.error('Error fetching clients:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};