import express from 'express';
import { createRO, getAllROs } from '../controllers/ro.controller.js';

const router = express.Router();

router.post('/create-ro', createRO);
router.get('/get-ros', getAllROs);

export default router;
