const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

const TASK_INCLUDE = {
    category: true,
    project: true,
    user: { select: { id: true, name: true, email: true } },
    tags: {
        include: {
            user: { select: { id: true, name: true, email: true } },
        },
    },
    subtasks: {
        include: {
            user: { select: { id: true, name: true, email: true } },
            tags: { include: { user: { select: { id: true, name: true, email: true } } } },
        },
        orderBy: { position: 'asc' },
    },
    _count: { select: { comments: true, attachments: true } },
};

// GET /api/tasks — list tasks with search & filter
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { search, status, priority, categoryId, projectId, from, to, tagged } = req.query;
        const where = {};
        const andConditions = [];

        // Role-based: USER sees own tasks + tagged tasks, ADMIN sees all
        if (req.user.role !== 'ADMIN') {
            if (tagged === 'true') {
                andConditions.push({
                    tags: { some: { userId: req.user.id } },
                    userId: { not: req.user.id },
                });
            } else if (tagged === 'mine') {
                andConditions.push({ userId: req.user.id });
            } else {
                andConditions.push({
                    OR: [
                        { userId: req.user.id },
                        { tags: { some: { userId: req.user.id } } },
                    ],
                });
            }
        }

        // Search by title or description
        if (search) {
            andConditions.push({
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                ],
            });
        }

        if (andConditions.length > 0) {
            where.AND = andConditions;
        }

        // Filter by status
        if (status && ['PENDING', 'IN_PROGRESS', 'COMPLETED'].includes(status)) {
            where.status = status;
        }

        // Filter by priority
        if (priority && ['URGENT', 'HIGH', 'NORMAL', 'LOW'].includes(priority)) {
            where.priority = priority;
        }

        // Filter by category
        if (categoryId) {
            where.categoryId = categoryId;
        }

        // Filter by project
        if (projectId) {
            where.projectId = projectId;
        }

        // Filter by date range
        if (from || to) {
            where.dueDate = {};
            if (from) where.dueDate.gte = new Date(from);
            if (to) where.dueDate.lte = new Date(to);
        }

        // Only show top-level tasks (not subtasks)
        where.parentId = null;

        const tasks = await prisma.task.findMany({
            where,
            include: TASK_INCLUDE,
            orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
        });

        res.json(tasks);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch tasks.' });
    }
});

// GET /api/tasks/:id — single task with full detail
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const task = await prisma.task.findUnique({
            where: { id: req.params.id },
            include: {
                ...TASK_INCLUDE,
                comments: {
                    include: { user: { select: { id: true, name: true, email: true } } },
                    orderBy: { createdAt: 'asc' },
                },
                activities: {
                    include: { user: { select: { id: true, name: true, email: true } } },
                    orderBy: { createdAt: 'desc' },
                    take: 30,
                },
            },
        });
        if (!task) return res.status(404).json({ error: 'Task not found.' });
        res.json(task);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch task.' });
    }
});

// POST /api/tasks — create task
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { title, description, status, priority, dueDate, categoryId, projectId, taggedUserIds, parentId } = req.body;

        if (!title) {
            return res.status(400).json({ error: 'Title is required.' });
        }

        const task = await prisma.task.create({
            data: {
                title,
                description: description || null,
                status: status || 'PENDING',
                priority: priority || 'NORMAL',
                dueDate: dueDate ? new Date(dueDate) : null,
                userId: req.user.id,
                categoryId: categoryId || null,
                parentId: parentId || null,
                projectId: projectId || null,
                tags: taggedUserIds?.length
                    ? {
                        create: taggedUserIds.map((uid) => ({ userId: uid })),
                    }
                    : undefined,
            },
            include: TASK_INCLUDE,
        });

        // Log activity
        await prisma.activity.create({
            data: {
                action: 'created',
                taskId: task.id,
                userId: req.user.id,
            },
        });

        // Notify tagged users
        if (taggedUserIds?.length > 0) {
            await prisma.notification.createMany({
                data: taggedUserIds.filter(uid => uid !== req.user.id).map(uid => ({
                    type: 'tagged',
                    message: `${req.user.name} tagged you in "${task.title}"`,
                    taskId: task.id,
                    userId: uid,
                })),
            });
        }

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
        const { title, description, status, priority, dueDate, categoryId, taggedUserIds } = req.body;

        const existing = await prisma.task.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ error: 'Task not found.' });
        }
        if (req.user.role !== 'ADMIN' && existing.userId !== req.user.id) {
            // Allow tagged users to update status
            const isTagged = await prisma.taskTag.findFirst({ where: { taskId: id, userId: req.user.id } });
            if (!isTagged) {
                return res.status(403).json({ error: 'Not authorized.' });
            }
        }

        // If taggedUserIds provided, replace all tags
        if (taggedUserIds !== undefined) {
            await prisma.taskTag.deleteMany({ where: { taskId: id } });
            if (taggedUserIds.length > 0) {
                await prisma.taskTag.createMany({
                    data: taggedUserIds.map((uid) => ({ taskId: id, userId: uid })),
                });

                // Notify newly tagged users
                const newlyTagged = taggedUserIds.filter(uid => uid !== req.user.id);
                if (newlyTagged.length > 0) {
                    await prisma.notification.createMany({
                        data: newlyTagged.map(uid => ({
                            type: 'tagged',
                            message: `${req.user.name} tagged you in "${existing.title}"`,
                            taskId: id,
                            userId: uid,
                        })),
                    });
                }
            }
        }

        // Log status change
        if (status && status !== existing.status) {
            await prisma.activity.create({
                data: {
                    action: 'status_changed',
                    details: JSON.stringify({ from: existing.status, to: status }),
                    taskId: id,
                    userId: req.user.id,
                },
            });

            // Notify task owner if someone else changed status
            if (existing.userId !== req.user.id) {
                await prisma.notification.create({
                    data: {
                        type: 'status_change',
                        message: `${req.user.name} changed "${existing.title}" to ${status}`,
                        taskId: id,
                        userId: existing.userId,
                    },
                });
            }
        }

        // Log priority change
        if (priority && priority !== existing.priority) {
            await prisma.activity.create({
                data: {
                    action: 'priority_changed',
                    details: JSON.stringify({ from: existing.priority, to: priority }),
                    taskId: id,
                    userId: req.user.id,
                },
            });
        }

        const task = await prisma.task.update({
            where: { id },
            data: {
                ...(title !== undefined && { title }),
                ...(description !== undefined && { description }),
                ...(status !== undefined && { status }),
                ...(priority !== undefined && { priority }),
                ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
                ...(categoryId !== undefined && { categoryId: categoryId || null }),
                ...(req.body.projectId !== undefined && { projectId: req.body.projectId || null }),
            },
            include: TASK_INCLUDE,
        });

        res.json(task);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update task.' });
    }
});

// PUT /api/tasks/reorder — reorder tasks (drag & drop)
router.put('/reorder', authMiddleware, async (req, res) => {
    try {
        const { updates } = req.body; // [{ id, position, status }]
        if (!Array.isArray(updates)) {
            return res.status(400).json({ error: 'Updates array is required.' });
        }

        await prisma.$transaction(
            updates.map(({ id, position, status }) =>
                prisma.task.update({
                    where: { id },
                    data: {
                        ...(position !== undefined && { position }),
                        ...(status !== undefined && { status }),
                    },
                })
            )
        );

        res.json({ message: 'Reordered successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to reorder tasks.' });
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
