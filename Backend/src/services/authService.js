// PerformAce-Dashboard/Backend/src/services/authService.js
import { connectToMongo } from "../config/db.js";
import bcrypt from "bcrypt";

// Function to create a new user in the auth collection
export const createUserAuthInDB = async (authData) => {
    console.log('Connecting to MongoDB to create a new user...');
    const authDb = await connectToMongo();
    if (!authDb) {
        console.error('MongoDB connection failed');
        throw new Error('MongoDB connection failed');
    }

    const db = authDb.db('campaignAnalytics');
    const authCollection = db.collection('auth');

    // Hash the password before storing it
    console.log('Hashing the user password...');
    const hashedPassword = await bcrypt.hash(authData.password, 10);
    console.log('Password hashed successfully');

    // Creating new user object
    const newUser = {
        email: authData.email,
        password: hashedPassword,  // Store the hashed password
        role: authData.role,
        createdAt: new Date(),
    };

    console.log('Inserting new user into the auth collection:', newUser);
    const result = await authCollection.insertOne(newUser);
    console.log('New user created successfully with ID:', result.insertedId);

    return { insertedId: result.insertedId, ...newUser };
};
