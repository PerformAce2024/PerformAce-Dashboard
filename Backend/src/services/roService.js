import { connectToMongo } from "../config/db.js";

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

    // Insert the new Release Order into the DB
    const result = await roCollection.insertOne(newRO);

    return { insertedId: result.insertedId };
};

// Function to retrieve a Release Order by its ID
export const getROById = async (roId) => {
    const clientDb = await connectToMongo();
    if (!clientDb) {
        throw new Error('MongoDB connection failed');
    }

    const db = clientDb.db('campaignAnalytics');
    const roCollection = db.collection('releaseOrders');

    const ro = await roCollection.findOne({ _id: new ObjectId(roId) });
    return ro;
};
