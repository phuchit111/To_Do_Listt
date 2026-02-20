const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer config
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        // Allow common file types
        const allowed = /jpeg|jpg|png|gif|webp|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|zip|rar|mp4|mp3/;
        const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
        if (allowed.test(ext)) {
            cb(null, true);
        } else {
            cb(new Error('File type not allowed.'));
        }
    },
});

// GET /api/tasks/:taskId/attachments — list attachments
router.get('/:taskId/attachments', authMiddleware, async (req, res) => {
    try {
        const attachments = await prisma.attachment.findMany({
            where: { taskId: req.params.taskId },
            include: {
                user: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(attachments);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch attachments.' });
    }
});

// POST /api/tasks/:taskId/attachments — upload file
router.post('/:taskId/attachments', authMiddleware, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded.' });
        }

        const task = await prisma.task.findUnique({ where: { id: req.params.taskId } });
        if (!task) return res.status(404).json({ error: 'Task not found.' });

        const attachment = await prisma.attachment.create({
            data: {
                filename: req.file.originalname,
                path: '/uploads/' + req.file.filename,
                mimetype: req.file.mimetype,
                size: req.file.size,
                taskId: req.params.taskId,
                userId: req.user.id,
            },
            include: {
                user: { select: { id: true, name: true } },
            },
        });

        // Log activity
        await prisma.activity.create({
            data: {
                action: 'file_attached',
                details: JSON.stringify({ filename: req.file.originalname }),
                taskId: req.params.taskId,
                userId: req.user.id,
            },
        });

        res.status(201).json(attachment);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to upload file.' });
    }
});

// DELETE /api/tasks/:taskId/attachments/:id — delete attachment
router.delete('/:taskId/attachments/:id', authMiddleware, async (req, res) => {
    try {
        const attachment = await prisma.attachment.findUnique({ where: { id: req.params.id } });
        if (!attachment) return res.status(404).json({ error: 'Attachment not found.' });
        if (attachment.userId !== req.user.id && req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Not authorized.' });
        }

        // Delete physical file
        const filePath = path.join(__dirname, '../..', attachment.path);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await prisma.attachment.delete({ where: { id: req.params.id } });
        res.json({ message: 'Attachment deleted.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete attachment.' });
    }
});

module.exports = router;
