import { getDb } from "../config/db.js";
import { updateROWithClientEmail } from "./roService.js";

export const createClientInDB = async (clientData) => {
  try {
    // Connect to MongoDB
    console.log("Client data received:", clientData);
    console.log("RO ID type:", typeof clientData.roId);

    const db = await getDb();
    const clientCollection = db.collection("clients");
    const roclientCollection = db.collection("ro_client");

    const initialReleaseOrder = {
      roId: clientData.roId,
      roName: clientData.roName,
      soldBy: clientData.soldBy || [],
      addedOn: new Date(),
    };

    // Insert new client into the 'client' collection
    const result = await clientCollection.insertOne({
      name: clientData.name,
      phone: clientData.phone,
      email: clientData.email,
      releaseOrders: [initialReleaseOrder],
      createdAt: new Date(),
    });

    if (!result.insertedId) {
      throw new Error("Client creation failed");
    }

    console.log("Client created successfully with ID:", result.insertedId);
    const roclient = await roclientCollection.insertOne({
      clientId: result.insertedId,
      roId: [clientData.roId],
      soldBy: clientData.soldBy || [],
      addedOn: new Date(),
    });

    console.log(roclient);
    await updateROWithClientEmail(clientData.roId, clientData.email);
    return { clientId: result.insertedId, roclientId: roclient.insertedId };
  } catch (error) {
    console.error("Error creating client in DB:", error);
    throw new Error("Error creating client");
  }
};

export const addROToClient = async (clientId, roData) => {
  try {
    // Validate input
    if (!clientId || !roData.roId || !roData.roName) {
      throw new Error("Missing required fields");
    }

    // Format the new releaseOrder object
    const newReleaseOrder = {
      roId: roData.roId,
      roName: roData.roName,
      soldBy: roData.soldBy || [],
      addedOn: new Date(),
    };

    const db = await getDb();
    const clientCollection = db.collection("clients");
    const roclientCollection = db.collection("ro_client");

    // Check if the client exists
    const client = await clientCollection.findOne({
      _id: new ObjectId(clientId),
    });
    if (!client) {
      throw new Error(`Client with ID ${clientId} not found`);
    }

    // Check if this RO is already associated with this client
    const existingRO = client.releaseOrders?.find(
      (ro) => ro.roId === roData.roId
    );
    if (existingRO) {
      throw new Error(
        `This Release Order is already associated with this client`
      );
    }

    // Add the new RO to the client's releaseOrders array
    const updateResult = await clientCollection.updateOne(
      { _id: new ObjectId(clientId) },
      { $push: { releaseOrders: newReleaseOrder } }
    );

    if (updateResult.modifiedCount === 0) {
      throw new Error("Failed to update client with new RO");
    }

    // Also add to the ro_client collection
    const roclient = await roclientCollection.insertOne({
      clientId: new ObjectId(clientId),
      roId: [roData.roId],
      soldBy: roData.soldBy || [],
      addedOn: new Date(),
    });

    // Update the RO document to add the client's email
    await updateROWithClientEmail(roData.roId, client.email);

    return {
      success: true,
      message: "Release Order added to client successfully",
      data: {
        clientId,
        roId: roData.roId,
        roclientId: roclient.insertedId,
      },
    };
  } catch (error) {
    console.error("Error adding RO to client:", error);
    throw new Error(`Error adding RO to client: ${error.message}`);
  }
};

export const getClientWithROs = async (clientId) => {
  try {
    const db = await getDb();
    const clientCollection = db.collection("clients");

    // Find the client by ID
    const client = await clientCollection.findOne({
      _id: new ObjectId(clientId),
    });

    if (!client) {
      throw new Error(`Client with ID ${clientId} not found`);
    }

    return client;
  } catch (error) {
    console.error("Error fetching client with ROs:", error);
    throw new Error(`Error fetching client: ${error.message}`);
  }
};

export const removeROFromClient = async (clientId, roId) => {
  try {
    const db = await getDb();
    const clientCollection = db.collection("clients");
    const roclientCollection = db.collection("ro_client");

    // First, get the client to check if they exist
    const client = await clientCollection.findOne({
      _id: new ObjectId(clientId),
    });

    if (!client) {
      throw new Error(`Client with ID ${clientId} not found`);
    }

    // Remove the RO from the client's releaseOrders array
    const updateResult = await clientCollection.updateOne(
      { _id: new ObjectId(clientId) },
      { $pull: { releaseOrders: { roId: roId } } }
    );

    if (updateResult.modifiedCount === 0) {
      throw new Error("Failed to remove RO from client");
    }

    // Also remove from the ro_client collection
    await roclientCollection.deleteOne({
      clientId: new ObjectId(clientId),
      roId: roId,
    });

    return {
      success: true,
      message: "Release Order removed from client successfully",
    };
  } catch (error) {
    console.error("Error removing RO from client:", error);
    throw new Error(`Error removing RO from client: ${error.message}`);
  }
};

export const allClientList = async () => {
  try {
    // Connect to MongoDB
    const db = await getDb();
    const clientCollection = db.collection("clients");

    // Fetch all clients from the 'client' collection
    const clients = await clientCollection.find({}).toArray();

    return clients;
  } catch (error) {
    console.error("Error fetching client list from DB:", error);
    throw new Error("Error fetching clients");
  }
};
