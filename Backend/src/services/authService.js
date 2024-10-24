// PerformAce-Dashboard/Backend/src/services/authService.js
import { connectToMongo } from "../config/db.js";
import bcrypt from "bcrypt";

// Function to save user credentials (email, hashed password, role) in the auth collection
export const saveAuthCredentials = async (authData) => {
    try {
        console.log('Connecting to MongoDB to create a new user in the auth collection...');
        const authDb = await connectToMongo();
        if (!authDb) {
            console.error('MongoDB connection failed');
            throw new Error('MongoDB connection failed');
        }

        const db = authDb.db('campaignAnalytics');
        const authCollection = db.collection('auth');

        // Step 1: Check if the user already exists in the auth collection
        const existingUser = await authCollection.findOne({ email: authData.email });
        if (existingUser) {
            console.error(`User with email ${authData.email} already exists.`);
            throw new Error(`User with email ${authData.email} already exists.`);
        }

        // Step 2: Hash the password before storing it
        console.log('Hashing the user password...');
        const hashedPassword = await bcrypt.hash(authData.password, 10);
        console.log('Password hashed successfully');

        // Step 3: Create the new user object with hashed password
        const newUser = {
            email: authData.email,
            password: hashedPassword,  // Store the hashed password
            role: authData.role,
            createdAt: new Date(),
        };

        // Step 4: Insert the new user into the auth collection
        console.log('Inserting new user into the auth collection:', newUser);
        const result = await authCollection.insertOne(newUser);
        console.log('New user created successfully with ID:', result.insertedId);

        // Return the inserted user details (excluding the password)
        return {
            insertedId: result.insertedId,
            email: newUser.email,
            role: newUser.role,
            createdAt: newUser.createdAt
        };
    } catch (error) {
        console.error('Error saving auth credentials:', error);
        throw new Error(error.message);
    }
};
