import express from 'express';
import { createClientAndAddEmailToRO, getAllClients } from '../controllers/client.controller.js';
import { submitCampaign } from '../controllers/campaign.controller.js';

const router = express.Router();

router.post('/create-client', createClientAndAddEmailToRO);

router.post('/submit-campaign', submitCampaign);

router.get('/get-clients', getAllClients);

export default router;
