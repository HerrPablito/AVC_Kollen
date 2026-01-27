require('dotenv').config();
console.error("🔍 DEBUG: Starting server.js");
console.error("🔍 DEBUG: DATABASE_URL present:", Boolean(process.env.DATABASE_URL));
if (process.env.DATABASE_URL) {
    try {
        const dbUrl = new URL(process.env.DATABASE_URL);
        console.error(`🔍 DEBUG: Database Host: ${dbUrl.host}`);
    } catch (e) {
        console.error('⚠️ DEBUG: Could not parse DATABASE_URL');
    }
} else {
    console.error('⚠️ DEBUG: DATABASE_URL is MISSING!');
}

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const pool = require('./config/database');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const favoritesRoutes = require('./routes/favorites');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check
app.get('/health', (req, res) => {
    res.json({ ok: true });
});

// Manual DB init for debugging
app.get('/init-db', async (req, res) => {
    try {
        const fs = require('fs');
        const path = require('path');
        const initSql = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf8');
        await pool.query(initSql);
        console.log('✅ Database initialized manually via endpoint');
        res.json({ message: 'Database schema initialized manually' });
    } catch (error) {
        console.error('Init DB error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Routes
app.use('/auth', authRoutes);
app.use('/favorites', favoritesRoutes);
app.use('/', userRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function startServer() {
    try {
        // Test database connection
        await pool.query('SELECT NOW()');
        console.log('✅ Database connection verified');

        // Initialize database schema
        const fs = require('fs');
        const path = require('path');
        const initSql = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf8');
        await pool.query(initSql);
        console.log('✅ Database schema initialized');

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔐 JWT Access Token Expiry: ${process.env.JWT_ACCESS_EXPIRY || '15m'}`);
            console.log(`🔐 JWT Refresh Token Expiry: ${process.env.JWT_REFRESH_EXPIRY || '30d'}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing server...');
    await pool.end();
    process.exit(0);
});

startServer();
