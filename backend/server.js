/* 
 * Express Server Bootstrap Entry
 * Loads middlewares, database connections, route mappings, and global error handlers
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const env = require('./config/env');
const { connectDB, sequelize } = require('./config/database');
const { errorHandler } = require('./middleware/errorMiddleware');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const walletRoutes = require('./routes/walletRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const billRoutes = require('./routes/billRoutes');
const fraudRoutes = require('./routes/fraudRoutes');
const insightRoutes = require('./routes/insightRoutes');
const seedData = require('./config/seeder');

// Instantiate Express App
const app = express();

// ==========================================
// MIDDLEWARES
// ==========================================

// Security Headers
app.use(helmet());

// Cross Origin Resource Sharing Configuration
app.use(cors({
    origin: '*', // Allow all client domains for mockup preview compatibility
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP Request Logging
if (env.nodeEnv === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Global General API Rate Limiter
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api/', generalLimiter);

// Brute-force rate limiter for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15, // limit to 15 login/register attempts
    message: {
        success: false,
        message: 'Too many authentication attempts. Please try again later.'
    }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ==========================================
// ROUTES MAPPING
// ==========================================

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/fraud', fraudRoutes);
app.use('/api/insights', insightRoutes);

// Base Health Check route
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'CyberPay AI Digital Payment Backend is healthy and running.',
        timestamp: new Date()
    });
});

// Catch-all route (404 Not Found handler)
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `API Route not found: ${req.originalUrl}`
    });
});

// Centralized Error handler middleware
app.use(errorHandler);

// ==========================================
// SERVER INITIALIZATION
// ==========================================

const startServer = async () => {
    // 1. Connect to MySQL
    await connectDB();

    // 2. Synchronize Sequelize Models (Auto-creates missing tables/columns in development)
    if (env.nodeEnv === 'development') {
        try {
            await sequelize.sync({ alter: true });
            console.log('✔ Database synced and tables verified.');
            await seedData();
        } catch (error) {
            console.error('✘ Database synchronization failed:', error.message);
        }
    }

    // 3. Bind Port and Listen
    app.listen(env.port, () => {
        console.log(`🚀 CyberPay AI Server running in [${env.nodeEnv}] on http://localhost:${env.port}`);
    });
};

startServer();

module.exports = app; // For integration testing
