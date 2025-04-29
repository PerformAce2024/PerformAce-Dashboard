import {
  createClientInDB,
  allClientList,
  getClientWithROs,
  addROToClient,
} from "../services/clientService.js";
import { updateROWithClientEmail } from "../services/roService.js";
import { saveAuthCredentials } from "../services/authService.js";
import { getDb } from "../config/db.js";

export const createClientAndAddEmailToRO = async (req, res) => {
  try {
    // Step 1: Extract client data from the request body
    const clientData = {
      name: req.body.name,
      phone: req.body.phone,
      email: req.body.email,
      roName: req.body.roName, // Save RO name
      roId: req.body.roId,
      soldBy: req.body.soldBy || [],
    };

    console.log("Extracted client data from the request body:", clientData);
    if (
      clientData.soldBy &&
      (!Array.isArray(clientData.soldBy) || clientData.soldBy.length === 0)
    ) {
      return res.status(400).json({
        success: false,
        error: "soldBy must be a valid array of sales IDs",
      });
    }

    // Step 2: Save client details to MongoDB (client collection)
    const newClient = await createClientInDB(clientData);
    console.log("Saved client details to MongoDB:", newClient);

    // Step 3: Save the credentials (email, password, and role) in the auth collection
    const authData = {
      email: req.body.email,
      password: req.body.password, // Ensure the password will be hashed in authService
      role: "Client",
    };

    const authResult = await saveAuthCredentials(authData);
    console.log("Saved auth credentials:");

    // Step 4: Update the corresponding RO with the client's email (if roId is provided)
    if (req.body.roId) {
      const updatedRO = await updateROWithClientEmail(
        req.body.roId,
        clientData.email
      );
      console.log("Updated RO with client email:", updatedRO);
      res.status(201).json({
        success: true,
        message:
          "Client created, credentials saved, and RO updated successfully",
        data: { newClient, authResult, updatedRO },
      });
    } else {
      console.error("RO ID is missing");
      res
        .status(400)
        .json({ success: false, error: "RO ID is required to update the RO" });
    }
  } catch (error) {
    console.error(
      "Error creating client, saving credentials, or updating RO:",
      error
    );
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAllClients = async (req, res) => {
  try {
    console.log("GET /get-clients route hit");

    // Fetch all clients from the DB
    console.log("Fetching all clients from the DB");
    const clients = await allClientList();
    console.log("Clients fetched successfully:", clients);

    res.status(200).json({ success: true, data: clients });
  } catch (error) {
    console.error("Error fetching clients:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const clientExists = async (name, roNumber) => {
  const clientDb = await getDb();

  const collection = clientDb.collection("clients");
  const existingClient = await collection.findOne({ name });
  if (existingClient) {
    // Update the client document to include the new RO number in an array
    await collection.updateOne(
      { name },
      { $addToSet: { roNumbers: roNumber } } // Ensures no duplicate RO numbers
    );
    return existingClient.name;
  }

  return null;
};

export const getClient = async (req, res) => {
  try {
    const { clientId } = req.params;

    if (!clientId) {
      return res.status(400).json({
        success: false,
        error: "Client ID is required",
      });
    }

    const client = await getClientWithROs(clientId);
    res.status(200).json({
      success: true,
      data: client,
    });
  } catch (error) {
    console.error("Error fetching client:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const addReleaseOrderToClient = async (req, res) => {
  try {
    const { clientId } = req.params;
    const roData = {
      roId: req.body.roId,
      roName: req.body.roName,
      soldBy: req.body.soldBy || [],
    };

    // Validate required fields
    if (!clientId || !roData.roId || !roData.roName) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    // Validate soldBy array
    if (roData.soldBy && !Array.isArray(roData.soldBy)) {
      return res.status(400).json({
        success: false,
        error: "soldBy must be a valid array of sales IDs",
      });
    }

    const result = await addROToClient(clientId, roData);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error adding RO to client:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Add function to remove an RO from a client
export const removeReleaseOrderFromClient = async (req, res) => {
  try {
    const { clientId, roId } = req.params;

    if (!clientId || !roId) {
      return res.status(400).json({
        success: false,
        error: "Client ID and RO ID are required",
      });
    }

    const result = await removeROFromClient(clientId, roId);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error removing RO from client:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Add function to get all ROs for a specific client
export const getClientROs = async (req, res) => {
  try {
    const { clientId } = req.params;

    if (!clientId) {
      return res.status(400).json({
        success: false,
        error: "Client ID is required",
      });
    }

    const client = await getClientWithROs(clientId);

    res.status(200).json({
      success: true,
      data: client.releaseOrders || [],
    });
  } catch (error) {
    console.error("Error fetching client ROs:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
