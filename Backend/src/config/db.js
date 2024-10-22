// PerformAce-Dashboard/Backend/src/config/db.js
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

// Create MongoClient instance using the MongoDB URL from environment variables
const client = new MongoClient(process.env.MONGODB_URL);

export const connectToMongo = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    await client.connect();
    console.log('Successfully connected to MongoDB');
    return client;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    throw error;
  }
};
