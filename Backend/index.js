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

dotenv.config();

// Define __filename and __dirname since it's not available in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 8000;

console.log('Initializing server...');

// Enable CORS and log the allowed origins
app.use(cors({
  origin: ['http://localhost:8001', 'http://127.0.0.1:8001'],
}));
console.log('CORS enabled for origins: http://localhost:8001, http://127.0.0.1:8001');

// Middleware to parse JSON
app.use(express.json());
console.log('JSON parsing enabled');

// Serve static files from the 'Frontend' directory
app.use(express.static(path.join(__dirname, 'Frontend')));
console.log(`Serving static files from: ${path.join(__dirname, 'Frontend')}`);

// Connect to MongoDB and log success or failure
connectToMongo()
  .then(() => {
    console.log('Connected to MongoDB successfully');
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
  });

// Log the registration of routes
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

// Default route for checking server status
app.get('/', (req, res) => {
  res.send('API Integration is running!');
  console.log('GET request received at /');
});

// Start the server and log the URL
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

