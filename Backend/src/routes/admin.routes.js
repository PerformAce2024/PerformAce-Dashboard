import express from 'express';
import bcrypt from 'bcrypt';  // For password hashing
import { connectToMongo } from '../config/db.js';  // MongoDB connection

const router = express.Router();

// API route to create a new admin
router.post('/create-admin', async (req, res) => {
    const { email, password, role } = req.body;

    try {
        const db = await connectToMongo();
        const adminCollection = db.db('campaignAnalytics').collection('admin');

        // Check if the admin already exists
        const existingAdmin = await adminCollection.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ message: 'Admin with this email already exists' });
        }

        // Hash the password before saving it
        const hashedPassword = await bcrypt.hash(password, 10);  // 10 is the salt rounds

        // Create new admin data
        const newAdmin = {
            email,
            password: hashedPassword,
            role: role || 'admin',  // Default role is 'admin'
            createdAt: new Date(),
        };

        // Insert the new admin into the admin collection
        await adminCollection.insertOne(newAdmin);

        res.status(201).json({ message: 'Admin created successfully', admin: newAdmin });
    } catch (error) {
        console.error('Error creating admin:', error);
        res.status(500).json({ message: 'Server error during admin creation' });
    }
});

export default router;
