FROM mcr.microsoft.com/playwright:v1.51.0-noble

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9

# Copy workspace manifests
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/db/package.json ./packages/db/
COPY packages/queue/package.json ./packages/queue/
COPY packages/renderer/package.json ./packages/renderer/
COPY packages/crawl/package.json ./packages/crawl/
COPY packages/preview/package.json ./packages/preview/
COPY packages/storage/package.json ./packages/storage/

# Install deps
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/ ./packages/

# Generate Prisma client
RUN pnpm --filter @zapsight/db exec prisma generate

# Playwright browsers are already installed in the base image
# but we need to ensure the right version is used
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=0

CMD ["pnpm", "--filter", "@zapsight/queue", "run", "start"]
