const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/categories
router.get('/', authMiddleware, async (req, res) => {
    try {
        const where = req.user.role === 'ADMIN' ? {} : { userId: req.user.id };
        const categories = await prisma.category.findMany({
            where,
            include: { _count: { select: { tasks: true } } },
            orderBy: { createdAt: 'asc' },
        });
        res.json(categories);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch categories.' });
    }
});

// POST /api/categories
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name, color } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Name is required.' });
        }

        const category = await prisma.category.create({
            data: {
                name,
                color: color || '#6366f1',
                userId: req.user.id,
            },
        });

        res.status(201).json(category);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create category.' });
    }
});

// DELETE /api/categories/:id
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const category = await prisma.category.findUnique({ where: { id } });
        if (!category) {
            return res.status(404).json({ error: 'Category not found.' });
        }
        if (req.user.role !== 'ADMIN' && category.userId !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized.' });
        }

        await prisma.category.delete({ where: { id } });
        res.json({ message: 'Category deleted.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete category.' });
    }
});

module.exports = router;
