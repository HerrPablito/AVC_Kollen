const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authenticateToken = require('../middleware/auth');

// Get user's favorites
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT avc_id FROM favorites WHERE user_id = $1 ORDER BY created_at DESC',
            [req.user.userId]
        );

        const avcIds = result.rows.map(row => row.avc_id);
        res.json({ favorites: avcIds });
    } catch (error) {
        console.error('Get favorites error:', error);
        res.status(500).json({ error: 'Failed to fetch favorites' });
    }
});

// Add favorite
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { avcId } = req.body;

        if (!avcId) {
            return res.status(400).json({ error: 'avcId is required' });
        }

        await pool.query(
            'INSERT INTO favorites (user_id, avc_id) VALUES ($1, $2) ON CONFLICT (user_id, avc_id) DO NOTHING',
            [req.user.userId, avcId]
        );

        res.status(201).json({ message: 'Favorite added' });
    } catch (error) {
        console.error('Add favorite error:', error);
        res.status(500).json({ error: 'Failed to add favorite' });
    }
});

// Remove favorite
router.delete('/:avcId', authenticateToken, async (req, res) => {
    try {
        const { avcId } = req.params;

        await pool.query(
            'DELETE FROM favorites WHERE user_id = $1 AND avc_id = $2',
            [req.user.userId, avcId]
        );

        res.json({ message: 'Favorite removed' });
    } catch (error) {
        console.error('Remove favorite error:', error);
        res.status(500).json({ error: 'Failed to remove favorite' });
    }
});

// Bulk add favorites (for migration from localStorage)
router.post('/bulk', authenticateToken, async (req, res) => {
    try {
        const { avcIds } = req.body;

        if (!Array.isArray(avcIds)) {
            return res.status(400).json({ error: 'avcIds must be an array' });
        }

        // Insert all favorites
        for (const avcId of avcIds) {
            await pool.query(
                'INSERT INTO favorites (user_id, avc_id) VALUES ($1, $2) ON CONFLICT (user_id, avc_id) DO NOTHING',
                [req.user.userId, avcId]
            );
        }

        res.json({ message: `${avcIds.length} favorites migrated`, count: avcIds.length });
    } catch (error) {
        console.error('Bulk add favorites error:', error);
        res.status(500).json({ error: 'Failed to migrate favorites' });
    }
});

module.exports = router;
