import express from 'express';
import { createRO, getAllROs } from '../controllers/ro.controller.js';
import { verifyToken } from '../middleware/jwtMiddleware.js';
import { verifyRole } from '../middleware/rbacMiddleware.js';

const router = express.Router();
router.post('/create-ro', verifyToken, verifyRole('admin'), createRO);

// Admin and sales can view ROs
router.get('/get-ros', verifyToken, verifyRole('admin'), getAllROs);

export default router;

