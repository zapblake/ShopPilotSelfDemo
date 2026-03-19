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

# Use the browsers pre-installed in the base image (not a fresh download)
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

CMD ["pnpm", "--filter", "@zapsight/queue", "run", "start"]
