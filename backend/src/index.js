require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const categoryRoutes = require('./routes/categories');
const userRoutes = require('./routes/users');
const dashboardRoutes = require('./routes/dashboard');
const commentRoutes = require('./routes/comments');
const notificationRoutes = require('./routes/notifications');
const projectRoutes = require('./routes/projects');
const profileRoutes = require('./routes/profile');
const uploadRoutes = require('./routes/uploads');
const { startReminderCron } = require('./cron/reminders');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*' }));
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/tasks', commentRoutes);
app.use('/api/tasks', uploadRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/profile', profileRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

// Start cron jobs
startReminderCron();

app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
});

