import express from 'express';
import { createClientAndAddEmailToRO, getAllClients } from '../controllers/client.controller.js';
import { getCampaignIdsByClientEmailAndRO, submitCampaign } from '../controllers/campaign.controller.js';
import { verifyToken } from '../middleware/jwtMiddleware.js'; // Ensure the token is verified first
import { verifyRole } from '../middleware/rbacMiddleware.js';  // Import the RBAC middleware

const router = express.Router();

// Route to create client and add email to RO
router.post('/create-client', verifyToken, verifyRole('admin'), createClientAndAddEmailToRO);

// Route to get all clients
router.get('/get-clients', verifyToken, verifyRole('admin'), getAllClients);

// // Only admin can access the route to create a new client
// router.post('/create-client', verifyToken, verifyRole('admin'), createClientAndAddEmailToRO);

// // Admin or sales can access the route to get all clients
// router.get('/get-clients', verifyToken, verifyRoles(['admin', 'sales']), getAllClients);

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

// Submit campaign route
router.post('/submit-campaign', (req, res, next) => {
    console.log('POST /submit-campaign route hit');
    console.log('Request body:', req.body);
    
    submitCampaign(req, res, next)
        .then(() => console.log('Campaign successfully submitted'))
        .catch(error => {
            console.error('Error submitting campaign:', error);
            next(error);
        });
});

export default router;
