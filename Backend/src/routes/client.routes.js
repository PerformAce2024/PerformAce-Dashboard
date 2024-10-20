import express from 'express';
import { createNewClient, createNewRO, getClient } from '../controllers/client.controller.js';

const router = express.Router();

// POST route to create a new client
router.post('/create-clients', createNewClient);

// POST route to create a new RO
router.post('/create-ro', createNewRO);

// GET route to get client details by ID
router.get('/get-clients', getClient);

// /get-ro/:id

export default router;
