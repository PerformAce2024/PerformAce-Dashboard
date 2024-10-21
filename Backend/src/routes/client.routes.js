import express from 'express';
import { createClientAndAddEmailToRO, getAllClients } from '../controllers/client.controller.js';

const router = express.Router();

router.post('/create-client', createClientAndAddEmailToRO);
router.get('/get-clients', getAllClients);

export default router;
