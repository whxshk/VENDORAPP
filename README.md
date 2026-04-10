# SharkBand - Waddy

A universal loyalty platform connecting merchants with customers through digital points and stamp cards. Customers carry a single digital wallet, merchants create their own rewards programs, and the platform ties everything together.

---

## What It Does

| Who | What they get |
|-----|---------------|
| **Customers** | A digital loyalty wallet - earn points or stamps at every participating merchant, redeem rewards, track history, discover new merchants nearby |
| **Merchants** | A dashboard to run their loyalty program - view analytics, manage rewards, scan customers, adjust balances, and manage staff |
| **Admins** | A platform-wide control panel - monitor all merchants and customers, view audit logs, detect fraud |

---

## System Architecture

Multi-tenant: Every merchant is an isolated tenant. Customers belong to the shared platform tenant and maintain separate loyalty accounts per merchant.

**Components:**
- NestJS backend REST API (port 3001) + Swagger docs at /api/docs
- React/Vite customer PWA (port 5174)
- React/Vite TypeScript merchant dashboard (port 5173)
- React/Vite TypeScript admin dashboard (in development)
- MongoDB Atlas (database)
- NATS message broker (events)
- SMTP (email - staff invites, password reset)

---

## Project Structure

```
Waddy/
|-- backend/                  # NestJS API (port 3001)
|   |-- src/
|       |-- analytics/        # Dashboard metrics, pilot reports
|       |-- auth/             # Login, OTP, password reset, JWT
|       |-- customers/        # Customer profiles, memberships, QR tokens
|       |-- devices/          # Registered QR scanners
|       |-- fraud-signals/    # Fraud detection
|       |-- ledger/           # Immutable transaction ledger, balances
|       |-- locations/        # Merchant branches and stores
|       |-- merchant/         # Merchant settings, config
|       |-- merchants/        # Public merchant listing, geospatial search
|       |-- onboarding/       # Merchant signup, staff invites
|       |-- operator-tools/   # Admin utilities
|       |-- rewards/          # Reward CRUD (points and stamps)
|       |-- rulesets/         # Configurable business rules
|       |-- scan/             # QR scan processing
|       |-- transactions/     # Issue/redeem points, history
|       |-- users/            # Staff user management
|
|-- clients/
    |-- customer-app/         # React/Vite customer PWA (port 5174)
    |-- merchant-dashboard/   # React/Vite merchant dashboard (port 5173)
    |-- admin-dashboard/      # React/Vite admin dashboard (in development)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend framework | NestJS 11 on Fastify |
| Database | MongoDB (Mongoose 8) |
| Message broker | NATS 2.10 |
| Auth | JWT (access + refresh tokens), bcrypt, OTP |
| API docs | Swagger / OpenAPI |
| Frontend | React 18, Vite, Tailwind CSS |
| Server state | TanStack Query |
| Client state | Zustand |
| Charts | Recharts |
| Tables | TanStack Table |
| Animations | Framer Motion (customer app) |
| Language | TypeScript (backend + dashboards), JavaScript (customer app) |
| Deployment | Azure App Service (backend), Azure Static Web Apps (frontends) |
| CI/CD | GitHub Actions |

---

## Quick Start

### 1. Backend

```bash
cd backend
cp .env.example .env
# Fill in: DATABASE_URL, JWT_SECRET, JWT_REFRESH_TOKEN_SECRET

npm install
npm run start:dev
# API:  http://localhost:3001
# Docs: http://localhost:3001/api/docs
```

Or with Docker:

```bash
cd backend
docker-compose up
```

### 2. Customer App

```bash
cd clients/customer-app
npm install
npm run dev
# http://localhost:5174
```

### 3. Merchant Dashboard

```bash
cd clients/merchant-dashboard
npm install
npm run dev
# http://localhost:5173
```

### 4. Admin Dashboard

```bash
cd clients/admin-dashboard
npm install
npm run dev
```

---

## Customer App

A mobile-first PWA customers install on their phone.

### Pages

| Page | Description |
|------|-------------|
| **Home** | Rotating QR code (refreshes every 30s) for scanning at merchants. Shows total points and merchant count. |
| **Wallet** | All loyalty cards in one place - stamps, points, current balance per merchant. Search and filter by category. |
| **Discover** | Browse all merchants with category filters. Geolocation-based near-me sorting. Map view option. |
| **Activity** | Full transaction history with infinite scroll. Earn/redeem breakdown, monthly summaries, insights. |
| **Merchant Detail** | Merchant info, available rewards, tap to redeem. |
| **Profile** | Account settings, preferences, delete account. |

### Key Features

- **Rotating QR tokens** - New token every 30 seconds, cryptographically signed, prevents replay attacks
- **Multi-merchant wallet** - One app, loyalty programs from every merchant
- **Geospatial discovery** - Find merchants near current location using MongoDB 2dsphere queries
- **Offline-ready PWA** - Installable on iOS and Android
- **OTP login** - 6-digit email OTP as an alternative to password

---

## Merchant Dashboard

A web dashboard for merchant staff to run their loyalty program.

### Pages

| Page | Description |
|------|-------------|
| **Dashboard** | KPI cards, charts, live activity feed, alerts |
| **Process Scan** | Scan a customer QR to issue points/stamps or redeem a reward |
| **Customers** | Search and view customers, adjust balances |
| **Transactions** | Full transaction history with filters by type, date, location |
| **Rewards** | Create and manage rewards (points-based or stamp-based) |
| **Staff** | Invite staff by email, assign roles, track status |
| **Settings** | Merchant profile, branch/location management |

### Dashboard Metrics

| Metric | Description |
|--------|-------------|
| Today's Customers | Unique visitors today |
| Repeat Customers | Today's visitors who have been before |
| Total Scans | All-time transaction count |
| Redemption Rate | Redeems divided by issues (all-time) |
| Points / Stamps Issued | All-time totals (shown based on loyalty mode) |
| Points / Stamps Redeemed | All-time totals |

### Charts

- **Earn vs Redeem** - Hourly bar chart of earn and redeem counts for today
- **Peak Hours** - Sliding 8-hour transaction volume curve (auto-advances with time of day)
- **Customer Mix** - Donut chart of new vs returning customers
- **Top Redeemed Rewards** - Bar chart of most-redeemed rewards (all-time)

### Loyalty Modes

The dashboard adapts to the merchant reward configuration:

| Mode | Shown when |
|------|-----------|
| **Stamps only** | Merchant has only stamp rewards configured |
| **Points only** | Merchant has only points rewards configured |
| **Both** | Merchant has both types of rewards |

### Staff Roles

owner > manager > cashier > staff

All roles can process scans. Only owners/managers can manage rewards and staff.

---

## Admin Dashboard

Platform-wide control panel (in active development).

### Features

- Platform-wide KPIs - total customers, transactions, points issued/redeemed, conversion rate
- Merchant management - view, edit, monitor all merchants
- Customer management - platform-wide customer list and individual account management
- Fraud signals - detection and investigation tools
- Audit logs - complete system event trail

---

## Backend - Key Concepts

### Authentication

```
POST /api/v1/auth/login              - email + password
POST /api/v1/auth/request-login-otp  - request 6-digit OTP
POST /api/v1/auth/verify-otp         - verify OTP, receive tokens
POST /api/v1/auth/refresh            - refresh access token
POST /api/v1/auth/register           - create account
POST /api/v1/auth/forgot-password    - request reset email
POST /api/v1/auth/reset-password     - reset with token
```

Scopes: customer:* | merchant:* | scan:* | admin:*

### How a Scan Works

1. Customer opens app - QR token displayed, rotates every 30 seconds
2. Staff scans QR on the merchant dashboard
3. Backend receives POST /api/v1/scans/apply
   - purpose PURCHASE - issues points or stamps
   - purpose REDEEM - redeems a reward
4. Transaction recorded (idempotent - duplicate scans silently ignored)
5. Ledger entry appended, customer balance updated

### Data Models (21 MongoDB Collections)

| Collection | Purpose |
|-----------|---------|
| users | Staff and system accounts |
| tenants | Merchant tenant records (with geolocation index) |
| customers | Customer accounts with rotating QR secret |
| customerMerchantAccounts | Per-merchant loyalty account |
| transactions | ISSUE / REDEEM transaction records |
| loyaltyLedgerEntries | Immutable event-sourced balance ledger |
| redemptions | Specific reward redemption records |
| rewards | Merchant reward catalog |
| locations | Merchant branch locations |
| devices | Registered scanner devices |
| scanEvents | Raw QR scan events |
| rulesets | Business rules (time-based, threshold-based) |
| auditLogs | System audit trail |
| outboxEvents | Reliable event publishing (outbox pattern) |
| usedQrTokens | Replay attack prevention |
| pilotDailyMetrics | Daily KPI snapshots |
| pilotOnboardingFunnels | Merchant onboarding tracking |
| pilotCustomerActivity | Per-customer pilot activity |
| pilotRewardUsage | Reward usage tracking |
| customerBalances | Cached balance per customer |
| transactionSummaries | Aggregated summaries |

### Architectural Patterns

- **Multi-tenant isolation** - All queries scoped to tenantId
- **Event-sourced ledger** - Balance is the sum of all ledger entries; no mutable balance field to corrupt
- **Idempotency keys** - Every scan/transaction carries a UUID; duplicates are silently ignored
- **Outbox pattern** - Events written to MongoDB before publishing to NATS; no lost messages
- **Rotating QR tokens** - HMAC-signed, time-windowed; backend rejects expired tokens
- **Geospatial indexing** - 2dsphere index on tenants for nearby merchant queries
- **Scope-based access** - Guards enforce scopes on every endpoint
- **Read models** - Denormalized aggregates precomputed for dashboard performance

---

## API Reference

### Customer-Facing

```
Auth
  POST   /api/v1/auth/login
  POST   /api/v1/auth/refresh
  GET    /api/v1/auth/me
  POST   /api/v1/auth/register
  POST   /api/v1/auth/request-login-otp
  POST   /api/v1/auth/verify-otp
  POST   /api/v1/auth/forgot-password
  POST   /api/v1/auth/reset-password

Customer
  GET    /api/v1/customers/me
  GET    /api/v1/customers/me/memberships
  GET    /api/v1/customers/me/qr-token
  DELETE /api/v1/customers/me

Merchants (public)
  GET    /api/v1/merchants
  GET    /api/v1/merchants/nearby
  GET    /api/v1/merchants/:id
  GET    /api/v1/merchants/:id/rewards

Ledger
  GET    /api/v1/ledger/balance
  GET    /api/v1/ledger/history

Scanning
  POST   /api/v1/scans/apply
```

### Merchant-Facing

```
Dashboard
  GET    /api/v1/analytics/dashboard

Customers
  GET    /api/v1/customers
  GET    /api/v1/customers/:id
  POST   /api/v1/customers/:id/adjust

Transactions
  GET    /api/v1/transactions
  POST   /api/v1/transactions/issue
  POST   /api/v1/transactions/redeem

Rewards
  GET    /api/v1/rewards
  POST   /api/v1/rewards
  PATCH  /api/v1/rewards/:id
  DELETE /api/v1/rewards/:id

Staff
  GET    /api/v1/users
  POST   /api/v1/onboarding/invite-staff

Locations
  GET    /api/v1/locations
  POST   /api/v1/locations
  PATCH  /api/v1/locations/:id
```

---

## Deployment

All deployments are automated via GitHub Actions on push to main.

| Component | Platform | Trigger |
|-----------|---------|---------|
| Backend | Azure App Service (sharkband-api) | backend/** changes |
| Customer App | Azure Static Web Apps | clients/customer-app/** changes |
| Merchant Dashboard | Azure Static Web Apps | clients/merchant-dashboard/** changes |

Auth to Azure uses OIDC federated identity - no secrets stored in the repo.

---

## Environment Variables

### Backend (backend/.env)

```env
# Required
DATABASE_URL=mongodb+srv://...
JWT_SECRET=...
JWT_REFRESH_TOKEN_SECRET=...

# Optional
NODE_ENV=development
PORT=3001
NATS_URL=nats://localhost:4222
CORS_ORIGIN=*
FRONTEND_URL=http://localhost:5173
CUSTOMER_APP_URL=http://localhost:5174

# Email (staff invites and password reset)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=noreply@sharkband.com

# Maps (for geocoding)
GOOGLE_MAPS_API_KEY=...
```

### Customer App (clients/customer-app/.env)

```env
VITE_API_BASE_URL=/api/v1
```
