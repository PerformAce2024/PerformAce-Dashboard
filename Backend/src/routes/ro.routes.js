import express from 'express';
import { createRO, getAllROs } from '../controllers/ro.controller.js';

const router = express.Router();

// POST route for creating a release order (RO)
router.post('/create-ro', (req, res, next) => {
    console.log('POST /create-ro route hit');
    console.log('Request body:', req.body);  // Log the incoming request body

    createRO(req, res, next)
        .then(() => console.log('RO successfully created'))
        .catch(error => {
            console.error('Error creating RO:', error);
            next(error);
        });
});

// GET route for fetching all release orders (ROs)
router.get('/get-ros', (req, res, next) => {
    console.log('GET /get-ros route hit');

    getAllROs(req, res, next)
        .then(() => console.log('Successfully retrieved all ROs'))
        .catch(error => {
            console.error('Error retrieving ROs:', error);
            next(error);
        });
});

export default router;
