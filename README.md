# 🚀 TaskFlow — Smart Project Management App

A premium, ClickUp-inspired project management application built with the MERN-like stack. Manage tasks, projects, and teams with advanced views and automation.

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14, React 18, Vanilla CSS |
| **Backend** | Node.js + Express |
| **Database** | PostgreSQL |
| **ORM** | Prisma |
| **Auth** | JWT (JSON Web Tokens) |
| **Storage** | Local Filesystem via Multer |
| **Automation** | Node-Cron |
| **Containerization** | Docker + Docker Compose |

## ✨ Features

### 1. Multiple Views
- 📋 **List View** — Detailed task list with priorities, subtasks, and categories.
- 📌 **Kanban Board** — Drag & drop tasks between statuses (Pending → In Progress → Completed).
- 📅 **Calendar View** — Monthly overview of task deadlines.

### 2. Task Excellence
- 🔴 **Priority System** — Urgent, High, Normal, Low with visual indicators.
- 🔗 **Subtasks** — Break down complex tasks into manageable steps.
- 📂 **Project Grouping** — Organize tasks into branded projects with custom colors.
- 📎 **File Attachments** — Upload and manage files directly within tasks (up to 10MB).

### 3. Collaboration & History
- 💬 **Comments** — Real-time discussions on every task.
- 🏷️ **User Tagging** — Assign multiple team members to a task.
- 📜 **Activity Logs** — Full audit trail of status changes, renames, and comments.

### 4. Smart Notifications
- 🔔 **Notification Center** — Real-time (polling) updates for tags, comments, and reminders.
- ⏰ **Deadline Reminders** — Automated cron job alerts 24 hours before a due date.

### 5. Personalization
- ⚙️ **User Settings** — Update display name, change password, and view personal stats.
- 🎨 **Premium UI** — Modern dark theme with glassmorphism and smooth animations.

---

## 🚀 Quick Start

### 1. Using Docker (Recommended)

```bash
docker-compose up --build
```

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **Uploaded Files**: `./backend/uploads/`

### 2. Manual Setup

**Prerequisites**: Node.js 18+, PostgreSQL

#### Backend
```bash
cd backend
npm install
# Configure .env: DATABASE_URL, JWT_SECRET
npx prisma migrate dev
npm run dev
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 📁 Project Structure

```
To_Do_Listt/
├── backend/
│   ├── prisma/schema.prisma    # DB Models: User, Project, Task, Attachment...
│   ├── src/
│   │   ├── cron/reminders.js   # Automated deadline checks
│   │   ├── routes/             # API: Auth, Tasks, Projects, Uploads, Profile...
│   │   └── index.js            # Entry point
│   └── uploads/                # Attached files storage
├── frontend/
│   ├── src/
│   │   ├── app/                # Pages: Dashboard, Board, Calendar, Settings...
│   │   ├── components/         # Sidebar, TaskDetailPanel, Notifications...
│   │   ├── context/AuthContext # User state management
│   │   └── lib/api.js          # API Client (Fetch wrapper)
└── README.md
```

## 🔌 Core API Endpoints

| Area | Endpoints |
|------|-----------|
| **Auth** | `POST /api/auth/login`, `POST /api/auth/register` |
| **Tasks** | `GET /api/tasks`, `POST /api/tasks`, `PUT /api/tasks/:id`, `DELETE /api/tasks/:id` |
| **Projects** | `GET /api/projects`, `POST /api/projects`, `PUT /api/projects/:id` |
| **Files** | `POST /api/tasks/:taskId/attachments`, `GET /api/tasks/:taskId/attachments` |
| **Profile** | `GET /api/profile`, `PUT /api/profile`, `PUT /api/profile/password` |
| **Data** | `/api/dashboard`, `/api/notifications`, `/api/categories`, `/api/users` |

---

Developed with ❤️ as a premium ClickUp-like solution.
