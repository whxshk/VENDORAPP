# SharkBand — Waddy Phase 3

Universal loyalty platform with a NestJS backend and React/Vite customer app.

## Project Structure

```
Waddy-Phase-3/
├── backend/                  # NestJS API (port 3001)
└── clients/
    ├── customer-app/         # React/Vite customer PWA (port 5174)
    ├── merchant-dashboard/   # React/Vite merchant dashboard (port 5173)
    └── vendor-app/           # Vendor app
```

## Quick Start

### 1. Backend

```bash
cd backend

# Copy env file and fill in your MongoDB connection string
cp .env.example .env
# Edit .env: set DATABASE_URL to your MongoDB Atlas URI

npm install
npm run start:dev
# API runs at http://localhost:3001
# Swagger docs at http://localhost:3001/api/docs
```

### 2. Customer App

```bash
cd clients/customer-app

# .env is already configured for local dev (proxies to backend on 3001)
npm install
npm run dev
# App runs at http://localhost:5174
```

### 3. Merchant Dashboard

```bash
cd clients/merchant-dashboard
npm install
npm run dev
# App runs at http://localhost:5173
```

## API Endpoints (Customer-Facing)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | Login (email + password) |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| GET | `/api/v1/auth/me` | Get current user |
| GET | `/api/v1/customers/me` | Get customer profile |
| GET | `/api/v1/customers/me/memberships` | Get all loyalty memberships |
| GET | `/api/v1/customers/me/qr-token` | Get rotating QR code payload |
| DELETE | `/api/v1/customers/me` | Delete customer account |
| GET | `/api/v1/merchants` | List all active merchants (public) |
| GET | `/api/v1/merchants/:id` | Get merchant by ID (public) |
| GET | `/api/v1/ledger/history` | Get transaction history |
| GET | `/api/v1/ledger/balance` | Get points balance |
| GET | `/api/v1/rewards` | List rewards |

## Customer App Pages

| Page | Route | Description |
|------|-------|-------------|
| Home | `/Home` | QR code display |
| Wallet | `/Wallet` | Loyalty cards |
| Activity | `/Activity` | Transaction history |
| Discover | `/Discover` | Find merchants |
| MerchantDetail | `/MerchantDetail?merchantId=X` | Merchant details + rewards |
| Profile | `/Profile` | User profile + settings |
| PhoneInput | `/PhoneInput` | Login (email/password) |

## Environment Variables

### Backend (`backend/.env`)
- `DATABASE_URL` — MongoDB Atlas connection string **(required)**
- `JWT_SECRET` — JWT signing secret **(required)**
- `JWT_REFRESH_TOKEN_SECRET` — Refresh token secret **(required)**
- `PORT` — Server port (default: `3001`)
- `CORS_ORIGIN` — Allowed CORS origin (default: `*`)
- `SMTP_*` — Email config for staff invite emails

### Customer App (`clients/customer-app/.env`)
- `VITE_API_BASE_URL` — API base URL (default: `/api/v1`, proxied to `localhost:3001`)
