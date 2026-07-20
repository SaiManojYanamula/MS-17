# Study Hall Management SaaS — Feature Requirements (Final v1)

## 1. Product Overview
- Multi-tenant SaaS platform for Study Halls, Reading Rooms, Libraries, Coaching Centers
- Scale target: 1 tenant → 1000+ tenants
- Each tenant supports **multi-branch / multi-location** management
- Multi-tenancy model: **Shared Database with `tenant_id` (row-level isolation)**

## 2. Tech Stack
| Layer | Technology |
|---|---|
| Frontend | Next.js + TypeScript + Tailwind + Shadcn |
| Backend | NestJS |
| Database | MySQL + Prisma ORM |
| Caching/Queue | Redis + BullMQ |
| File Storage | Cloudflare R2 |
| Auth | JWT |
| Containerization | Docker |
| Hosting (Phase 1) | Railway |
| Hosting (Phase 2) | AWS / Kubernetes |
| CI/CD | GitHub Actions |
| Monitoring | Grafana, Prometheus, Sentry |

## 3. User Roles
1. **Super Admin** — platform-level, manages all tenants
2. **Tenant Owner** — owns a study hall business, manages all its branches
3. **Branch Manager** — manages a single branch/location
4. **Staff** — day-to-day operations (front desk, attendance, etc.)
5. **Student / Member** — end user who books seats and pays fees

## 4. Core Modules / Features
(Every item below is extracted directly from the reference screenshots — nothing left out)

### 4.1 Sidebar / Global Navigation
- Brand logo + product name + "Admin Console" subtitle
- Section grouping: **Overview** (Dashboard, Applications, Members, Seating, Payments, Reports) and **System** (Settings)
- Applications menu item shows a live pending-count badge (e.g. "7")
- Logged-in admin footer card: avatar initials, name, role label (e.g. "Ravi Kumar — Admin")
- Top-right global search bar ("Search applicant, member...")
- Top-right notification bell icon with unread-dot indicator

### 4.2 Dashboard (Overview)
- Personalized greeting ("Good morning, Ravi") with current date + room status (Open/Closed)
- 4 top stat cards, each with a small % change badge vs previous period:
  - **Active Members** total count
  - **Seats Occupied** shown as "X / Y" (occupied vs total capacity) with % badge
  - **Pending Applications** count, tagged "Action needed" if > 0
  - **Revenue This Month** total with % change badge
- **Pending Applications** panel:
  - Table columns: Applicant (name + exam/goal tag), Plan, Batch, Applied date, Status (PENDING pill)
  - Inline ✓ (approve) and ✕ (reject) action icons per row
  - "View All" link to full Applications page
- **Recent Activity** feed panel:
  - Timestamped activity lines (e.g. payment received, new application submitted, membership expiring reminder, seat-change request) with the relevant member name bolded
  - "View All" link
- **Seating Overview** mini widget:
  - Color legend: Free / Occupied / Expiring Soon
  - Compact grid of seat tiles (color-coded) mirroring the full Seating page
  - "Manage" link to full Seating page
- **Revenue — Last N Months** bar chart widget with total figure and % vs previous month, current month highlighted in a different color

### 4.3 Applications (Enrollment Requests)
- Page header with description line
- Pending-count badge in sidebar carries over here
- List/table of applications: Applicant name, exam/goal tag (e.g. UPSC Aspirant, NEET Aspirant, Bank Exams, Group I/II Aspirant), Plan (Monthly/Quarterly/Daily Pass), Batch (Morning/Day/Evening), Applied date, Status pill (PENDING)
- Inline Approve (✓) / Reject (✕) actions per application

### 4.4 Members Management
- Page header: total active members + number of batches (e.g. "248 active members across 3 batches")
- Filter tabs with live counts: All / Active / Expiring Soon / Expired
- Top-right search bar + notification bell
- Member cards in a grid, each showing: initials avatar, Name, exam/goal tag/category, Seat number, Plan, Expiry date, Status pill (Active = green dot / Expiring Soon = orange dot)

### 4.5 Seating Management
- Page header: total seats + number of zones (e.g. "120 seats across 3 zones — click any seat for details")
- Color legend: Free / Occupied / Expiring Soon
- Seat map grouped into named Zones with seat-number ranges (e.g. "Zone A — Window Row (Seats 1-24)", "Zone B — Center Hall (Seats 25-72)", "Zone C — Quiet Corner (Seats 73-120)")
- Each seat is a clickable colored tile numbered sequentially
- Right-side **Selected Seat** detail panel on click: Seat number, Status + Zone, assigned Member name, Plan, Batch timing (e.g. "Day 9 AM – 5 PM"), Expiry date
- "View Member Profile" button in the detail panel

### 4.6 Payments
- Page header with description line
- 4 summary stat cards: Collected This Month, Pending Dues, total Transactions count, Avg. Transaction value
- Filter tabs: All Transactions / Paid / Pending / Refunded
- Transaction table columns: Member (avatar initials + name + payment-type sub-label like "Monthly Renewal", "Quarterly Plan", "Daily Pass", "Monthly (New)"), Amount, Method (UPI/Cash/Card/Pending), Date, Status pill (PAID/PENDING/REFUNDED)

### 4.7 Reports & Analytics
- Page header with description line
- **Occupancy Trend — Last 8 Weeks** line/area chart
- **Plan Distribution** donut chart with legend + percentages (Monthly / Quarterly / Daily Pass / Others)
- **Revenue — Last 6 Months** bar chart, current month highlighted
- **Key Numbers** panel: Total members (all-time), Avg. membership length (in months), Renewal rate (%), Most popular batch, Most common exam/goal category

### 4.8 Settings
- Tenant/branch profile settings
- Admin/staff account management
- Notification preferences

## 5. Constraints
- WhatsApp API access not yet available (pending)
- No paid cloud budget yet — build on free tiers first, scale cost incrementally

## 6. Approach
- Docs-first: SRS → Architecture → DB Design → Coding Standards → Roadmap → then code
- Claude will write full application code end-to-end; user runs and reviews
