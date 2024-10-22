import express from 'express';
import { auth, db } from '../services/firebaseService.js';  // Import Firebase Admin SDK

const router = express.Router();

// Token verification middleware with detailed logging
export const verifyToken = async (req, res, next) => {
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader) {
        console.error('Authorization header is missing');
        return res.status(401).json({ error: 'Authorization header is missing' });
    }

    const idToken = authorizationHeader.split('Bearer ')[1]; // Extract the token

    try {
        console.log(`Verifying token: ${idToken}`);
        // Verify the ID token with Firebase Admin SDK
        const decodedToken = await auth.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        console.log(`Token verified for user: ${uid}, fetching role...`);

        // Fetch the user's role from Firestore
        const userDoc = await db.collection('users').doc(uid).get();
        const userData = userDoc.data();

        if (userData && userData.role) {
            console.log(`Role fetched for user ${uid}: ${userData.role}`);
            // Attach the user and role to the request object
            req.user = {
                uid,
                role: userData.role,
                email: userData.email
            };
            next(); // Proceed to the next middleware or route handler
        } else {
            console.error(`Role not found for user: ${uid}`);
            return res.status(404).json({ error: 'Role not found' });
        }
    } catch (error) {
        console.error('Token verification failed:', error.message);
        return res.status(401).json({ error: 'Token verification failed', details: error.message });
    }
};

// Protect this route for testing (e.g., you can use it to verify token)
router.post('/verifyToken', verifyToken, (req, res) => {
    console.log(`User role: ${req.user.role} successfully verified.`);
    res.json({ success: true, role: req.user.role });
});

export default router;
