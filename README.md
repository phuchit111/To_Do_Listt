# ✅ TaskFlow — To-Do List Application

A full-stack task management application with JWT authentication, role-based access, dashboard analytics, and Docker support.

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 (React 18) |
| **Backend** | Node.js + Express |
| **Database** | PostgreSQL |
| **ORM** | Prisma |
| **Auth** | JWT (JSON Web Tokens) |
| **Containerization** | Docker + Docker Compose |

## ✨ Features

- 🔐 **Login / Register** with JWT authentication
- 👤 **Roles** — Admin (sees all tasks) / User (own tasks only)
- 📊 **Dashboard** — Completion %, status breakdown, category charts, upcoming deadlines
- 🏷️ **Categories** — Color-coded task organization
- 📋 **Task Management** — Full CRUD with status toggle (Pending → In Progress → Completed)
- 👥 **User Tagging** — Assign related users to tasks
- 🔍 **Search & Filter** — By text, status, category
- 📅 **Due Dates** — Date/time scheduling with overdue alerts
- 📱 **Responsive UI** — Premium dark theme, works on all devices
- 🐳 **Docker** — One-command deployment

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- PostgreSQL: localhost:5432

### Option 2: Manual Setup

**Prerequisites**: Node.js 18+, PostgreSQL

#### 1. Database
Create a PostgreSQL database named `tododb`.

#### 2. Backend
```bash
cd backend
cp .env .env.local  # Update DATABASE_URL if needed
npm install
npx prisma migrate dev --name init
npm run dev
```

#### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📁 Project Structure

```
To_Do_Listt/
├── docker-compose.yml
├── backend/
│   ├── prisma/schema.prisma    # Database schema
│   ├── src/
│   │   ├── index.js            # Express server
│   │   ├── middleware/auth.js   # JWT & role guards
│   │   └── routes/             # API endpoints
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/                # Next.js pages
│   │   ├── components/         # React components
│   │   ├── context/            # Auth context
│   │   ├── lib/api.js          # API client
│   │   └── styles/globals.css  # Design system
│   └── Dockerfile
└── README.md
```

## 🔌 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Register |
| POST | `/api/auth/login` | — | Login |
| GET | `/api/tasks` | JWT | List tasks (search/filter) |
| POST | `/api/tasks` | JWT | Create task |
| PUT | `/api/tasks/:id` | JWT | Update task |
| DELETE | `/api/tasks/:id` | JWT | Delete task |
| GET/POST/DELETE | `/api/categories` | JWT | Manage categories |
| GET | `/api/users` | JWT | List users |
| GET | `/api/dashboard` | JWT | Analytics |