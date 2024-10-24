// PerformAce-Dashboard/Backend/src/routes/auth.routes.js
import express from 'express';
import { registerUser, loginUser } from '../controllers/auth.controller.js';  // Import the auth controller
import { verifyToken } from '../middleware/jwtMiddleware.js';  // Correct import

const router = express.Router();

// Route for registering a new user
router.post('/register', async (req, res) => {
    console.log('POST /register route hit');
    await registerUser(req, res);
});

// Route for logging in a user and generating a JWT token
router.post('/login', async (req, res) => {
    console.log('POST /login route hit');
    await loginUser(req, res);
});

// Route for verifying JWT token
router.get('/verify-token', async (req, res) => {
    console.log('GET /verify-token route hit');
    await verifyToken(req, res);
});

export default router;
