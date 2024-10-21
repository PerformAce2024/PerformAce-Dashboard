import { connectToMongo } from "../config/db.js";
import { ObjectId } from "mongodb";

// Function to create a new client in the database
export const createClientInDB = async (clientData) => {
  const clientDb = await connectToMongo();
  if (!clientDb) throw new Error("MongoDB connection failed");

  const db = clientDb.db("campaignAnalytics");
  const clientCollection = db.collection("clients");

  const newClient = { ...clientData, createdAt: new Date() };
  const result = await clientCollection.insertOne(newClient);

  return { insertedId: result.insertedId, ...newClient };
};

// Function to get a list of all clients
export const allClientList = async () => {
  const clientDb = await connectToMongo();
  if (!clientDb) {
    throw new Error("MongoDB connection failed");
  }

  const db = clientDb.db("campaignAnalytics");
  const clientCollection = db.collection("clients");

  // Find all clients
  const clientList = await clientCollection.find({}).toArray();
  return clientList;
};