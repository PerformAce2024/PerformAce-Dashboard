import express from 'express';
import { auth, db } from '../services/firebaseService.js';  // Import Firebase Admin SDK

const router = express.Router();

// Token verification route
router.post('/verifyToken', async (req, res) => {
    console.log('POST /verifyToken route hit');
    
    const authorizationHeader = req.headers.authorization;
    
    if (!authorizationHeader) {
        console.error('Authorization header missing');
        return res.status(400).json({ error: 'Authorization header missing' });
    }

    const idToken = authorizationHeader.split('Bearer ')[1];
    
    if (!idToken) {
        console.error('Bearer token missing in authorization header');
        return res.status(400).json({ error: 'Bearer token missing' });
    }

    try {
        // Step 1: Verify the ID token with Firebase Admin SDK
        console.log('Verifying ID token with Firebase');
        const decodedToken = await auth.verifyIdToken(idToken);
        const uid = decodedToken.uid;
        console.log(`Token verified, UID: ${uid}`);

        // Step 2: Fetch user role from Firestore
        console.log(`Fetching user data from Firestore for UID: ${uid}`);
        const userDoc = await db.collection('users').doc(uid).get();
        const userData = userDoc.data();

        if (userData && userData.role) {
            console.log(`User role found: ${userData.role}`);
            res.json({ success: true, role: userData.role });
        } else {
            console.error('Role not found for user');
            res.status(404).json({ error: 'Role not found' });
        }
    } catch (error) {
        console.error('Error during token verification or Firestore fetch:', error);
        res.status(401).json({ error: 'Token verification failed' });
    }
});

export default router;
