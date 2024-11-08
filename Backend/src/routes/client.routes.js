import express from 'express';
import { createClientAndAddEmailToRO, getAllClients } from '../controllers/client.controller.js';
import { getCampaignIdsByClientEmailAndRO, submitCampaign } from '../controllers/campaign.controller.js';
import { verifyToken } from '../middleware/jwtMiddleware.js';
import { verifyRole } from '../middleware/rbacMiddleware.js';

const router = express.Router();

// Route to create client and add email to RO
router.post('/create-client', verifyToken, verifyRole('admin'), createClientAndAddEmailToRO);

// Route to get all clients
router.get('/get-clients', verifyToken, verifyRole('admin'), getAllClients);

// Get campaign IDs by client email and RO route
router.get('/get-campaign-ids', (req, res, next) => {
    console.log('GET /get-campaign-ids route hit');
    console.log('Query parameters:', req.query);

    getCampaignIdsByClientEmailAndRO(req, res, next)
        .then(() => console.log('Successfully retrieved campaign IDs'))
        .catch(error => {
            console.error('Error retrieving campaign IDs:', error);
            next(error);
        });
});

// Simplified submit campaign route
router.post('/submit-campaign', submitCampaign);

export default router;
