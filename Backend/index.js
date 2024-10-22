// Importing necessary modules
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
import { initializeFirebase } from './src/services/firebaseService.js';
import { loadTaboolaVariables } from './src/services/taboolaService.js';
import { verifyRole, verifyRoles } from './src/middleware/rbacMiddleware.js';
import verifyToken from './src/middleware/jwtMiddleware.js';
import bcrypt from 'bcrypt';  // For password hashing
import jwt from 'jsonwebtoken';  // For JWT generation

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

// JWT Login Route (Dynamic with MongoDB)
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find the user in MongoDB
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: 'Invalid email' });
        }

        // Verify the password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        // Create JWT Token
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ token, role: user.role });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Example of creating a client (protected route)
app.post('/api/create-client', verifyToken, verifyRole('admin'), async (req, res) => {
    try {
        const { name, phone, email, password, role, roName, roId } = req.body;

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user in MongoDB
        const newUser = new User({
            name,
            phone,
            email,
            password: hashedPassword,
            role,
            roName,
            roId
        });

        await newUser.save();

        res.json({ message: 'Client created successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating client' });
    }
});

// Initialize server
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
        app.use('/api', taboolaRoutes);
        app.use('/api', emailRoutes);
        app.use('/api', roRoutes);
        app.use('/api', clientRoutes);

        app.get('/admin', verifyToken, verifyRole('admin'), (req, res) => {
            res.send('Welcome, admin');
        });

        app.get('/sales', verifyToken, verifyRole('sales'), (req, res) => {
            res.send('Welcome, sales');
        });

        app.get('/client', verifyToken, verifyRole('client'), (req, res) => {
            res.send('Welcome, client');
        });

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
