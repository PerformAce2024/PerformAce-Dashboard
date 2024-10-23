import { connectToMongo } from '../config/db.js';

export const createClientInDB = async (clientData) => {
  try {
    // Connect to MongoDB
    const db = await connectToMongo();
    const clientCollection = db.db('campaignAnalytics').collection('client');

    // Insert new client into the 'client' collection
    const result = await clientCollection.insertOne({
      ...clientData,
      createdAt: new Date(),
    });

    if (!result.insertedId) {
      throw new Error('Client creation failed');
    }
    
    console.log('Client created successfully with ID:', result.insertedId);
    return result;
  } catch (error) {
    console.error('Error creating client in DB:', error);
    throw new Error('Error creating client');
  }
};

export const allClientList = async () => {
  try {
    // Connect to MongoDB
    const db = await connectToMongo();
    const clientCollection = db.db('campaignAnalytics').collection('client');

    // Fetch all clients from the 'client' collection
    const clients = await clientCollection.find({}).toArray();
    return clients;
  } catch (error) {
    console.error('Error fetching client list from DB:', error);
    throw new Error('Error fetching clients');
  }
};
