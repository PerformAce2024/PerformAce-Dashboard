import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectToMongo } from './src/config/db.js'
import taboolaRoutes from './src/routes/taboola.route.js';

// Load environment variables from .env file
dotenv.config();

const app = express();
app.use(cors({ origin: 'http://127.0.0.1:8001' }));
const port = process.env.PORT || 8000;

// Middleware to parse JSON
app.use(express.json());

// Connect to MongoDB
connectToMongo();

// Use the Taboola route
app.use('/api', taboolaRoutes);

// Root endpoint to check if server is running
app.get('/', (req, res) => {
  res.send('Taboola API Integration is running!');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
