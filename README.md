# NIRMAN PRO

**Smart Construction Planning, Quantity Surveying & Cost Estimation Platform**

A full-stack web application for construction professionals, quantity surveyors, site engineers, and contractors to plan buildings, design floor plans, calculate quantities, generate BOQs, and estimate costs.

## Features

- 🔐 **Real User Authentication** — Email/Password, Google OAuth, 6-Digit Email OTP, Forgot Password & Password Reset
- 👤 **Role-Based Access Control (RBAC)** — ADMIN, QUANTITY SURVEYOR, SITE ENGINEER, CONTRACTOR
- 📊 **Project Dashboard** — Manage multiple construction projects with real-time statistics
- ✏️ **2D Building Planner** — Interactive drawing canvas with walls, columns, beams, slabs, doors, windows, staircases, foundations, and roofs
- 🏗️ **Multi-Floor Support** — Design and manage multiple floors independently (Ground, 1st, 2nd, Terrace, Foundation)
- 📐 **Smart Quantity Engine** — Real-time calculation of areas, volumes, brickwork, RCC concrete, rebar steel, plastering, and painting
- 📋 **Automated BOQ** — Auto-generated Bill of Quantities with S.No, Item, Description, Unit, Quantity, Rate, Amount
- 💰 **Material, Labour & Equipment Engines** — Automatic resource and cost calculations
- 📑 **PDF & Excel Reports** — Professional NIRMAN PRO branded report export

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Design Canvas | React Konva (HTML5 Canvas) |
| Backend | NestJS, TypeScript |
| Database | SQLite / PostgreSQL |
| ORM | Prisma |
| Auth | JWT, Google OAuth 2.0, Email OTP, bcrypt |
| Reports | jsPDF, ExcelJS |

## Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd buildplan-ai
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your SMTP and OAuth credentials
npm install
npx prisma generate
cmd /c npx prisma db push --force-reset
cmd /c npx ts-node prisma/seed.ts
npm run start:dev
```

Backend runs at: http://localhost:3000

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: http://localhost:5173

## Environment Variables

Copy `.env.example` to `.env` in the backend directory and configure:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Database connection string |
| `JWT_SECRET` | Secret key for JWT tokens |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `SMTP_HOST` | Email SMTP host |
| `SMTP_USER` | Email sender address |
| `SMTP_PASS` | Email app password |

## API Endpoints

### Authentication
- `POST /auth/signup` — Register account with verification code
- `POST /auth/login` — Login with email/password
- `POST /auth/google` — Google OAuth authentication
- `POST /auth/send-otp` — Send 6-digit OTP to email
- `POST /auth/verify-otp` — Verify 6-digit OTP
- `POST /auth/forgot-password` — Request password reset
- `POST /auth/reset-password` — Reset password
- `POST /auth/logout` — Logout user session
- `GET /auth/me` — Get current user profile

### Projects & Planner
- `GET /projects` — List user's projects
- `POST /projects` — Create project with fixed unit system
- `GET /projects/:id` — Get project details
- `PUT /projects/:id` — Update project
- `DELETE /projects/:id` — Delete project
- `GET /projects/:id/design` — Fetch design layout
- `PUT /projects/:id/design` — Save design layout
- `POST /projects/:id/design/autosave` — Autosave design layout
- `GET /projects/:id/quantities` — Fetch building quantities
- `GET /projects/:id/materials` — Fetch material requirements
- `GET /projects/:id/labour` — Fetch labour requirements
- `GET /projects/:id/equipment` — Fetch equipment requirements
- `GET /projects/:id/cost` — Fetch cost estimate summary
- `GET /projects/:id/boq` — Fetch BOQ items
- `GET /projects/:id/reports` — Fetch report data
- `POST /projects/:id/reports/pdf` — Generate PDF report
- `POST /projects/:id/reports/excel` — Generate Excel report

## License

NIRMAN PRO — Smart Construction Planning, Quantity Surveying & Cost Estimation Platform.
