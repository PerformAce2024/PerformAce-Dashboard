import express from 'express';
import { createClientAndAddEmailToRO, getAllClients } from '../controllers/client.controller.js';
import { getCampaignIdsByClientEmailAndRO, submitCampaign } from '../controllers/campaign.controller.js';

const router = express.Router();

router.get('/get-clients', getAllClients);

router.post('/create-client', createClientAndAddEmailToRO);

router.get('/get-campaign-ids', getCampaignIdsByClientEmailAndRO);

router.post('/submit-campaign', submitCampaign);

export default router;
