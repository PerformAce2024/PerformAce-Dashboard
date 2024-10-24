// PerformAce-Dashboard/Backend/src/services/adminService.js
import bcrypt from 'bcrypt';
import { connectToMongo } from '../config/db.js';

// Service function to create a new admin
export const createAdminInDB = async (email, password, role = 'admin') => {
    try {
        console.log('Connecting to MongoDB to create a new admin...');
        const db = await connectToMongo();
        const adminCollection = db.db('campaignAnalytics').collection('admin');

        // Check if the admin already exists
        const existingAdmin = await adminCollection.findOne({ email });
        if (existingAdmin) {
            console.error(`Admin with email ${email} already exists`);
            throw new Error('Admin with this email already exists');
        }

        // Hash the password before saving it
        console.log('Hashing password...');
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('Password hashed successfully');

        // Create the new admin data
        const newAdmin = {
            email,
            password: hashedPassword,  // Save the hashed password
            role,  // Use the provided role or default to 'admin'
            createdAt: new Date(),
        };

        // Insert the new admin into the admin collection
        console.log('Inserting new admin into the database...');
        await adminCollection.insertOne(newAdmin);
        console.log('New admin created successfully with ID:', newAdmin._id);

        return newAdmin;
    } catch (error) {
        console.error('Error creating admin in DB:', error.message);
        throw error;
    }
};
