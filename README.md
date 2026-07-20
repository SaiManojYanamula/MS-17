# Study Hall Management SaaS

Multi-tenant SaaS for Study Halls, Reading Rooms, Libraries, and Coaching Centers.
Built to scale from 1 → 1000+ tenants, with multi-branch support per tenant.

## Structure

```
study-hall-saas/
├── backend/     NestJS + Prisma + MySQL API
├── frontend/    Next.js + Tailwind admin console (matches Akshara reference UI)
└── docs/        Feature requirements
```

## Multi-tenancy model
Shared database, row-level isolation via a `tenantId` column on every tenant-owned
table. Enforced in two places:
1. `TenantMiddleware` (backend) — decodes the JWT on every request and attaches
   `tenantId` to it.
2. Every Prisma query in every service filters by `tenantId` explicitly.

## User Roles
Super Admin, Tenant Owner, Branch Manager, Staff, Student/Member — enforced via
the `@Roles()` decorator + `RolesGuard` on backend routes.

## Getting started — Option A: Docker (recommended)

Everything (backend, frontend, MySQL, Redis) runs in containers — nothing to
install locally except Docker itself.

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000/api
- MySQL: localhost:3306 (user `studyhall` / pass `studyhallpass`, db `study_hall_saas`)
- Redis: localhost:6379

First time only — load the sample data (matching the reference screenshots)
once the containers are up:
```bash
docker compose exec backend npm run seed
```

To stop everything: `docker compose down` (add `-v` to also wipe the DB volume).
To rebuild after changing code: `docker compose up --build` again.

## Getting started — Option B: Without Docker (local Node + MySQL)

### Backend
```bash
cd backend
npm install
cp .env.example .env      # fill in your MySQL connection string + a JWT secret
npx prisma migrate dev    # creates tables
npm run seed               # loads sample data matching the reference screenshots
npm run start:dev          # runs on http://localhost:4000/api
```

You can get a free MySQL instance from Railway, PlanetScale, or install MySQL
locally while you don't have paid cloud budget yet.

### Frontend
```bash
cd frontend
npm install
npm run dev                # runs on http://localhost:3000
```

The frontend works standalone with bundled demo data even before the backend is
running — every page fetches from the API first and silently falls back to
`lib/mockData.ts` if the request fails, so you always have something to look at.
Once the backend is live, remove the `.catch(() => {})` fallbacks page by page.

## What's implemented
- Dashboard: stat cards, pending applications, recent activity, seating mini-grid, revenue chart
- Applications: approve/reject flow (approving creates a real Member + computes expiry by plan)
- Members: filter tabs (All/Active/Expiring/Expired) + search
- Seating: zone-based seat map, click-to-view detail panel, assign/release API
- Payments: summary cards, transaction table with filter tabs, refund action
- Reports & Analytics: occupancy trend, plan distribution donut, revenue trend, key numbers
- Settings: tenant/branch profile, admin accounts, notification preferences

## Next steps (not yet built)
- Redis + BullMQ background jobs (expiry reminders, WhatsApp notifications once API access is granted)
- Cloudflare R2 file uploads (member photos/documents)
- Docker Compose for local dev (backend Dockerfile is included; frontend + DB + Redis still to add)
- CI/CD (GitHub Actions) and monitoring (Grafana/Prometheus/Sentry) — planned for post-MVP
