import { connectToMongo } from '../config/db.js';  // Assuming you have a MongoDB connection

export const getUserByEmail = async (email) => {
    const clientDb = await connectToMongo();
    if (!clientDb) {
        console.error('MongoDB connection failed');
        throw new Error('MongoDB connection failed');
    }

    const db = clientDb.db('campaignAnalytics');
    const authCollection = db.collection('auth');

    const result = await authCollection.findOne({ email });
    return result;
};
