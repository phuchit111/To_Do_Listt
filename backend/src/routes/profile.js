const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/profile — get current user profile
router.get('/', authMiddleware, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatar: true,
                createdAt: true,
                _count: {
                    select: {
                        tasks: true,
                        projects: true,
                        comments: true,
                    },
                },
            },
        });
        if (!user) return res.status(404).json({ error: 'User not found.' });
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch profile.' });
    }
});

// PUT /api/profile — update name/avatar
router.put('/', authMiddleware, async (req, res) => {
    try {
        const { name, avatar } = req.body;

        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: {
                ...(name !== undefined && { name: name.trim() }),
                ...(avatar !== undefined && { avatar }),
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatar: true,
            },
        });

        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update profile.' });
    }
});

// PUT /api/profile/password — change password
router.put('/password', authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current and new passwords are required.' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters.' });
        }

        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        const valid = await bcrypt.compare(currentPassword, user.password);
        if (!valid) {
            return res.status(401).json({ error: 'Current password is incorrect.' });
        }

        const hashed = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: req.user.id },
            data: { password: hashed },
        });

        res.json({ message: 'Password changed successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to change password.' });
    }
});

module.exports = router;
