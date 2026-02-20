const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/projects — list user's projects (or all for admin)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const where = req.user.role === 'ADMIN' ? {} : { userId: req.user.id };
        const projects = await prisma.project.findMany({
            where,
            include: {
                _count: { select: { tasks: true } },
                user: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(projects);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch projects.' });
    }
});

// POST /api/projects — create project
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name, description, color } = req.body;
        if (!name?.trim()) {
            return res.status(400).json({ error: 'Project name is required.' });
        }

        const project = await prisma.project.create({
            data: {
                name: name.trim(),
                description: description || null,
                color: color || '#6366f1',
                userId: req.user.id,
            },
            include: {
                _count: { select: { tasks: true } },
            },
        });

        res.status(201).json(project);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create project.' });
    }
});

// PUT /api/projects/:id — update project
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, color } = req.body;

        const existing = await prisma.project.findUnique({ where: { id } });
        if (!existing) return res.status(404).json({ error: 'Project not found.' });
        if (req.user.role !== 'ADMIN' && existing.userId !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized.' });
        }

        const project = await prisma.project.update({
            where: { id },
            data: {
                ...(name !== undefined && { name: name.trim() }),
                ...(description !== undefined && { description }),
                ...(color !== undefined && { color }),
            },
            include: {
                _count: { select: { tasks: true } },
            },
        });

        res.json(project);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update project.' });
    }
});

// DELETE /api/projects/:id — delete project (tasks get projectId = null)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await prisma.project.findUnique({ where: { id } });
        if (!existing) return res.status(404).json({ error: 'Project not found.' });
        if (req.user.role !== 'ADMIN' && existing.userId !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized.' });
        }

        // Unlink tasks from this project
        await prisma.task.updateMany({
            where: { projectId: id },
            data: { projectId: null },
        });

        await prisma.project.delete({ where: { id } });
        res.json({ message: 'Project deleted.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete project.' });
    }
});

module.exports = router;
