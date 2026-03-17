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

## Phase 1 TODOs

- Real crawl logic (Firecrawl / Puppeteer integration)
- Cloudflare Workers for edge subdomain routing
- Widget injection into rendered pages
- Full authentication & admin dashboard
- S3 storage adapter implementation
- Real-time job status via SSE or WebSocket
- Email notifications on job completion
