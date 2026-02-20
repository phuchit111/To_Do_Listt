const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/tasks/:taskId/comments
router.get('/:taskId/comments', authMiddleware, async (req, res) => {
    try {
        const comments = await prisma.comment.findMany({
            where: { taskId: req.params.taskId },
            include: {
                user: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: 'asc' },
        });
        res.json(comments);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch comments.' });
    }
});

// POST /api/tasks/:taskId/comments
router.post('/:taskId/comments', authMiddleware, async (req, res) => {
    try {
        const { content } = req.body;
        if (!content?.trim()) {
            return res.status(400).json({ error: 'Content is required.' });
        }

        const task = await prisma.task.findUnique({ where: { id: req.params.taskId } });
        if (!task) return res.status(404).json({ error: 'Task not found.' });

        const comment = await prisma.comment.create({
            data: {
                content: content.trim(),
                taskId: req.params.taskId,
                userId: req.user.id,
            },
            include: {
                user: { select: { id: true, name: true, email: true } },
            },
        });

        // Log activity
        await prisma.activity.create({
            data: {
                action: 'comment_added',
                details: JSON.stringify({ commentId: comment.id }),
                taskId: req.params.taskId,
                userId: req.user.id,
            },
        });

        // Notify task owner if commenter is not the owner
        if (task.userId !== req.user.id) {
            await prisma.notification.create({
                data: {
                    type: 'comment',
                    message: `${req.user.name} commented on "${task.title}"`,
                    taskId: task.id,
                    userId: task.userId,
                },
            });
        }

        // Notify tagged users
        const tags = await prisma.taskTag.findMany({ where: { taskId: task.id } });
        const notifyUserIds = tags
            .map(t => t.userId)
            .filter(uid => uid !== req.user.id && uid !== task.userId);

        if (notifyUserIds.length > 0) {
            await prisma.notification.createMany({
                data: notifyUserIds.map(uid => ({
                    type: 'comment',
                    message: `${req.user.name} commented on "${task.title}"`,
                    taskId: task.id,
                    userId: uid,
                })),
            });
        }

        res.status(201).json(comment);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to add comment.' });
    }
});

// DELETE /api/tasks/:taskId/comments/:id
router.delete('/:taskId/comments/:id', authMiddleware, async (req, res) => {
    try {
        const comment = await prisma.comment.findUnique({ where: { id: req.params.id } });
        if (!comment) return res.status(404).json({ error: 'Comment not found.' });
        if (comment.userId !== req.user.id && req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Not authorized.' });
        }

        await prisma.comment.delete({ where: { id: req.params.id } });
        res.json({ message: 'Comment deleted.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete comment.' });
    }
});

module.exports = router;
