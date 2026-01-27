const { verifyAccessToken } = require('../utils/jwt');

/**
 * Middleware to verify JWT access token
 */
async function authenticateToken(req, res, next) {
    try {
        // Get token from Authorization header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                error: 'Access denied. No token provided.'
            });
        }

        // Verify token
        const decoded = verifyAccessToken(token);

        // Attach user info to request
        req.user = {
            userId: decoded.userId,
            email: decoded.email
        };

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Access token expired. Please refresh your token.'
            });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(403).json({
                error: 'Invalid token.'
            });
        }
        return res.status(500).json({
            error: 'Internal server error during authentication.'
        });
    }
}

module.exports = authenticateToken;
