const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/dashboard — stats & analytics
router.get('/', authMiddleware, async (req, res) => {
    try {
        const where = req.user.role === 'ADMIN' ? {} : { userId: req.user.id };

        // Total tasks
        const total = await prisma.task.count({ where });

        // By status
        const pending = await prisma.task.count({ where: { ...where, status: 'PENDING' } });
        const inProgress = await prisma.task.count({ where: { ...where, status: 'IN_PROGRESS' } });
        const completed = await prisma.task.count({ where: { ...where, status: 'COMPLETED' } });

        // Completion percentage
        const completionPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

        // Overdue tasks
        const overdue = await prisma.task.count({
            where: {
                ...where,
                status: { not: 'COMPLETED' },
                dueDate: { lt: new Date() },
            },
        });

        // Tasks per category
        const categoriesRaw = await prisma.task.groupBy({
            by: ['categoryId'],
            where,
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
                ...where,
                status: { not: 'COMPLETED' },
                dueDate: { gte: new Date(), lte: nextWeek },
            },
            include: {
                category: true,
            },
            orderBy: { dueDate: 'asc' },
            take: 10,
        });

        res.json({
            total,
            pending,
            inProgress,
            completed,
            completionPercent,
            overdue,
            byCategory,
            upcoming,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch dashboard data.' });
    }
});

module.exports = router;
