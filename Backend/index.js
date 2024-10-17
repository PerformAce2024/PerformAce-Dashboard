// PerformAce-Dashboard/Backend/index.js

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectToMongo } from './src/config/db.js';
import taboolaRoutes from './src/routes/taboola.route.js';
import emailRoutes from './src/routes/email.routes.js'; // Import the email route

dotenv.config();

const app = express();
app.use(cors({ origin: 'http://127.0.0.1:8001' }));
const port = process.env.PORT || 8000;

app.use(express.json());

connectToMongo();

app.use('/api', taboolaRoutes); // Existing Taboola routes
app.use('/api', emailRoutes); // Add the email route

app.get('/', (req, res) => {
  res.send('API Integration is running!');
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
