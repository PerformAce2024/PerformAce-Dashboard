import { connectToMongo } from "../config/db.js";
import bcrypt from "bcrypt";

// Function to create a new user in the auth collection
export const createUserAuthInDB = async (authData) => {
    const authDb = await connectToMongo();
    if (!authDb) throw new Error("MongoDB connection failed");

    const db = authDb.db("campaignAnalytics");
    const authCollection = db.collection("auth");

    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(authData.password, 10);

    const newUser = {
        email: authData.email,
        password: hashedPassword,  // Store the hashed password
        role: authData.role,
        createdAt: new Date(),
    };

    const result = await authCollection.insertOne(newUser);

    return { insertedId: result.insertedId, ...newUser };
};
