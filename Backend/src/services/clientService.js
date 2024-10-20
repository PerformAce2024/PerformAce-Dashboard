import { connectToMongo } from "../config/db.js";
import { ObjectId } from "mongodb";

// Function to create a new client in the database
export const createClientInDB = async (clientData) => {
  const clientDb = await connectToMongo();
  if (!clientDb) {
    throw new Error("MongoDB connection failed");
  }

  const db = clientDb.db("campaignAnalytics");
  const clientCollection = db.collection("clients");

  // Generate a unique CUID for the client
  const newClient = {
    CUID: new ObjectId(), // Generate a unique ID for the client
    ...clientData,
    createdAt: new Date(),
  };

  // Insert the new client into the DB
  const result = await clientCollection.insertOne(newClient);

  return { insertedId: result.insertedId };
};

// Function to get a client by name
export const getClientByName = async (clientName) => {
  const clientDb = await connectToMongo();
  if (!clientDb) {
    throw new Error("MongoDB connection failed");
  }

  const db = clientDb.db("campaignAnalytics");
  const clientCollection = db.collection("clients");

  // Find a client by name
  const client = await clientCollection.findOne({ name: clientName });

  return client;
};

// Function to get a client by ID
export const allClientList = async () => {
  try {
    const clientDb = await connectToMongo();
    if (!clientDb) {
      throw new Error("MongoDB connection failed");
    }

    const db = clientDb.db("campaignAnalytics");
    const clientCollection = db.collection("clients");

    const clientList = await clientCollection.find({}).toArray();
    return clientList;
  } catch (error) {
    console.error("Error fetching clients:", error);
    res.status(500).send("Error fetching clients");
  }
};
