import express from 'express';
import { createClientAndAddEmailToRO, getAllClients } from '../controllers/client.controller.js';
import { getCampaignIdsByClientEmailAndRO, submitCampaign } from '../controllers/campaign.controller.js';

const router = express.Router();

// Get all clients route
router.get('/get-clients', (req, res, next) => {
    console.log('GET /get-clients route hit');
    getAllClients(req, res, next)
        .then(() => console.log('Successfully retrieved clients'))
        .catch(error => {
            console.error('Error retrieving clients:', error);
            next(error);
        });
});

// Create a client and add email to RO route
router.post('/create-client', (req, res, next) => {
    console.log('POST /create-client route hit');
    console.log('Request body:', req.body);
    
    createClientAndAddEmailToRO(req, res, next)
        .then(() => console.log('Client successfully created and email added to RO'))
        .catch(error => {
            console.error('Error creating client or adding email to RO:', error);
            next(error);
        });
});

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
