import { config } from 'dotenv';
import admin from 'firebase-admin';
import serviceAccount from '../secrets/serviceAccountKey.json' assert { type: 'json' };

// Load environment variables from the .env file
config();

let auth = null;
let db = null;

export const initializeFirebase = async () => {
  try {
    if (!admin.apps.length) {
      // Initialize Firebase Admin SDK
      console.log("Initializing Firebase Admin SDK...");
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      auth = admin.auth();
      db = admin.firestore();
      console.log("Firebase Auth and Firestore services initialized.");
    } else {
      console.log("Firebase app already initialized.");
    }
  } catch (error) {
    console.error("Error initializing Firebase Admin SDK:", error);
    throw error;
  }
};

// Export auth and db after they are initialized
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
