import { connectToMongo } from "../config/db.js";
import { ObjectId } from "mongodb";

// Function to create a new RO in the database
export const createROInDB = async (roData) => {
    const clientDb = await connectToMongo();
    if (!clientDb) {
        throw new Error('MongoDB connection failed');
    }

    const db = clientDb.db('campaignAnalytics');
    const roCollection = db.collection('releaseOrders');

    const newRO = {
        ...roData,
        createdAt: new Date(),
    };

    console.log("Inserting RO into the database:", newRO);

    // Insert the new Release Order into the DB
    const result = await roCollection.insertOne(newRO);

    return { insertedId: result.insertedId };
};

// Update RO by adding the client's email
export const updateROWithClientEmail = async (roId, clientEmail) => {
    const clientDb = await connectToMongo();
    if (!clientDb) throw new Error("MongoDB connection failed");

    const db = clientDb.db('campaignAnalytics');
    const roCollection = db.collection('releaseOrders');

    // Find the RO by ID and add the client's email to the contactEmail field
    const result = await roCollection.updateOne(
        { _id: new ObjectId(roId) },
        {
            $push: { clientEmail: clientEmail }
        }
    );

    if (result.matchedCount === 0) {
        throw new Error(`No RO found with id: ${roId}`);
    }

    return result;
};

// Function to get all ROs from the database
export const getAllROsFromDB = async () => {
    const clientDb = await connectToMongo();
    if (!clientDb) {
        throw new Error('MongoDB connection failed');
    }

    const db = clientDb.db('campaignAnalytics');
    const roCollection = db.collection('releaseOrders');

    // Fetch all Release Orders
    const ros = await roCollection.find({}).toArray();
    return ros;
};
