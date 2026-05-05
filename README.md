# Poultry Farm Management & Accounting

Full-stack application for poultry operations and voucher-based accounting: **React + Tailwind** frontend, **Node.js + Express + MongoDB** backend, **JWT** authentication.

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [MongoDB](https://www.mongodb.com/) 6+ (local or Atlas)

## 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env — set MONGODB_URI and JWT_SECRET
npm install
npm run seed
npm run dev
```

API base URL defaults to `http://localhost:5000`. Health check: `GET http://localhost:5000/api/health`.

**Seeded login:** `admin@farm.local` / `admin123`

## 2. Frontend

```bash
cd frontend
cp .env.example .env
# VITE_API_URL=http://localhost:5000/api
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). Sign in with the seeded user.

## 3. Architecture Notes

- **Backend:** MVC-style folders (`models`, `controllers`, `routes`, `middleware`, `services`). REST paths under `/api`. Inventory quantities update from purchase, sale, transfer, and return vouchers; movements are stored for history.
- **Frontend:** Top navigation (no dashboard shell), **Home** as landing screen, business-style forms and tables. Reusable UI pieces live under `src/components`.

## 4. Environment Variables

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | Mongo connection string |
| `JWT_SECRET` | Secret for signing tokens |
| `JWT_EXPIRES_IN` | Token lifetime (default `7d`) |
| `PORT` | API port (default `5000`) |
| `CORS_ORIGIN` | Allowed browser origin (e.g. `http://localhost:5173`) |
| `VITE_API_URL` | Frontend: API base including `/api` |

## 5. Production Hardening (later)

Use strong `JWT_SECRET`, HTTPS, rate limiting, input sanitization, role-based route guards, and full double-entry validation for financial closings.
"# poultry" 
