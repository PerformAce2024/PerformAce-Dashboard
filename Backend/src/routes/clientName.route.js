import express from 'express';
import { getClientName } from '../controllers/clientName.controller.js';

const router = express.Router();
router.get('/clientname/:email', getClientName);

export default router;