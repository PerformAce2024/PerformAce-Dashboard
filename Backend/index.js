import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectToMongo } from './src/config/db.js';
import authRoute from './src/routes/auth.routes.js';
import taboolaRoutes from './src/routes/taboola.route.js';
import emailRoutes from './src/routes/email.routes.js';
import roRoutes from './src/routes/ro.routes.js';
import clientRoutes from './src/routes/client.routes.js';
import { initializeFirebase } from './src/services/firebaseService.js';  // Import the initialization function
import { loadTaboolaVariables } from './src/services/taboolaService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors({
  origin: ['http://localhost:8001', 'http://127.0.0.1:8001'],
}));

const port = process.env.PORT || 8000;
app.use(express.json());
app.use(express.static(path.join(__dirname, 'Frontend')));

(async () => {
  try {
    console.log("Initializing server...");

    await connectToMongo();  // Await MongoDB connection

    await initializeFirebase();  // Await Firebase initialization
    console.log("Firebase services initialized.");

    console.log("Loading Taboola Variables...");
    loadTaboolaVariables();  // Load Taboola variables
    console.log("Taboola Variables loaded.");

    app.use('/auth', authRoute);
    console.log('Registered /auth route');

    app.use('/api', taboolaRoutes);
    console.log('Registered /api (Taboola) route');

    app.use('/api', emailRoutes);
    console.log('Registered /api (Email) route');

    app.use('/api', roRoutes);
    console.log('Registered /api (RO) route');

    app.use('/api', clientRoutes);
    console.log('Registered /api (Client) route');

    app.get('/', (req, res) => {
      res.send('API Integration is running!');
    });

    app.listen(port, () => {
      console.log(`Server is running at http://localhost:${port}`);
    });

  } catch (error) {
    console.error("Error during initialization:", error);
  }
})();
