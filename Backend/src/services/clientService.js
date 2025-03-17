import { getDb } from "../config/db.js";

export const createClientInDB = async (clientData) => {
  try {
    // Connect to MongoDB
    console.log(clientData, "", typeof clientData.roId);

    const db = await getDb();
    const clientCollection = db.collection("clients");
    const roclientCollection = db.collection("ro_client");

    // Insert new client into the 'client' collection
    const result = await clientCollection.insertOne({
      ...clientData,
      createdAt: new Date(),
    });

    if (!result.insertedId) {
      throw new Error("Client creation failed");
    }

    console.log("Client created successfully with ID:", result.insertedId);
    const roclient = await roclientCollection.insertOne({
      clientId: result.insertedId,
      roId: clientData.roId,
    });

    console.log(roclient);

    return roclient;
  } catch (error) {
    console.error("Error creating client in DB:", error);
    throw new Error("Error creating client");
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
