import express from 'express';
import { getCPCByRoNumber } from '../controllers/releaseOrders.controller.js';

const router = express.Router();

router.get('/cpc/:roNumber', async (req, res) => {
    console.log('GET /cpc/:roNumber route hit');
    await getCPCByRoNumber(req, res);
});

export default router;