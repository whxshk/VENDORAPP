# SharkBand Merchant Dashboard

Production-grade UI foundation for SharkBand multi-tenant loyalty platform.

## Features

- **Complete Merchant Dashboard** with 8 pages:
  - Dashboard Overview (KPIs, Recent Activity, Alerts)
  - Scan Processing (Issue Points / Redeem Rewards)
  - Customers Management (Table, Search, Detail View with Charts)
  - Transactions (Filterable Table, CSV Export)
  - Rewards Management (Create/Edit/Delete)
  - Staff Management (Invite, Roles)
  - Settings (Profile, Branches, API Keys, Preferences)
  - Pilot Report (Weekly Analytics)

- **Mock API Layer** with Demo Mode toggle
- **Responsive Design** with dark theme matching SharkBand brand
- **Type-Safe** with TypeScript interfaces for all data contracts

## Tech Stack

- **React 18** + **TypeScript**
- **Vite** (build tool)
- **React Router** (routing)
- **TanStack Query** (data fetching & caching)
- **TanStack Table** (tables)
- **React Hook Form** + **Zod** (forms & validation)
- **Recharts** (charts)
- **Zustand** (state management)
- **Tailwind CSS** (styling)
- **Lucide React** (icons)

## Project Structure

```
src/
├── api/
│   ├── types.ts              # All TypeScript interfaces
│   ├── mockData.ts           # Seed data for demo mode
│   ├── demoMode.ts           # Demo mode toggle logic
│   ├── merchant.ts           # API functions (mock/real switching)
│   └── client.ts             # Axios wrapper
├── components/
│   ├── ui/                   # Base UI components (shadcn/ui style)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   ├── select.tsx
│   │   ├── badge.tsx
│   │   └── tabs.tsx
│   ├── dashboard/            # Dashboard-specific components
│   │   ├── KPICard.tsx
│   │   └── AlertsWidget.tsx
│   └── layout/               # Layout components
│       ├── DashboardLayout.tsx
│       ├── Sidebar.tsx
│       └── TopBar.tsx
├── pages/
│   ├── Login.tsx             # Login page
│   └── dashboard/             # Dashboard pages
│       ├── DashboardHome.tsx
│       ├── ScanPage.tsx
│       ├── CustomersPage.tsx
│       ├── TransactionsPage.tsx
│       ├── RewardsPage.tsx
│       ├── StaffPage.tsx
│       └── SettingsPage.tsx
├── hooks/                     # React Query hooks
│   ├── useDashboardSummary.ts
│   ├── useCustomers.ts
│   ├── useTransactions.ts
│   ├── useRewards.ts
│   ├── useStaff.ts
│   └── useMerchant.ts
├── store/                     # Zustand stores
│   └── authStore.ts
├── lib/                       # Utilities
│   └── utils.ts
└── config/                    # Configuration
    └── env.ts
```

## Demo Mode

The application supports **Demo Mode** which uses mock data instead of real API calls. This allows the UI to work completely independently of the backend.

### How Demo Mode Works

1. **Environment Variable**: Set `VITE_DEMO_MODE=true` in your `.env` file
2. **Automatic Switching**: All API functions in `src/api/merchant.ts` check `isDemoMode()` and return mock data or make real API calls
3. **Mock Data**: Seed data is defined in `src/api/mockData.ts` and persists in memory (resets on refresh)
4. **Visual Indicator**: A "DEMO MODE" badge appears in the top bar when enabled

### Switching Between Modes

**Enable Demo Mode:**
```bash
# In .env file
VITE_DEMO_MODE=true
```

**Disable Demo Mode (Use Real API):**
```bash
# In .env file
VITE_DEMO_MODE=false
# or remove the variable
```

After changing the environment variable, restart the development server.

### Mock Data Features

- **20+ mock customers** with points balances and visit history
- **50+ mock transactions** (earn/redeem)
- **5+ reward rules**
- **5+ staff members**
- **Real-time updates**: `simulateScan()` updates mock data immediately
- **Persistent in memory**: Data persists during session, resets on refresh

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend running (optional if using demo mode)

### Installation

```bash
cd clients/merchant-dashboard
npm install
```

### Environment Setup

Create a `.env` file in `clients/merchant-dashboard/`:

```env
VITE_DEMO_MODE=true
VITE_API_BASE_URL=/api/v1
VITE_BACKEND_ORIGIN=http://localhost:3001
VITE_ENVIRONMENT=DEMO
```

### Running in Demo Mode

```bash
npm run dev
```

The app will start at `http://localhost:5173` and use mock data.

### Running with Real API

1. Set `VITE_DEMO_MODE=false` in `.env`
2. Ensure backend is running at `http://localhost:3001`
3. Restart dev server: `npm run dev`

## Login Credentials (Demo Mode)

When using demo mode, you can use any credentials (the mock API accepts any login). For consistency:

- **Email**: `admin@demo.com`
- **Password**: `demo123456`

## Login Credentials (Real API after seed)

- **MERCHANT_ADMIN**: `admin@example.com` / `password123`
- **MANAGER**: `manager@example.com` / `password123`
- **CASHIER**: `cashier@example.com` / `password123`
- **STAFF**: `staff@example.com` / `password123`

## API Contracts

All API functions are defined in `src/api/merchant.ts` with TypeScript interfaces in `src/api/types.ts`. Each function:

1. Checks `isDemoMode()`
2. Returns mock data if demo mode is enabled
3. Makes real API call if demo mode is disabled

### Key API Functions

- `getDashboardSummary()` - Dashboard KPIs and recent activity
- `listCustomers(params?)` - Paginated customer list with search
- `getCustomer(id)` - Customer detail with points history
- `listTransactions(params?)` - Filterable transactions
- `listRewards()` - Reward catalog
- `createReward(params)` - Add new reward
- `listStaff()` - Staff members
- `inviteStaff(params)` - Invite new staff
- `simulateScan(params)` - Process scan (updates mock data in real-time)
- `getPilotReport(week?)` - Weekly pilot report
- `getMerchantSettings()` - Merchant profile
- `updateMerchantSettings(params)` - Update merchant profile

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Next Steps: Connecting Backend

When ready to connect to the real backend:

1. **Update API Endpoints**: Modify `src/api/merchant.ts` to match your backend routes
2. **Update Types**: Ensure `src/api/types.ts` matches your backend response formats
3. **Disable Demo Mode**: Set `VITE_DEMO_MODE=false`
4. **Test**: Verify all pages work with real data

The API layer is designed to make this transition seamless - just update the endpoint URLs and response handling.

## Customer App

A minimal customer app UI is scaffolded in `/clients/customer-app` with:
- Login Screen
- Home Screen (QR code + points balance)
- Rewards Screen (redeemable items)
- History Screen (transaction history)

The customer app uses React Native/Expo and is separate from the merchant dashboard.

## Development Notes

- All pages include loading states, empty states, and error handling
- Components are reusable and follow consistent patterns
- Dark theme with SharkBand brand colors (blue/purple gradients)
- Responsive design (desktop-first, tablet-friendly)
- Type-safe throughout with TypeScript
