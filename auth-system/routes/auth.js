const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../config/database');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');

const router = express.Router();
const SALT_ROUNDS = 10;
const REFRESH_TOKEN_EXPIRY_DAYS = 30;

/**
 * POST /auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check if user already exists
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({ error: 'User already exists' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        // Insert user
        const result = await pool.query(
            'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
            [email, passwordHash]
        );

        const user = result.rows[0];

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user.id,
                email: user.email,
                createdAt: user.created_at
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /auth/login
 * Login user and return tokens
 */
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user
        const result = await pool.query(
            'SELECT id, email, password_hash FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate tokens
        const accessToken = generateAccessToken(user.id, user.email);
        const refreshToken = generateRefreshToken(user.id, user.email);

        // Store refresh token in database
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

        await pool.query(
            'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
            [user.id, refreshToken, expiresAt]
        );

        // Set refresh token as HttpOnly cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000 // 30 days in ms
        });

        res.json({
            message: 'Login successful',
            accessToken,
            user: {
                id: user.id,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    try {
        if (!refreshToken) {
            return res.status(401).json({ error: 'Refresh token not found' });
        }

        // Verify refresh token
        const decoded = verifyRefreshToken(refreshToken);

        // Check if token exists in database and is not expired
        const result = await pool.query(
            'SELECT user_id FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()',
            [refreshToken]
        );

        if (result.rows.length === 0) {
            return res.status(403).json({ error: 'Invalid or expired refresh token' });
        }

        // Generate new access token
        const accessToken = generateAccessToken(decoded.userId, decoded.email);

        res.json({
            message: 'Token refreshed successfully',
            accessToken
        });
    } catch (error) {
        console.error('Refresh error:', error);
        if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
            return res.status(403).json({ error: 'Invalid refresh token' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /auth/logout
 * Logout user and clear refresh token
 */
router.post('/logout', async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    try {
        if (refreshToken) {
            // Delete refresh token from database
            await pool.query(
                'DELETE FROM refresh_tokens WHERE token = $1',
                [refreshToken]
            );
        }

        // Clear cookie
        res.clearCookie('refreshToken');

        res.json({ message: 'Logout successful' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
