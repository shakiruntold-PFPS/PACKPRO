# PACKPRO — Production Deployment Guide

> Complete step-by-step guide to deploy PACKPRO on a live domain.
> Estimated setup time: 60–90 minutes for a first deployment.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          PACKPRO PLATFORM                               │
│                                                                         │
│  ┌──────────────┐    ┌──────────────────────┐    ┌────────────────────┐ │
│  │   Browser /  │    │       Vercel          │    │    Neon            │ │
│  │   Mobile     │───▶│  Next.js 15 App       │───▶│  PostgreSQL 16     │ │
│  │   App        │    │  ─────────────────── │    │  (Serverless)      │ │
│  └──────────────┘    │  • App Router UI      │    │  ─────────────────│ │
│                      │  • REST API Routes    │    │  • All business    │ │
│  ┌──────────────┐    │  • NextAuth Sessions  │    │    data            │ │
│  │  Cloudflare  │    │  • Server Actions     │    │  • Audit logs      │ │
│  │  DNS + CDN   │───▶│  • Edge Middleware    │    │  • Full text idx   │ │
│  │  packpro.site│    └──────────────────────┘    └────────────────────┘ │
│  └──────────────┘              │                                        │
│                                │                                        │
│                     ┌──────────▼──────────┐                             │
│                     │  Cloudflare R2       │                             │
│                     │  Object Storage      │                             │
│                     │  ─────────────────  │                             │
│                     │  • Product images    │                             │
│                     │  • Invoice PDFs      │                             │
│                     │  • Documents         │                             │
│                     │  • Employee files    │                             │
│                     └─────────────────────┘                             │
└─────────────────────────────────────────────────────────────────────────┘

Data Flow:
  User Request → Cloudflare DNS → Vercel Edge (middleware auth check)
              → Next.js Route Handler → Prisma ORM → Neon PostgreSQL
              → Response (JSON / HTML / PDF)

File Upload:
  Browser → /api/upload → storage.ts → Cloudflare R2
          → Returns CDN URL → Stored in DB as product.images / document.url
```

---

## 1. Prerequisites

| Tool | Install command |
|------|-----------------|
| Node.js 20+ | `nvm install 20` |
| npm 10+ | bundled with Node |
| Git | `brew install git` / apt |
| Vercel CLI | `npm i -g vercel` |

Accounts required (all have free tiers):
- **Vercel** — vercel.com (frontend + API hosting)
- **Neon** — neon.tech (PostgreSQL — free tier: 0.5GB, 1 branch)
- **Cloudflare** — cloudflare.com (R2 storage + DNS — free tier: 10GB R2)

---

## 2. Database Setup — Neon PostgreSQL

### 2a. Create database

1. Go to **neon.tech** → Sign in → **Create a project**
2. Project name: `packpro-erp`
3. Region: **Asia Pacific (Singapore)** — closest to Rajasthan/India
4. Select **PostgreSQL 16**
5. Click **Create project**

### 2b. Get connection strings

In the Neon dashboard → **Connection Details**:

```
# Pooled (use as DATABASE_URL in Vercel)
postgresql://neondb_owner:<password>@ep-xxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require

# Direct (use as DIRECT_URL for migrations)
postgresql://neondb_owner:<password>@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

> **Why two URLs?**
> The pooled URL uses PgBouncer — it's faster for serverless but doesn't support all migration commands.
> Prisma migrations need the direct URL. Vercel runtime uses the pooled URL.

### 2c. Update Prisma schema for Neon

Add `directUrl` to `prisma/schema.prisma` datasource block:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### 2d. Run database migrations

```bash
# In your local project directory with .env.local configured:
npx prisma migrate dev --name init
```

This creates the `prisma/migrations/` directory. Commit these files.

### 2e. Initial seed

After the schema is deployed:
```bash
# Option A: via CLI (requires DIRECT_URL locally)
npx prisma db seed

# Option B: via HTTP after first Vercel deploy
curl -X POST https://app.packpro.site/api/setup
```

---

## 3. File Storage — Cloudflare R2

### 3a. Create R2 bucket

1. Log in to **Cloudflare dashboard** → **R2 Object Storage**
2. Click **Create bucket**
3. Bucket name: `packpro-assets`
4. Location: **Asia Pacific (APAC)** or Auto

### 3b. Create API token

1. R2 Dashboard → **Manage R2 API Tokens** → **Create API Token**
2. Permissions: **Object Read & Write**
3. Specify bucket: `packpro-assets`
4. Copy the **Access Key ID** and **Secret Access Key** — shown only once

### 3c. Get endpoint

```
Account ID: found in Cloudflare dashboard right sidebar
R2 Endpoint: https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

### 3d. Enable public access (for product images)

1. In the bucket settings → **Settings** → **Public Access**
2. Toggle **Allow Access** → copy the public URL
3. Or connect a custom domain: `assets.packpro.site` → CNAME to R2 bucket URL

---

## 4. Application Deployment — Vercel

### 4a. Connect GitHub repository

1. Go to **vercel.com** → **Add New Project**
2. Import your GitHub repository: `shakiruntold-PFPS/PACKPRO`
3. Framework: **Next.js** (auto-detected)
4. Root directory: `/` (default)
5. Do NOT deploy yet — configure environment variables first

### 4b. Set environment variables

In Vercel → Project → **Settings** → **Environment Variables**, add all of these:

#### Required — App will not start without these

```
DATABASE_URL          = postgresql://...pooler...neon.tech/neondb?sslmode=require
DIRECT_URL            = postgresql://...direct...neon.tech/neondb?sslmode=require
NEXTAUTH_SECRET       = <generate: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))">
NEXTAUTH_URL          = https://app.packpro.site
NODE_ENV              = production
```

#### Required — File storage (without this, uploads will fail)

```
STORAGE_PROVIDER      = r2
STORAGE_BUCKET        = packpro-assets
STORAGE_ENDPOINT      = https://<ACCOUNT_ID>.r2.cloudflarestorage.com
STORAGE_ACCESS_KEY    = <R2 Access Key ID>
STORAGE_SECRET_KEY    = <R2 Secret Access Key>
STORAGE_REGION        = auto
NEXT_PUBLIC_STORAGE_BASE_URL = https://assets.packpro.site
```

#### Optional — Enable when ready

```
# Email (invoice delivery, reminders)
SMTP_HOST             = smtp.resend.com
SMTP_PORT             = 587
SMTP_USER             = resend
SMTP_PASS             = <Resend API Key>
SMTP_FROM             = PACKPRO <noreply@packpro.site>

# AI features (Phase 4)
ANTHROPIC_API_KEY     = <Claude API Key>

# Payments (Phase 5)
RAZORPAY_KEY_ID       = <Razorpay Key ID>
RAZORPAY_KEY_SECRET   = <Razorpay Secret>
RAZORPAY_WEBHOOK_SECRET = <Webhook Secret>
```

### 4c. Deploy

Click **Deploy** in Vercel. The build command in `vercel.json` runs:
```
npx prisma generate && npm run build
```

This generates the Prisma client, then builds Next.js.

### 4d. Run schema migration on first deploy

After the first successful deploy, run migrations from your local machine:

```bash
# Make sure .env.local has DIRECT_URL set
npx prisma migrate deploy
```

Or use Vercel CLI:
```bash
vercel env pull .env.production.local
DATABASE_URL=$(grep DIRECT_URL .env.production.local | cut -d= -f2-) \
  npx prisma migrate deploy
```

---

## 5. Domain Connection — packpro.site

### 5a. Add domain to Vercel

1. Vercel → Project → **Settings** → **Domains**
2. Add `app.packpro.site` (recommended — keeps www for marketing site)
3. Also add `packpro.site` and `www.packpro.site` if redirecting all to this app

### 5b. Configure DNS in Cloudflare

In Cloudflare → DNS → Add these records:

```
Type   Name        Value                           Proxy
────   ────        ─────                           ─────
CNAME  app         cname.vercel-dns.com            ✅ Proxied
CNAME  www         cname.vercel-dns.com            ✅ Proxied
A      @           76.76.21.21                     ✅ Proxied
CNAME  assets      <bucket>.r2.cloudflarestorage.com  ✅ Proxied
```

> **Cloudflare as proxy (orange cloud)** provides:
> - Free SSL/TLS termination
> - DDoS protection
> - CDN caching for static assets

### 5c. SSL configuration

If using Cloudflare proxy:
1. Cloudflare → **SSL/TLS** → Set mode to **Full (strict)**
2. Enable **Always Use HTTPS**
3. Enable **HTTP Strict Transport Security (HSTS)**

Vercel also provides automatic TLS certificates via Let's Encrypt when domains are added.

### 5d. Assets subdomain for R2

1. In Cloudflare R2 bucket → **Settings** → **Custom Domains**
2. Add `assets.packpro.site`
3. Cloudflare automatically creates the CNAME and provides SSL

---

## 6. Deployment Checklist

Run through this checklist before going live:

### Infrastructure
- [ ] Neon database created in APAC region
- [ ] `prisma migrate deploy` run successfully against production DB
- [ ] Seed data loaded (`/api/setup` called after deploy)
- [ ] R2 bucket created with correct permissions
- [ ] R2 public access enabled for `assets.packpro.site`
- [ ] Vercel project created and connected to GitHub repo
- [ ] All required environment variables set in Vercel
- [ ] Custom domain `app.packpro.site` added to Vercel
- [ ] DNS records configured in Cloudflare
- [ ] SSL set to Full (strict) in Cloudflare

### Application
- [ ] `/api/health` returns `{ "ok": true }` with `hasDbUrl: true` and `hasSecret: true`
- [ ] Login works with `admin@packpro.site` / `packpro@2025`
- [ ] Dashboard loads data (KPI cards show numbers)
- [ ] Product image upload works (uploads to R2, not local filesystem)
- [ ] Invoice creation works end-to-end

### Security
- [ ] **Change default passwords immediately after first login**
- [ ] NEXTAUTH_SECRET is a random 32+ character string (not the example value)
- [ ] No `.env.local` or `.env` committed to Git (verify with `git log --all --oneline -- .env*`)
- [ ] Vercel environment variables set to **Production** environment only

---

## 7. Post-Deployment Operations

### Update schema (future migrations)

```bash
# 1. Make changes to prisma/schema.prisma locally
# 2. Create migration file
npx prisma migrate dev --name describe_the_change

# 3. Test locally
# 4. Commit and push — Vercel rebuilds automatically
# 5. Run migration on production
npx prisma migrate deploy
```

> **Never** run `prisma db push` or `prisma migrate reset` on production.
> `db push` bypasses the migration history. `migrate reset` drops all data.

### Reseed after schema reset (dev only)

```bash
npx prisma migrate reset   # drops + recreates schema
npx prisma db seed         # re-seeds with test data
```

### Monitor database

Neon dashboard → **Monitoring** tab shows:
- Query volume
- Connection count
- Database size
- Slow queries

### Monitor application

Vercel dashboard → **Functions** tab shows:
- API route invocations
- Error rates
- P50/P99 latency per route
- Function logs

---

## 8. Environment Variables — Complete Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | ✅ | Neon pooled connection string | `postgresql://...pooler...` |
| `DIRECT_URL` | ✅ | Neon direct connection (migrations) | `postgresql://...direct...` |
| `NEXTAUTH_SECRET` | ✅ | JWT signing secret (min 32 chars) | `base64-random-string` |
| `NEXTAUTH_URL` | ✅ | Full URL of this deployment | `https://app.packpro.site` |
| `NODE_ENV` | ✅ | Runtime environment | `production` |
| `STORAGE_PROVIDER` | ✅ | Storage backend | `r2` |
| `STORAGE_BUCKET` | ✅ | R2/S3 bucket name | `packpro-assets` |
| `STORAGE_ENDPOINT` | ✅ | R2 account endpoint | `https://xxx.r2.cloudflarestorage.com` |
| `STORAGE_ACCESS_KEY` | ✅ | R2 API access key ID | `abc123...` |
| `STORAGE_SECRET_KEY` | ✅ | R2 API secret key | `xyz789...` |
| `STORAGE_REGION` | ✅ | `auto` for R2, `ap-south-1` for AWS | `auto` |
| `NEXT_PUBLIC_STORAGE_BASE_URL` | ✅ | Public CDN base URL | `https://assets.packpro.site` |
| `SMTP_HOST` | ⚪ | Outbound email server | `smtp.resend.com` |
| `SMTP_PORT` | ⚪ | SMTP port | `587` |
| `SMTP_USER` | ⚪ | SMTP username | `resend` |
| `SMTP_PASS` | ⚪ | SMTP password / API key | `re_...` |
| `SMTP_FROM` | ⚪ | Sender address | `PACKPRO <noreply@packpro.site>` |
| `ANTHROPIC_API_KEY` | ⚪ | Claude API key for AI features | `sk-ant-...` |
| `RAZORPAY_KEY_ID` | ⚪ | Razorpay public key | `rzp_live_...` |
| `RAZORPAY_KEY_SECRET` | ⚪ | Razorpay secret key | `...` |
| `RAZORPAY_WEBHOOK_SECRET` | ⚪ | Razorpay webhook signing secret | `...` |
| `META_WA_TOKEN` | ⚪ | WhatsApp Business API token | `...` |
| `META_WA_PHONE_ID` | ⚪ | WhatsApp phone number ID | `...` |
| `META_WA_WEBHOOK_VERIFY_TOKEN` | ⚪ | WhatsApp webhook verification | `...` |
| `GST_API_KEY` | ⚪ | GSTIN lookup API key | `...` |
| `IRP_USERNAME` | ⚪ | e-invoicing IRP username | `...` |
| `IRP_PASSWORD` | ⚪ | e-invoicing IRP password | `...` |
| `SENTRY_DSN` | ⚪ | Server-side error tracking | `https://...@sentry.io/...` |
| `NEXT_PUBLIC_SENTRY_DSN` | ⚪ | Browser-side error tracking | `https://...@sentry.io/...` |

✅ = Required for app to function  
⚪ = Optional (required only when that feature is used)

---

## 9. Default Login Credentials

> **Change these immediately after your first login.**

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@packpro.site | packpro@2025 |
| Sales Executive | rahul@packpro.site | sales@2025 |
| Accounts | priya@packpro.site | accounts@2025 |

Change passwords: **Settings → Users → Edit User → Change Password**

---

## 10. Cost Estimate (Monthly, at SMB scale)

| Service | Free Tier | Paid (if exceeded) |
|---------|-----------|-------------------|
| **Vercel** | Hobby: unlimited deployments | Pro: $20/month |
| **Neon** | 0.5 GB, 1 project | $19/month (Launch) |
| **Cloudflare R2** | 10 GB storage, 1M ops | $0.015/GB after |
| **Cloudflare DNS + CDN** | Always free | — |
| **Total at start** | **$0/month** | — |
| **At 50 users, 500 invoices/month** | **~$0–$39/month** | — |

---

## 11. Troubleshooting

### "Application error" on Vercel

1. Check Vercel → Functions → Logs for the specific error
2. Most common: `DATABASE_URL` not set or incorrect
3. Verify: `https://app.packpro.site/api/health` — should return `{ "ok": true }`

### "Prisma Client not generated"

The build command runs `prisma generate` automatically. If it fails:
```bash
# Check that postinstall script ran
vercel logs <deployment-url> --follow
```

### File uploads failing

1. Check that all 5 `STORAGE_*` environment variables are set in Vercel
2. Verify the R2 bucket name matches `STORAGE_BUCKET`
3. Test the R2 credentials locally: set variables in `.env.local` and run `npm run dev`

### Database connection errors on Vercel

Vercel serverless functions use the **pooled** connection. Ensure `DATABASE_URL` points to the `*-pooler.*` Neon endpoint, not the direct endpoint.

### Login redirects loop

`NEXTAUTH_URL` must exactly match your deployment URL including protocol (`https://`).
