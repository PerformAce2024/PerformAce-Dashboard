import express from 'express';
import { createRO, getAllROs } from '../controllers/ro.controller.js';
import { verifyToken } from './auth.routes.js';
import { verifyRole, verifyRoles } from '../middleware/rbacMiddleware.js';

const router = express.Router();

// Only admin can create a new RO
router.post('/create-ro', verifyToken, verifyRole('admin'), createRO);

// Admin and sales can view ROs
router.get('/get-ros', verifyToken, verifyRoles(['admin', 'sales']), getAllROs);

export default router;
