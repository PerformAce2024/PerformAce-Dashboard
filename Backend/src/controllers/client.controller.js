import { createClientInDB, allClientList } from '../services/clientService.js';
import { updateROWithClientEmail } from '../services/roService.js';
import { createFirebaseUser } from '../services/firebaseService.js'; 

export const createClientAndAddEmailToRO = async (req, res) => {
    try {
        console.log('POST /create-client request body:', req.body);

        const clientData = {
            name: req.body.name,
            phone: req.body.phone,
            email: req.body.email,
            roName: req.body.roName,  // Save RO name
        };

        console.log('Creating client in DB with data:', clientData);
        const newClient = await createClientInDB(clientData);
        console.log('Client created successfully:', newClient);

        // Step 2: Create Firebase user and save role in Firestore
        const authData = {
            email: req.body.email,
            password: req.body.password,
            role: req.body.role,
        };

        console.log('Creating Firebase user with data:', authData);
        const newFirebaseUser = await createFirebaseUser(authData.email, authData.password, authData.role);
        console.log('Firebase user created successfully:', newFirebaseUser);

        // Step 3: Update RO by RO ID with client's email (using the roId)
        if (req.body.roId) {
            console.log(`Updating RO with ID: ${req.body.roId} with client email: ${clientData.email}`);
            const updatedRO = await updateROWithClientEmail(req.body.roId, clientData.email);
            console.log('RO updated successfully:', updatedRO);
            res.status(201).json({ success: true, data: { newClient, newFirebaseUser, updatedRO } });
        } else {
            console.error('RO ID is missing in the request');
            res.status(400).json({ success: false, error: 'RO ID is required to update the RO' });
        }
    } catch (error) {
        console.error('Error creating client and user auth:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getAllClients = async (req, res) => {
    try {
        console.log('GET /get-clients route hit');

        // Fetch all clients from the DB
        console.log('Fetching all clients from the DB');
        const clients = await allClientList();
        console.log('Clients fetched successfully:', clients);

        res.status(200).json({ success: true, data: clients });
    } catch (error) {
        console.error('Error fetching clients:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
