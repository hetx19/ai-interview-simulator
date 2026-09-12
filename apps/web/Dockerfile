# syntax=docker/dockerfile:1

# Base image
FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# Install dependencies
FROM base AS deps
WORKDIR /app

# Copy package manifests for monorepo workspace resolution
COPY package.json package-lock.json turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared-types/package.json ./packages/shared-types/

# Clean install of all dependencies across workspaces
RUN npm ci

# Builder
FROM base AS builder
WORKDIR /app

# Copy application source code and environment templates
COPY packages ./packages
COPY apps/web ./apps/web
COPY .env.example ./.env
COPY .env.example ./apps/web/.env

# Copy installed dependencies (both root and workspace node_modules)
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/package-lock.json ./package-lock.json
COPY --from=deps /app/turbo.json ./turbo.json
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules

# Build environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV SKIP_ENV_VALIDATION=true
ENV NEXT_OUTPUT_STANDALONE=true
ENV DATABASE_URL="postgresql://devmetric:devmetric@localhost:5432/devmetric?schema=public"
ENV TEST_DATABASE_URL="postgresql://devmetric:devmetric@localhost:5432/devmetric_test?schema=public"
ENV NEXTAUTH_SECRET="ci-dummy-nextauth-secret-min-32-chars-long"
ENV GITHUB_TOKEN_ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
ENV JWT_SECRET="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
ENV GITHUB_CLIENT_ID="mock-github-client-id"
ENV GITHUB_CLIENT_SECRET="mock-github-client-secret"
ENV GOOGLE_CLIENT_ID="mock-google-client-id"
ENV GOOGLE_CLIENT_SECRET="mock-google-client-secret"
ENV KV_REST_API_URL="https://mock-redis.upstash.io"
ENV KV_REST_API_TOKEN="mock-kv-token"
ENV QSTASH_TOKEN="mock_qstash_token"
ENV QSTASH_CURRENT_SIGNING_KEY="sig_mock-current-signing-key"
ENV QSTASH_NEXT_SIGNING_KEY="sig_mock-next-signing-key"
ENV NEXT_PUBLIC_APP_URL="http://localhost:3000"
ENV CRON_SECRET="ci-dummy-cron-secret-min-32-chars-long"

# Generate Prisma Client
RUN npm run prisma:generate --workspace=web

# Build web application
RUN npm run build --workspace=web

# Production Runner
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root system user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy static assets and standalone build output
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
