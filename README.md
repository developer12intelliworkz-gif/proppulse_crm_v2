# 🏠 PropPulse CRM v2

> **A full-featured Real Estate CRM** built with React + Vite (frontend) and Node.js + Express (backend), connected to a **PostgreSQL** database.

---

## 📋 Table of Contents

- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation Guide](#-installation-guide)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Setup PostgreSQL Database](#2-setup-postgresql-database)
  - [3. Configure Backend (API)](#3-configure-backend-api)
  - [4. Configure Frontend](#4-configure-frontend)
  - [5. Run the Application](#5-run-the-application)
- [Database Structure](#-database-structure)
- [Default Login Credentials](#-default-login-credentials)
- [Project Structure](#-project-structure)
- [Environment Variables](#-environment-variables)
- [Troubleshooting](#-troubleshooting)

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript |
| UI Components | shadcn/ui + Tailwind CSS |
| State Management | Redux Toolkit |
| Backend | Node.js + Express.js |
| Database | PostgreSQL 14+ |
| Authentication | JWT (JSON Web Tokens) |
| Real-time | Socket.IO |
| File Uploads | Multer |

---

## ✅ Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** v18 or higher — [Download](https://nodejs.org/)
- **npm** v8+ (comes with Node.js)
- **PostgreSQL** v14 or higher — [Download](https://www.postgresql.org/download/)
- **pgAdmin 4** (optional, for database management) — [Download](https://www.pgadmin.org/)
- **Git** — [Download](https://git-scm.com/)

---

## 🚀 Installation Guide

### 1. Clone the Repository

```bash
git clone https://github.com/developer12intelliworkz-gif/proppulse_crm_v2.git
cd proppulse_crm_v2
```

---

### 2. Setup PostgreSQL Database

#### Step 2a — Create the Database

Open **pgAdmin** or **psql** and run:

```sql
CREATE DATABASE proppulse_crm;
```

#### Step 2b — Import the Full Database Schema

Use the main SQL file located at `database/CRM-0806.sql`:

**Using psql (command line):**
```bash
psql -U postgres -d proppulse_crm -f database/CRM-0806.sql
```

**Using pgAdmin:**
1. Right-click on `proppulse_crm` database → **Query Tool**
2. Open `database/CRM-0806.sql`
3. Click **Execute (F5)**

#### Step 2c — Run Migration Files (in order)

After importing the main schema, apply all migration files from the `migration/` folder **in chronological order**:

```bash
psql -U postgres -d proppulse_crm -f migration/crmfinal_30-07-2025.sql
psql -U postgres -d proppulse_crm -f migration/2026-03-24-project-units.sql
psql -U postgres -d proppulse_crm -f migration/2026-05-23-fix-project-setup-defaults.sql
psql -U postgres -d proppulse_crm -f migration/2026-05-27-project-units-quotation-columns.sql
psql -U postgres -d proppulse_crm -f migration/2026-05-27-quotations.sql
psql -U postgres -d proppulse_crm -f migration/2026-05-28-quotation-templates-multi.sql
psql -U postgres -d proppulse_crm -f migration/2026-06-01-dedupe-leads-same-inquiry-day.sql
psql -U postgres -d proppulse_crm -f migration/2026-06-03-tasks-rebuild.sql
psql -U postgres -d proppulse_crm -f migration/2026-06-06-lead-types-assignable-sort.sql
psql -U postgres -d proppulse_crm -f migration/2026-06-09-amenities-unit-types-unit-fields.sql
psql -U postgres -d proppulse_crm -f migration/2026-06-10-inventory-subcategory.sql
psql -U postgres -d proppulse_crm -f migration/2026-06-11-project-form-enhancements.sql
```

> **Note:** If `CRM-0806.sql` already includes all tables, you can skip `crmfinal_30-07-2025.sql`.

---

### 3. Configure Backend (API)

#### Step 3a — Navigate to the API folder

```bash
cd api
```

#### Step 3b — Install dependencies

```bash
npm install
```

#### Step 3c — Create the environment file

Create a file named `.env` inside the `api/` folder:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=proppulse_crm
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# Server
PORT=3001
NODE_ENV=development

# JWT Secret (change this to a strong random string)
JWT_SECRET=your_super_secret_jwt_key_here

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Email (optional - for email notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

---

### 4. Configure Frontend

#### Step 4a — Go back to root and install dependencies

```bash
cd ..
npm install
```

#### Step 4b — Create frontend environment file

Create a `.env` file in the **root** of the project:

```env
VITE_API_BASE_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
```

---

### 5. Run the Application

You need to run **two servers** simultaneously — the backend API and the frontend.

#### Terminal 1 — Start the Backend API

```bash
cd api
npm run dev
```

The API will start at: **http://localhost:3001**

#### Terminal 2 — Start the Frontend

```bash
# From the project root
npm run dev
```

The frontend will start at: **http://localhost:5173**

Open your browser and go to: **http://localhost:5173**

---

## 🗄 Database Structure

| File | Description |
|------|-------------|
| `database/CRM-0806.sql` | **Main database dump** — full schema + data (use this to set up) |
| `database/schema.sql` | Base schema only (tables, enums, indexes) |
| `database/crm_backup.sql` | Full backup with all data |
| `migration/*.sql` | Incremental migrations — run after main schema |

### Key Tables

| Table | Description |
|-------|-------------|
| `users` | CRM users with role-based access (admin/manager/agent) |
| `leads` | Leads / customer contacts |
| `projects` | Real estate projects |
| `project_units` | Individual units within a project |
| `follow_ups` | Follow-up tasks and reminders |
| `lead_activities` | Activity log for each lead |
| `quotations` | Sales quotations |
| `tasks` | Task management |

---

## 🔐 Default Login Credentials

After importing the database, you can log in with:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@demo.com` | `password` |
| Manager | `manager@demo.com` | `password` |
| Agent | `agent@demo.com` | `password` |

> ⚠️ **Change these passwords immediately** after first login in a production environment.

---

## 📁 Project Structure

```
proppulse_crm_v2/
├── api/                        # Backend (Node.js + Express)
│   ├── controllers/            # Route controllers
│   ├── config/                 # DB config, email config
│   ├── routes/                 # API routes
│   ├── utils/                  # Helper utilities
│   ├── uploads/                # Uploaded files
│   └── server.mjs              # Entry point
│
├── src/                        # Frontend (React + Vite)
│   ├── components/             # React components
│   │   ├── leads/              # Lead management
│   │   ├── projects/           # Project setup & management
│   │   ├── inventory/          # Inventory / units
│   │   ├── quotations/         # Quotation builder
│   │   ├── tasks/              # Task management
│   │   └── ui/                 # Shared UI components
│   ├── pages/                  # Route pages
│   ├── store/                  # Redux store & slices
│   ├── contexts/               # React contexts
│   └── utils/                  # Frontend utilities
│
├── database/                   # SQL files
│   ├── CRM-0806.sql            # ⬅ Main database file (import this first)
│   ├── schema.sql              # Base schema
│   └── crm_backup.sql          # Full backup
│
├── migration/                  # Incremental SQL migrations
│   ├── 2026-03-24-*.sql
│   ├── 2026-05-*.sql
│   └── 2026-06-*.sql
│
├── .env.example                # Environment variable template
├── .gitignore
└── README.md
```

---

## 🔧 Environment Variables

### Backend (`api/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DB_HOST` | ✅ | PostgreSQL host (usually `localhost`) |
| `DB_PORT` | ✅ | PostgreSQL port (default: `5432`) |
| `DB_NAME` | ✅ | Database name |
| `DB_USER` | ✅ | PostgreSQL username |
| `DB_PASSWORD` | ✅ | PostgreSQL password |
| `PORT` | ✅ | API server port (default: `3001`) |
| `JWT_SECRET` | ✅ | Secret key for JWT tokens |
| `FRONTEND_URL` | ✅ | Frontend URL for CORS |
| `NODE_ENV` | ❌ | `development` or `production` |
| `EMAIL_*` | ❌ | SMTP config for email notifications |

### Frontend (`.env` in root)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | ✅ | Backend API URL |
| `VITE_SOCKET_URL` | ✅ | Socket.IO server URL |

---

## 🐛 Troubleshooting

### ❌ Database connection error
- Make sure PostgreSQL is running
- Verify the `DB_PASSWORD` in `api/.env` matches your PostgreSQL password
- Ensure the database `proppulse_crm` exists

### ❌ Port already in use
- Frontend default: `5173` — change with `VITE_PORT=3000` in `.env`
- Backend default: `3001` — change `PORT` in `api/.env`

### ❌ CORS errors in browser
- Ensure `FRONTEND_URL` in `api/.env` exactly matches where the frontend is running (e.g., `http://localhost:5173`)

### ❌ SQL import errors
- Run migrations **in order** (oldest date first)
- If you get duplicate table errors, the main dump already includes them — skip to migrations

### ❌ JWT/Auth issues
- Make sure `JWT_SECRET` is the same in both `.env` files if split
- Clear browser localStorage and log in again

---

## 📄 License

This project is proprietary software. All rights reserved.

---

*Built with ❤️ for PropPulse Real Estate CRM*
