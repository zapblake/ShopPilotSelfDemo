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
│   ├── preview/            # HTML rewriter, preview resolver, page service
│   ├── queue/              # BullMQ queue & worker definitions
│   ├── renderer/           # Render providers (mock / Playwright), page capture
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

## Phase 2: Render & Capture Pipeline

### What's new

- **Renderer package** (`packages/renderer`): swappable render providers (mock for dev, Playwright for real captures)
- **Render worker** (`packages/queue/src/workers/render-worker.ts`): picks up render jobs, captures HTML + screenshots, stores artifacts, persists RenderedPage records
- **Automatic pipeline handoff**: preview worker now creates RenderedPage stubs and enqueues render jobs after crawl/classify completes
- **Storage integration**: rendered HTML and screenshots stored via the storage adapter (`jobs/{jobId}/pages/{pageId}/`)
- **Updated status page**: rendered pages section with status, extracted metadata, screenshot indicator, timing info
- **Updated admin dashboard**: rendered page counts and status summary per job
- **New job statuses**: RENDERING, RENDER_COMPLETE added to pipeline flow
- **Prisma schema updates**: RenderedPage gains `errorMessage`, `renderStartedAt`, `renderFinishedAt`, `renderDurationMs` fields

### New environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `RENDERER_PROVIDER` | `mock` | Render provider: `mock` or `playwright` |
| `PLAYWRIGHT_HEADLESS` | `true` | Run Playwright in headless mode |

### Installing Playwright browsers

```bash
cd packages/renderer && npx playwright install chromium
```

### Running the full local stack (Phase 2)

```bash
# Terminal 1: infrastructure
docker compose up -d

# Terminal 2: database setup (first time)
cd packages/db && pnpm prisma migrate dev --name phase2

# Terminal 3: web app
pnpm dev

# Terminal 4: preview worker (crawl + classify)
cd packages/queue && npx ts-node src/run-worker.ts

# Terminal 5: render worker (capture + store)
cd packages/queue && npx ts-node src/run-render-worker.ts
```

Full flow: submit URL → QUEUED → CRAWLING → CLASSIFYING → READY_FOR_RENDER → RENDERING → RENDER_COMPLETE

## Phase 3: Preview Serving & HTML Rewriting

### What's new

- **Preview package** (`packages/preview`): HTML rewriter, preview resolver, page service
- **HTML rewriting**: internal links rewritten to stay inside preview, external links open in new tab, checkout/payment scripts neutralized, forms disabled, preview banner injected
- **Preview serving**: dev mode at `/p/[jobId]`, subdomain mode via `preview-{jobId}.zapsight.us`
- **Middleware update**: preview subdomain requests rewritten to `/p/[jobId]/[path]` internally
- **Preview API**: `GET /api/preview/[jobId]` returns preview URL and page list
- **Updated status page**: preview link and per-page open links when PREVIEW_READY
- **Updated admin dashboard**: preview column with quick open link
- **New job status**: `PREVIEW_READY` — render worker now sets preview paths, creates PreviewHost, and transitions to PREVIEW_READY
- **Prisma schema updates**: `PREVIEW_READY` enum value, `PreviewHost.jobStatus` and `PreviewHost.previewBaseUrl` fields

### Accessing previews in dev mode

After a job reaches `PREVIEW_READY` status, visit:

```
http://localhost:3000/p/{jobId}
```

Inner pages are available at their original paths:

```
http://localhost:3000/p/{jobId}/products/king-mattress
```

### How wildcard DNS works in production

In production, `*.zapsight.us` DNS points to our Vercel deployment. The middleware detects `preview-{jobId}.zapsight.us` and internally rewrites to `/p/{jobId}/...`. This means:

- `preview-abc123.zapsight.us` → serves the homepage for job `abc123`
- `preview-abc123.zapsight.us/products/foo` → serves the `/products/foo` page

### New environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PREVIEW_MODE` | `dev` | Preview mode: `dev` (path-based) or `subdomain` |
| `PREVIEW_BASE_URL` | `http://localhost:3000` | Base URL for preview links |

### Full flow

1. Submit URL → job created (QUEUED)
2. Crawl + classify → READY_FOR_RENDER
3. Render pages → RENDERING → PREVIEW_READY
4. Click preview link on status page → see the store with ZapSight banner

### Phase 4 TODOs

- Widget injection and configuration
- Cloudflare integration for edge serving
- Preview expiration and cleanup
