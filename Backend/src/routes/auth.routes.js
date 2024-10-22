// PerformAce-Dashboard/Backend/src/routes/auth.routes.js
import express from 'express';
import { auth, db } from '../services/firebaseService.js';  // Import Firebase Admin SDK

const router = express.Router();

// Token verification route
router.post('/verifyToken', async (req, res) => {
    const idToken = req.headers.authorization.split('Bearer ')[1]; // Extract the token

    try {
        // Step 1: Verify the ID token with Firebase Admin SDK
        const decodedToken = await auth.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        // Step 2: Fetch user role from Firestore
        const userDoc = await db.collection('users').doc(uid).get();
        const userData = userDoc.data();

        if (userData && userData.role) {
            res.json({ success: true, role: userData.role });
        } else {
            res.status(404).json({ error: 'Role not found' });
        }
    } catch (error) {
        res.status(401).json({ error: 'Token verification failed' });
    }
});

export default router;
