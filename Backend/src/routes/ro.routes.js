import express from 'express';
import { createNewRO, getRO } from '../controllers/ro.controller.js';

const router = express.Router();

// Route to create a new RO
router.post('/release-order', createNewRO);

// Route to get an RO by ID
router.get('/release-order/:id', getRO);

export default router;
