import { connectToMongo } from "../config/db.js";
import { ObjectId } from "mongodb";

// Function to create a new RO in the database
export const createROInDB = async (roData) => {
    console.log('Connecting to MongoDB to create a new RO...');
    const clientDb = await connectToMongo();
    if (!clientDb) {
        console.error('MongoDB connection failed');
        throw new Error('MongoDB connection failed');
    }

    const db = clientDb.db('campaignAnalytics');
    const roCollection = db.collection('releaseOrders');

    const newRO = {
        ...roData,
        createdAt: new Date(),
    };

    console.log('Inserting new RO into the database:', newRO);

    // Insert the new Release Order into the DB
    const result = await roCollection.insertOne(newRO);
    console.log('RO inserted successfully with ID:', result.insertedId);

    return { insertedId: result.insertedId };
};

// Update RO by adding the client's email
export const updateROWithClientEmail = async (roId, clientEmail) => {
    console.log(`Connecting to MongoDB to update RO with ID: ${roId}`);
    const clientDb = await connectToMongo();
    if (!clientDb) {
        console.error('MongoDB connection failed');
        throw new Error('MongoDB connection failed');
    }

    const db = clientDb.db('campaignAnalytics');
    const roCollection = db.collection('releaseOrders');

    console.log(`Updating RO with client email: ${clientEmail} for RO ID: ${roId}`);
    
    // Use $addToSet to ensure uniqueness in the array
    const result = await roCollection.updateOne(
        { _id: new ObjectId(roId) },
        {
            $addToSet: { clientEmail: clientEmail } // Add the email to the array if it doesn't exist
        }
    );

    if (result.matchedCount === 0) {
        console.error(`No RO found with ID: ${roId}`);
        throw new Error(`No RO found with ID: ${roId}`);
    }

    console.log('RO updated successfully:', result);
    return result;
};

// Function to get all ROs from the database
export const getAllROsFromDB = async () => {
    console.log('Connecting to MongoDB to fetch all ROs...');
    const clientDb = await connectToMongo();
    if (!clientDb) {
        console.error('MongoDB connection failed');
        throw new Error('MongoDB connection failed');
    }

    const db = clientDb.db('campaignAnalytics');
    const roCollection = db.collection('releaseOrders');

    console.log('Fetching all Release Orders from the database...');
    // Fetch all Release Orders
    const ros = await roCollection.find({}).toArray();
    console.log('ROs fetched successfully:', ros);

    return ros;
};
