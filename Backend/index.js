import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { connectToMongo } from './src/config/db.js';
import authRoute from './src/routes/auth.routes.js';
import adminRoute from './src/routes/admin.routes.js';
import taboolaRoutes from './src/routes/taboola.route.js';
import emailRoutes from './src/routes/email.routes.js';
import roRoutes from './src/routes/ro.routes.js';
import clientRoutes from './src/routes/client.routes.js';
import { loadTaboolaVariables } from './src/services/taboolaService.js';
import { verifyRole } from './src/middleware/rbacMiddleware.js';
import { verifyToken } from './src/middleware/jwtMiddleware.js';

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

// // Hardcoded admin credentials
// const adminCredentials = {
//     email: 'admin@growthz.ai',
//     password: 'admin@123',
//     role: 'admin',
// };

// JWT Login Route
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Find admin user from the MongoDB collection
    const db = await connectToMongo();
    const adminCollection = db.db('campaignAnalytics').collection('admin');
    const adminUser = await adminCollection.findOne({ email });

    if (!adminUser) {
        return res.status(401).json({ message: 'Admin not found' });
    }

    // Compare passwords (hashed)
    const isMatch = await bcrypt.compare(password, adminUser.password);
    if (!isMatch) {
        return res.status(401).json({ message: 'Incorrect password' });
    }

    // Create JWT token
    const token = jwt.sign({ email: adminUser.email, role: adminUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Send the token and admin role to the client
    res.json({ token, role: adminUser.role });
});

// Protect the admin dashboard route
app.get('/admin', verifyToken, verifyRole('admin'), (req, res) => {
    res.send('Welcome to the admin dashboard');
});

// Initialize server
(async () => {
    try {
        await connectToMongo();
        loadTaboolaVariables();
        app.use('/auth', authRoute);
        app.use('/admin', adminRoute);
        app.use('/api', taboolaRoutes);
        app.use('/api', emailRoutes);
        app.use('/api', roRoutes);
        app.use('/api', clientRoutes);

        app.listen(port, () => {
            console.log(`Server is running at http://localhost:${port}`);
        });
    } catch (error) {
        console.error("Error during initialization:", error);
    }
})();
