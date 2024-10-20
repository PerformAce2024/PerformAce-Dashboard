import { createClientInDB, getClientByName, allClientList } from '../services/clientService.js';
import { createROInDB } from '../services/roService.js';

// Create a new client
export const createNewClient = async (req, res) => {
    try {
        const clientData = {
            name: req.body.name,
            type: req.body.type,
            phone: req.body.phone,
            email: req.body.email,
            contactPerson: req.body.contactPerson,
            website: req.body.website,
            brandLogoFilePath: req.body.brandLogoFilePath,
            subdomain: req.body.subdomain,
            address: req.body.address,
            city: req.body.city,
            state: req.body.state,
            postcode: req.body.postcode,
            country: req.body.country
        };

        console.log('Sanitized Client Data:', clientData);

        const createdClient = await createClientInDB(clientData);
        res.status(201).json({ success: true, data: createdClient });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Create a new RO and match with client
export const createNewRO = async (req, res) => {
    try {
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

        // Check if client exists by name
        const client = await getClientByName(roData.client);

        if (client) {
            // If the client exists, add the CUID to the RO data
            roData.CUID = client.CUID;
        }

        // Create the new Release Order in the DB
        const createdRO = await createROInDB(roData);

        res.status(201).json({ success: true, data: createdRO });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get all client details
export const getClient = async (req, res) => {
    try {
      const clientList = await allClientList(); // Fetch all clients
      res.status(200).json({ success: true, data: clientList });
    } catch (error) {
      console.error('Error fetching clients:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  };  
