import { connectToMongo } from "../config/db.js";
import { ObjectId } from "mongodb";

// Function to create a new client in the database
export const createClientInDB = async (clientData) => {
  console.log('Connecting to MongoDB to create a new client...');
  const clientDb = await connectToMongo();
  if (!clientDb) {
    console.error('MongoDB connection failed');
    throw new Error('MongoDB connection failed');
  }

  const db = clientDb.db('campaignAnalytics');
  const clientCollection = db.collection('clients');

  // Add client creation timestamp
  const newClient = { ...clientData, createdAt: new Date() };
  console.log('Inserting new client into the database:', newClient);
  const result = await clientCollection.insertOne(newClient);
  console.log('New client created successfully with ID:', result.insertedId);

  return { insertedId: result.insertedId, ...newClient };
};

// Function to get a list of all clients
export const allClientList = async () => {
  console.log('Connecting to MongoDB to retrieve the client list...');
  const clientDb = await connectToMongo();
  if (!clientDb) {
    console.error('MongoDB connection failed');
    throw new Error('MongoDB connection failed');
  }

  const db = clientDb.db('campaignAnalytics');
  const clientCollection = db.collection('clients');

  console.log('Fetching all clients from the database...');
  // Find all clients
  const clientList = await clientCollection.find({}).toArray();
  console.log('Client list retrieved successfully:', clientList);

  return clientList;
};
