// Import dotenv using the ES module syntax
import { config } from 'dotenv';

// Load environment variables from the .env file
config();

// Import the entire firebase-admin package
import admin from 'firebase-admin';

// Import the service account key JSON file
import serviceAccount from '../secrets/serviceAccountKey.json' assert { type: 'json' };

// Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

// Get Firebase Auth and Firestore services from the admin package
const auth = admin.auth();
const db = admin.firestore();

// Export both auth and db so they can be used in other files
export { auth, db };

/**
 * Function to create a Firebase user and store the role in Firestore
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @param {string} role - User's role (e.g., 'admin', 'client', 'sales')
 * @returns {object} - Firebase user record
 */
export const createFirebaseUser = async (email, password, role) => {
    try {
        // Create user in Firebase Authentication
        const userRecord = await auth.createUser({
            email: email,
            password: password,
        });

        // Save user role and email in Firestore under the 'users' collection
        await db.collection('users').doc(userRecord.uid).set({
            email: email,
            role: role,
        });

        console.log('User created successfully:', userRecord.uid);
        return userRecord; // Return the created user record
    } catch (error) {
        console.error('Error creating Firebase user:', error.message);
        throw new Error('Error creating Firebase user: ' + error.message);
    }
};
