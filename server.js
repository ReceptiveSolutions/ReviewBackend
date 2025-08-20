// server.js
import 'dotenv/config'; // This is the correct way for ES modules

import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import './config/passport.js'; // Google strategy config
import { PrismaClient } from './generated/prisma/index.js';
import busineRoutes from './routes/businessRoutes.js'; // Import business routes

// Routes
import companyRoutes from './routes/companyRoutes.js';
import userRoutes from './routes/authRoutes.js';

// Add this debug to verify env vars are loaded
console.log('🔍 Debug - Environment variables:');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET');

const app = express();
const prisma = new PrismaClient();

/* ------------------ MIDDLEWARE ------------------ */
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));
// Session middleware (required for Passport session support)
app.use(session({
    secret: process.env.SESSION_SECRET || 'supersecret',
    resave: false,
    saveUninitialized: false
}));



// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

/* ------------------ DATABASE CONNECTION ------------------ */
(async () => {
    try {
        await prisma.$connect();
        console.log("✅ Connected to PostgreSQL database");
    } catch (err) {
        console.error("❌ Database connection failed:", err.message);
        process.exit(1);
    }
})();

/* ------------------ ROUTES ------------------ */
app.get('/', (req, res) => {
    res.send('API is running...');
});

app.use('/api/companies', companyRoutes);
app.use('/api/auth', userRoutes);
app.use('/api/business', busineRoutes);

/* ------------------ ERROR HANDLING ------------------ */
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

/* ------------------ GRACEFUL SHUTDOWN ------------------ */
process.on('SIGINT', async () => {
    console.log("\n🔄 Shutting down gracefully...");
    await prisma.$disconnect();
    process.exit(0);
});

/* ------------------ SERVER START ------------------ */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
