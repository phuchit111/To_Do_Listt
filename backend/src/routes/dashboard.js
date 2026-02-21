const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/dashboard — stats & analytics
router.get('/', authMiddleware, async (req, res) => {
    try {
        // All users see only their own + tagged tasks
        const userFilter = {
            OR: [
                { userId: req.user.id },
                { tags: { some: { userId: req.user.id } } },
            ],
        };

        const now = new Date();

        // 1. Completed
        const completed = await prisma.task.count({
            where: { ...userFilter, status: 'COMPLETED' }
        });

        // 2. Overdue (Not completed and due date has passed)
        const overdue = await prisma.task.count({
            where: {
                ...userFilter,
                status: { not: 'COMPLETED' },
                dueDate: { lt: now },
            },
        });

        // 3. In Progress (Active work, not overdue)
        const inProgress = await prisma.task.count({
            where: {
                AND: [
                    userFilter,
                    {
                        status: 'IN_PROGRESS',
                        OR: [
                            { dueDate: { gte: now } },
                            { dueDate: null },
                        ],
                    },
                ],
            },
        });

        // 4. Backlog (Everything else: Not completed, not in-progress, and not overdue)
        const pending = await prisma.task.count({
            where: {
                AND: [
                    userFilter,
                    {
                        status: { notIn: ['COMPLETED', 'IN_PROGRESS'] },
                        OR: [
                            { dueDate: { gte: now } },
                            { dueDate: null },
                        ],
                    },
                ],
            },
        });

        // Metrics for the UI
        const totalWork = completed + overdue + inProgress + pending;
        const totalActive = inProgress + completed + overdue; // Anything started or due
        const executionProgress = totalActive > 0 ? Math.round((completed / totalActive) * 100) : 0;

        // Tasks per category
        const categoriesRaw = await prisma.task.groupBy({
            by: ['categoryId'],
            where: userFilter,
            _count: { id: true },
        });

        // Fetch category names
        const categoryIds = categoriesRaw.map((c) => c.categoryId).filter(Boolean);
        const categoryNames = await prisma.category.findMany({
            where: { id: { in: categoryIds } },
            select: { id: true, name: true, color: true },
        });
        const categoryMap = Object.fromEntries(categoryNames.map((c) => [c.id, c]));

        const byCategory = categoriesRaw.map((c) => ({
            categoryId: c.categoryId,
            name: c.categoryId ? categoryMap[c.categoryId]?.name || 'Unknown' : 'Uncategorized',
            color: c.categoryId ? categoryMap[c.categoryId]?.color || '#6b7280' : '#6b7280',
            count: c._count.id,
        }));

        // Upcoming deadlines (next 7 days)
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        const upcoming = await prisma.task.findMany({
            where: {
                ...userFilter,
                status: { not: 'COMPLETED' },
                dueDate: { gte: now, lte: nextWeek },
            },
            include: {
                category: true,
            },
            orderBy: { dueDate: 'asc' },
            take: 10,
        });

        res.json({
            total: totalWork,
            pending,
            inProgress,
            completed,
            overdue,
            executionProgress,
            upcoming,
            byCategory,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch dashboard data.' });
    }
});

module.exports = router;
