// PerformAce-Dashboard/Backend/src/controllers/admin.controller.js
import { createAdminInDB } from '../services/adminService.js';

export const createAdmin = async (req, res) => {
    try {
        const { email, password, role } = req.body;
        console.log('Received request to create a new admin with email:', email);

        // Call the service to create a new admin
        const newAdmin = await createAdminInDB(email, password, role);

        // If successful, return a 201 status with the new admin data
        res.status(201).json({ 
            message: 'Admin created successfully', 
            admin: newAdmin 
        });

    } catch (error) {
        console.error('Error creating admin:', error.message);

        if (error.message.includes('Admin with this email already exists')) {
            return res.status(400).json({ message: error.message });
        }

        // Handle server errors
        res.status(500).json({ message: 'Server error during admin creation' });
    }
};
