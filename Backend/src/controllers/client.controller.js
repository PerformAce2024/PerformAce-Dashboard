import { createClientInDB, allClientList } from '../services/clientService.js';
import { updateROWithClientEmail } from '../services/roService.js';
import { createUserAuthInDB } from '../services/authService.js';

export const createClientAndAddEmailToRO = async (req, res) => {
    try {
        const clientData = {
            name: req.body.name,
            phone: req.body.phone,
            email: req.body.email,
            roName: req.body.roName,  // Save RO name
        };

        const authData = {
            email: req.body.email,
            password: req.body.password,
            role: req.body.role,
        };

        // Step 1: Create new client entry in DB
        const newClient = await createClientInDB(clientData);

        // Step 2: Create new auth user in DB
        const newAuthUser = await createUserAuthInDB(authData);

        // Step 3: Update RO by RO ID with client's email (using the roId)
        if (req.body.roId) {
            const updatedRO = await updateROWithClientEmail(req.body.roId, clientData.email);
            res.status(201).json({ success: true, data: { newClient, newAuthUser, updatedRO } });
        } else {
            res.status(400).json({ success: false, error: 'RO ID is required to update the RO' });
        }
    } catch (error) {
        console.error('Error creating client and user auth:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getAllClients = async (req, res) => {
    try {
        const clients = await allClientList();  // Fetch all clients from the DB
        console.log('Fetched Clients:', clients);
        res.status(200).json({ success: true, data: clients });
    } catch (error) {
        console.error('Error fetching clients:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};