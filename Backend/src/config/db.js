import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

export async function connectToMongo() {
  try {
    const client = new MongoClient(uri);
    await client.connect();
    console.log("Connected to MongoDB");
    return client;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}
