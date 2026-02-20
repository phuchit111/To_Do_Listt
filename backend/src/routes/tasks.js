const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/tasks — list tasks with search & filter
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { search, status, categoryId, from, to } = req.query;
        const where = {};

        // Role-based: USER sees own tasks, ADMIN sees all
        if (req.user.role !== 'ADMIN') {
            where.userId = req.user.id;
        }

        // Search by title or description
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Filter by status
        if (status && ['PENDING', 'IN_PROGRESS', 'COMPLETED'].includes(status)) {
            where.status = status;
        }

        // Filter by category
        if (categoryId) {
            where.categoryId = categoryId;
        }

        // Filter by date range
        if (from || to) {
            where.dueDate = {};
            if (from) where.dueDate.gte = new Date(from);
            if (to) where.dueDate.lte = new Date(to);
        }

        const tasks = await prisma.task.findMany({
            where,
            include: {
                category: true,
                user: { select: { id: true, name: true, email: true } },
                tags: {
                    include: {
                        user: { select: { id: true, name: true, email: true } },
                    },
                },
            },
            orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
        });

        res.json(tasks);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch tasks.' });
    }
});

// POST /api/tasks — create task
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { title, description, status, dueDate, categoryId, taggedUserIds } = req.body;

        if (!title) {
            return res.status(400).json({ error: 'Title is required.' });
        }

        const task = await prisma.task.create({
            data: {
                title,
                description: description || null,
                status: status || 'PENDING',
                dueDate: dueDate ? new Date(dueDate) : null,
                userId: req.user.id,
                categoryId: categoryId || null,
                tags: taggedUserIds?.length
                    ? {
                        create: taggedUserIds.map((uid) => ({ userId: uid })),
                    }
                    : undefined,
            },
            include: {
                category: true,
                user: { select: { id: true, name: true, email: true } },
                tags: {
                    include: {
                        user: { select: { id: true, name: true, email: true } },
                    },
                },
            },
        });

        res.status(201).json(task);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create task.' });
    }
});

// PUT /api/tasks/:id — update task
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, status, dueDate, categoryId, taggedUserIds } = req.body;

        // Check ownership or admin
        const existing = await prisma.task.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ error: 'Task not found.' });
        }
        if (req.user.role !== 'ADMIN' && existing.userId !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized.' });
        }

        // If taggedUserIds provided, replace all tags
        if (taggedUserIds !== undefined) {
            await prisma.taskTag.deleteMany({ where: { taskId: id } });
            if (taggedUserIds.length > 0) {
                await prisma.taskTag.createMany({
                    data: taggedUserIds.map((uid) => ({ taskId: id, userId: uid })),
                });
            }
        }

        const task = await prisma.task.update({
            where: { id },
            data: {
                ...(title !== undefined && { title }),
                ...(description !== undefined && { description }),
                ...(status !== undefined && { status }),
                ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
                ...(categoryId !== undefined && { categoryId: categoryId || null }),
            },
            include: {
                category: true,
                user: { select: { id: true, name: true, email: true } },
                tags: {
                    include: {
                        user: { select: { id: true, name: true, email: true } },
                    },
                },
            },
        });

        res.json(task);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update task.' });
    }
});

// DELETE /api/tasks/:id
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await prisma.task.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ error: 'Task not found.' });
        }
        if (req.user.role !== 'ADMIN' && existing.userId !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized.' });
        }

        await prisma.task.delete({ where: { id } });
        res.json({ message: 'Task deleted.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete task.' });
    }
});

module.exports = router;
