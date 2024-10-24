// PerformAce-Dashboard/Backend/src/routes/admin.routes.js
import express from 'express';
import { createAdmin } from '../controllers/admin.controller.js';

const router = express.Router();

// API route to create a new admin
router.post('/create-admin', createAdmin);

export default router;
