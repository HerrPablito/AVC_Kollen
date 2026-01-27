const jwt = require('jsonwebtoken');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access-secret-key';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret-key';
const ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '30d';

/**
 * Generate access token (short-lived)
 */
function generateAccessToken(userId, email) {
    return jwt.sign(
        { userId, email, type: 'access' },
        ACCESS_SECRET,
        { expiresIn: ACCESS_EXPIRY }
    );
}

/**
 * Generate refresh token (long-lived)
 */
function generateRefreshToken(userId, email) {
    return jwt.sign(
        { userId, email, type: 'refresh' },
        REFRESH_SECRET,
        { expiresIn: REFRESH_EXPIRY }
    );
}

/**
 * Verify access token
 */
function verifyAccessToken(token) {
    try {
        const decoded = jwt.verify(token, ACCESS_SECRET);
        if (decoded.type !== 'access') {
            throw new Error('Invalid token type');
        }
        return decoded;
    } catch (error) {
        throw error;
    }
}

/**
 * Verify refresh token
 */
function verifyRefreshToken(token) {
    try {
        const decoded = jwt.verify(token, REFRESH_SECRET);
        if (decoded.type !== 'refresh') {
            throw new Error('Invalid token type');
        }
        return decoded;
    } catch (error) {
        throw error;
    }
}

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken
};
