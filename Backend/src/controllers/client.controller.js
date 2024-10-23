import { createClientInDB, allClientList } from '../services/clientService.js';
import { updateROWithClientEmail } from '../services/roService.js';

export const createClientAndAddEmailToRO = async (req, res) => {
  try {
    // Step 1: Extract client data from the request body
    const clientData = {
      name: req.body.name,
      phone: req.body.phone,
      email: req.body.email,
      roName: req.body.roName,  // Save RO name
    };

    console.log('Extracted client data from the request body', clientData);
    
    // Step 2: Save client details to MongoDB (client collection)
    const newClient = await createClientInDB(clientData);
    console.log('Saved client details to MongoDB');
  
    // Step 3: Update the corresponding RO with the client's email (if roId is provided)
    if (req.body.roId) {
      const updatedRO = await updateROWithClientEmail(req.body.roId, clientData.email);
      res.status(201).json({ success: true, data: { newClient, updatedRO } });
    } else {
      console.error('RO ID is missing');  // Log the error
      return res.status(400).json({ success: false, error: 'RO ID is required to update the RO' });
    }
    console.log('Step-3 completed!');
  } catch (error) {
    console.error('Error creating client and updating RO:', error);
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
