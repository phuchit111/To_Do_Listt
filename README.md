# UpClick Project Management System

TaskFlow is a professional-grade project management application designed for organized task tracking, team collaboration, and workflow visualization. This system provides a comprehensive set of tools including multiple viewing modes, real-time notifications, and advanced analytics.

## Technical Architecture

The application is built using a modern full-stack architecture designed for scalability and maintainability.

### Frontend
- Framework: Next.js 14 (App Router)
- Language: JavaScript (ES6+)
- Styling: Vanilla CSS focusing on high-performance rendering and custom theme support
- State Management: React Context API (Auth and Theme)
- Icons: Lucide React for consistent UI elements

### Backend
- Framework: Node.js with Express
- Database: PostgreSQL
- ORM: Prisma
- Authentication: JWT (JSON Web Tokens) with Bcrypt for secure credential hashing
- File Management: Multer for handling multipart/form-data (task attachments)
- Task Scheduling: Node-Cron for automated deadline alerts

### Infrastructure
- Containerization: Docker and Docker Compose
- Persistent Storage: Local volume mounting for database and file uploads

---

## Core Features

### 1. View Management
- Dashboard: Centralized analytics hub featuring a solid pie chart visualization of project status (Overdue, Backlog, In Progress, Completed).
- List View: High-density task list with advanced sorting and multi-parameter filtering capabilities.
- Kanban Board: Interactive interface for workflow management using drag-and-drop functionality for status updates.
- Calendar View: Temporal overview of project milestones and task deadlines in a monthly format.

### 2. Task Infrastructure
- Priority Levels: Granular priority system (Urgent, High, Normal, Low) with distinct visual signaling.
- Subtask System: Support for hierarchical task breakdown for complex objectives.
- Project Grouping: Logical isolation of tasks into specific projects with customizable color-coded branding.
- Attachment Management: Direct integration for uploading documents and images to individual task records.

### 3. Collaboration and Accountability
- Comment Threads: Real-time discussion capability integrated within each task.
- Multi-User Tagging: Ability to assign and notify multiple team members on a single task.
- Activity Logs: Immutable history of status changes, renames, and collaborative actions for audit purposes.

### 4. System Automation
- Notification Center: Polling-based real-time notification system for user mentions and deadline alerts.
- Deadline Monitoring: Automated background processes that scan for tasks due within 24 hours.

### 5. Personalization
- Theme Engine: Fully integrated Light and Dark mode support with persistence via browser local storage.
- User Profile: Comprehensive settings for identity management and credential updates.

---

## Installation and Setup

### Prerequisites
- Docker and Docker Compose installed (Recommended)
- Node.js 18.x or higher and PostgreSQL (For manual setup)

### Deployment via Docker

1. Clone the repository to your local machine.
2. Ensure no other services are using ports 3000 (Frontend), 5000 (Backend), or 5432 (Database).
3. Execute the following command in the project root:
   ```bash
   docker-compose up --build -d
   ```
4. The system will be accessible at:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Manual Deployment

#### Backend Configuration
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a .env file and configure the following variables:
   - DATABASE_URL: Your PostgreSQL connection string
   - JWT_SECRET: A secure string for token signing
4. Initialize the database:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

#### Frontend Configuration
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

---


## API Reference

The system exposes a RESTful API for integration or external monitoring:

| Category | Endpoint | Method |
|----------|----------|--------|
| Authentication | /api/auth/register | POST |
| Authentication | /api/auth/login | POST |
| Task Management | /api/tasks | GET, POST, PUT, DELETE |
| Project Management | /api/projects | GET, POST, PUT |
| Dashboard Data | /api/dashboard | GET |
| Profile Management | /api/profile | GET, PUT |

---

This Project Management System is intended for professional use cases requiring robust task tracking and team coordination.
