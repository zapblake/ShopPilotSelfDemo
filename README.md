# ZapSight Self-Demo Preview System

The Self-Demo Preview System powers `*.zapsight.us` subdomain previews. Merchants submit their store URL, and the system crawls, renders, and serves a branded preview of ZapSight's AI shopping assistant on their site.

This monorepo is deployed to Vercel and handles all wildcard subdomain traffic for `*.zapsight.us`. The existing `zapsight.us` marketing site lives in a separate repository.

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (for local Postgres & Redis)

## Local Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Copy environment variables
cp .env.example .env

# 3. Start Postgres & Redis
docker compose up -d

# 4. Run database migrations
cd packages/db && pnpm prisma migrate dev --name init

# 5. Seed the database
pnpm db:seed

# 6. Start the dev server
cd ../.. && pnpm dev

# 7. In a separate terminal, start the worker
cd packages/queue && npx ts-node src/run-worker.ts
```

## Folder Structure

```
/
├── apps/web/               # Next.js 15 app (Vercel deployment target)
│   ├── app/                # App Router pages & API routes
│   ├── components/         # React components
│   ├── lib/                # Shared utilities (logger, errors, API helpers)
│   └── middleware.ts       # Host detection (main vs preview subdomain)
├── packages/
│   ├── crawl/              # Crawl providers, page classifier, page selector
│   ├── db/                 # Prisma schema, client, repositories
│   ├── queue/              # BullMQ queue & worker definitions
│   └── storage/            # Storage adapter interface (local / S3)
├── docker-compose.yml      # Local Postgres 15 + Redis 7
├── turbo.json              # Turborepo pipeline config
└── pnpm-workspace.yaml     # pnpm workspace definition
```

## Phase 0 Scope

- Monorepo scaffold with pnpm workspaces + Turborepo
- Full Prisma schema (7 models, 3 enums)
- Mock API routes: health, create preview job, get job status
- Wildcard subdomain middleware (host detection)
- BullMQ queue + worker scaffold
- Storage adapter interface with local filesystem implementation
- Landing page with preview request form

## Phase 1: Crawl Pipeline & Job Orchestration

### What's new

- **Crawl package** (`packages/crawl`): mock crawl provider, rule-based page classifier, representative page selector
- **Real job pipeline**: URL submit → DB create (QUEUED) → BullMQ enqueue → worker picks up → CRAWLING → CLASSIFYING → READY_FOR_RENDER
- **Live API routes**: POST `/api/preview-jobs` (create + enqueue), GET `/api/preview-jobs/[id]` (real DB data), GET `/api/admin/preview-jobs?secret=` (admin list)
- **Frontend status page** (`/preview-jobs/[id]`): auto-polling progress bar, discovered pages table, selected pages summary
- **Admin dashboard** (`/admin/preview-jobs?secret=`): last 20 jobs with status and crawl summary
- **Prisma schema updates**: QUEUED/CLASSIFYING/READY_FOR_RENDER statuses, PageType enum, classification fields on DiscoveredPage

### Running the full local stack

```bash
# Terminal 1: infrastructure
docker compose up -d

# Terminal 2: database setup (first time)
cd packages/db && pnpm prisma migrate dev --name phase1

# Terminal 3: web app
pnpm dev

# Terminal 4: worker
cd packages/queue && npx ts-node src/run-worker.ts
```

### Phase 1 API routes

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/preview-jobs` | Submit a store URL, creates job and enqueues |
| GET | `/api/preview-jobs/[id]` | Get job status with crawl data and pages |
| GET | `/api/admin/preview-jobs?secret=` | Admin: list last 20 jobs |
| GET | `/api/health` | Health check |
