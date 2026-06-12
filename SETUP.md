# PACKPRO ERP — Setup & Deployment Guide

## Quick Start (Development)

```bash
# 1. Install dependencies
npm install

# 2. Create environment file
cp .env.example .env.local
# Edit .env.local and fill in your DATABASE_URL and NEXTAUTH_SECRET

# 3. Generate a secure NEXTAUTH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# 4. Start the dev server
npm run dev
# → http://localhost:3000
```

## Database Setup (PostgreSQL required for real data)

```bash
# Create database
createdb packpro_erp

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed with initial data (admin user, products, sample parties)
npx prisma db seed
# OR: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
```

### Default Credentials (after seeding)
| Role       | Email                  | Password      |
|------------|------------------------|---------------|
| Super Admin | admin@packpro.site    | packpro@2025  |
| Sales      | rahul@packpro.site     | sales@2025    |
| Accounts   | priya@packpro.site     | accounts@2025 |

## Production Deployment

### Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# NEXTAUTH_SECRET, NEXTAUTH_URL, DATABASE_URL
```

### Self-hosted (VPS / Docker)
```bash
# Build
npm run build

# Start production server
npm start
# → http://localhost:3000 (use nginx/caddy as reverse proxy)
```

### Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Architecture

```
src/
├── app/
│   ├── admin/          # Protected admin UI (16 modules)
│   ├── api/            # REST API routes
│   ├── login/          # Auth pages
│   └── signup/
├── lib/
│   ├── auth.ts         # NextAuth configuration
│   ├── db.ts           # Prisma singleton
│   ├── api.ts          # API helpers (ok/err/requireAuth)
│   └── utils.ts        # Format helpers, GST calculations
├── proxy.ts            # Route protection (Next.js 16)
└── types/
    └── next-auth.d.ts  # Session type augmentations
```

## Modules

| Module | Route | Description |
|--------|-------|-------------|
| Dashboard | /admin/dashboard | KPIs, charts, activity feed |
| CRM | /admin/crm | Lead pipeline, kanban view |
| Quotations | /admin/quotes | Quote builder, PDF export |
| Sales Orders | /admin/sales-orders | Order management |
| Invoices | /admin/invoices | GST invoice generation |
| Parties | /admin/parties | Customer/vendor management |
| Products | /admin/products | Product catalog |
| Purchases | /admin/purchases | Purchase orders |
| Inventory | /admin/inventory | Stock management |
| Dispatches | /admin/dispatches | Delivery tracking |
| Employees | /admin/hr/employees | HR management |
| Payroll | /admin/hr/payroll | Salary processing |
| Attendance | /admin/hr/attendance | Daily attendance |
| Documents | /admin/documents | Document management |
| Settings | /admin/settings | Company config, users |

## API Reference

All endpoints require authentication (Bearer JWT via cookie). Unauthenticated requests return `401`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/parties | List parties (paginated) |
| POST | /api/parties | Create party |
| GET | /api/invoices | List invoices |
| POST | /api/invoices | Create invoice |
| POST | /api/invoices/[id] | Record payment |
| GET | /api/products | Product catalog |
| GET | /api/leads | Lead pipeline |
| POST | /api/quotes | Create quotation |
| POST | /api/auth/signup | Register user |
