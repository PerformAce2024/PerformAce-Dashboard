// Backend/src/routes/ro.routes.js
import express from 'express';
import { createRO, getAllROs } from '../controllers/ro.controller.js';
import { verifyToken } from '../middleware/jwtMiddleware.js';
import { verifyRole } from '../middleware/rbacMiddleware.js';
import { connectToMongo } from '../config/db.js';

const router = express.Router();

// Admin routes
router.post('/admin/create-ro', verifyToken, verifyRole('admin'), createRO);
router.get('/admin/get-ros', verifyToken, verifyRole('admin'), getAllROs);

// Client routes
router.get('/client/ros/:clientEmail', async (req, res) => {
    let client;
    try {
        client = await connectToMongo();
        const db = client.db('campaignAnalytics');
        
        const { clientEmail } = req.params;
        console.log('Fetching ROs for client:', clientEmail);

        // First check if client exists
        const clientExists = await db.collection('clientDailyMetrics')
            .findOne({ clientEmail });

        if (!clientExists) {
            return res.status(404).json({
                success: false,
                error: 'Client not found'
            });
        }

        // Fetch distinct roNumbers for the client
        const roNumbers = await db.collection('clientDailyMetrics')
            .aggregate([
                { 
                    $match: { 
                        clientEmail: clientEmail,
                        roNumber: { $exists: true, $ne: null } // Ensure roNumber exists and is not null
                    }
                },
                {
                    $group: {
                        _id: "$roNumber"
                    }
                },
                {
                    $sort: { _id: 1 } // Sort roNumbers in ascending order
                }
            ])
            .toArray();

        // Map the results to get just the roNumbers
        const formattedRoNumbers = roNumbers.map(doc => doc._id);

        console.log('Found RO numbers:', formattedRoNumbers);

        res.json({
            success: true,
            data: formattedRoNumbers
        });
    } catch (error) {
        console.error('Error fetching ROs:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch ROs'
        });
    } finally {
        if (client) await client.close();
    }
});

export default router;