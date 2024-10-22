// PerformAce-Dashboard/Backend/index.js

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectToMongo } from './src/config/db.js';
import authRoute from './src/routes/auth.routes.js';
import taboolaRoutes from './src/routes/taboola.route.js';
import emailRoutes from './src/routes/email.routes.js';
import roRoutes from './src/routes/ro.routes.js'
import clientRoutes from './src/routes/client.routes.js';

dotenv.config();

// Define __dirname since it's not available in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors({
  origin: ['http://localhost:8001', 'http://127.0.0.1:8001'],
}));

const port = process.env.PORT || 8000;

app.use(express.json());

// Serve static files from the 'Frontend' directory
app.use(express.static(path.join(__dirname, 'Frontend')));

connectToMongo();

app.use('/auth', authRoute);
app.use('/api', taboolaRoutes);
app.use('/api', emailRoutes);
app.use('/api', roRoutes);
app.use('/api', clientRoutes);

app.get('/', (req, res) => {
  res.send('API Integration is running!');
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
