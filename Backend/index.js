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
import outbrainRoutes from './src/routes/outbrain.route.js';
import taboolaRoutes from './src/routes/taboola.route.js';
import emailRoutes from './src/routes/email.routes.js';
import roRoutes from './src/routes/ro.routes.js';
import clientRoutes from './src/routes/client.routes.js';
import { verifyRole } from './src/middleware/rbacMiddleware.js';
import { verifyToken } from './src/middleware/jwtMiddleware.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors({
    origin: ['http://localhost:8001', 'http://127.0.0.1:8001','http://192.168.137.1:8001','http://65.2.178.70:8001','http://15.207.141.92:8001','http://3.7.111.35:8001','http://PerformAce-alb-1441902511.ap-south-1.elb.amazonaws.com:8001'],
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

    try {
        const login = await connectToMongo();

        // First check if the user is an admin
        const adminCollection = login.db('campaignAnalytics').collection('admin');
        const adminUser = await adminCollection.findOne({ email });

        if (adminUser) {
            // Compare passwords (hashed)
            const isMatch = await bcrypt.compare(password, adminUser.password);
            if (isMatch) {
                const token = jwt.sign({ email: adminUser.email, role: adminUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
                return res.json({ token, role: adminUser.role });
            }
        }

        // If not admin, check in the client auth collection
        const authCollection = login.db('campaignAnalytics').collection('auth');
        const clientUser = await authCollection.findOne({ email });

        if (clientUser) {
            // Compare passwords (hashed)
            const isMatch = await bcrypt.compare(password, clientUser.password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid password' });
            }

            // Create JWT token for the client
            const token = jwt.sign({ email: clientUser.email, role: clientUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
            return res.json({ token, role: clientUser.role });
        }

        // If no user found in both collections
        return res.status(404).json({ message: 'User not found' });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Protect the admin dashboard route
app.get('/admin', verifyToken, verifyRole('admin'), (req, res) => {
    res.send('Welcome to the admin dashboard');
});

// Initialize server
(async () => {
    try {
        await connectToMongo();
        app.use('/auth', authRoute);
        app.use('/admin', adminRoute);
        app.use('/api', outbrainRoutes);
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
