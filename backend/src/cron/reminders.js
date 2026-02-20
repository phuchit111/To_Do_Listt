const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function startReminderCron() {
    // Run every 30 minutes
    cron.schedule('*/30 * * * *', async () => {
        try {
            const now = new Date();
            const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

            // Find tasks due within next 24 hours that are not completed
            const tasks = await prisma.task.findMany({
                where: {
                    status: { not: 'COMPLETED' },
                    dueDate: {
                        gte: now,
                        lte: in24h,
                    },
                },
                include: {
                    user: { select: { id: true, name: true } },
                    tags: { select: { userId: true } },
                },
            });

            for (const task of tasks) {
                // Collect users to notify: owner + tagged users
                const userIds = new Set([task.userId]);
                task.tags.forEach(t => userIds.add(t.userId));

                for (const userId of userIds) {
                    // Check if we already sent a reminder for this task in the last 24h
                    const existing = await prisma.notification.findFirst({
                        where: {
                            type: 'reminder',
                            taskId: task.id,
                            userId,
                            createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
                        },
                    });

                    if (!existing) {
                        const hoursLeft = Math.round((new Date(task.dueDate) - now) / (1000 * 60 * 60));
                        await prisma.notification.create({
                            data: {
                                type: 'reminder',
                                message: `⏰ "${task.title}" is due in ${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}`,
                                taskId: task.id,
                                userId,
                            },
                        });
                    }
                }
            }

            // Also check overdue tasks (due date passed, not completed)
            const overdueTasks = await prisma.task.findMany({
                where: {
                    status: { not: 'COMPLETED' },
                    dueDate: { lt: now },
                },
                include: {
                    tags: { select: { userId: true } },
                },
            });

            for (const task of overdueTasks) {
                const userIds = new Set([task.userId]);
                task.tags.forEach(t => userIds.add(t.userId));

                for (const userId of userIds) {
                    const existing = await prisma.notification.findFirst({
                        where: {
                            type: 'reminder',
                            taskId: task.id,
                            userId,
                            message: { contains: 'overdue' },
                            createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
                        },
                    });

                    if (!existing) {
                        await prisma.notification.create({
                            data: {
                                type: 'reminder',
                                message: `🔴 "${task.title}" is overdue!`,
                                taskId: task.id,
                                userId,
                            },
                        });
                    }
                }
            }

            console.log(`[Reminders] Checked ${tasks.length} upcoming + ${overdueTasks.length} overdue tasks`);
        } catch (err) {
            console.error('[Reminders] Error:', err);
        }
    });

    console.log('[Reminders] Cron job started — runs every 30 minutes');
}

module.exports = { startReminderCron };
