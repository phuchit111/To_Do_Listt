const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/notifications
router.get('/', authMiddleware, async (req, res) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        const unreadCount = await prisma.notification.count({
            where: { userId: req.user.id, read: false },
        });
        res.json({ notifications, unreadCount });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch notifications.' });
    }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', authMiddleware, async (req, res) => {
    try {
        await prisma.notification.update({
            where: { id: req.params.id },
            data: { read: true },
        });
        res.json({ message: 'Marked as read.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update notification.' });
    }
});

// PUT /api/notifications/read-all
router.put('/read-all', authMiddleware, async (req, res) => {
    try {
        await prisma.notification.updateMany({
            where: { userId: req.user.id, read: false },
            data: { read: true },
        });
        res.json({ message: 'All marked as read.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update notifications.' });
    }
});

module.exports = router;
