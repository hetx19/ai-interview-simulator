# DevMetric — Engineering Intelligence OS

> Precision algorithmic analytics for elite tech careers. Index your GitHub telemetry, benchmark system architecture, and sharpen your hiring readiness with AI-powered mock interviews.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)](https://www.prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-336791?logo=postgresql)](https://www.postgresql.org)

---

## Architecture

DevMetric is a Turborepo monorepo with a single Next.js application.

```
dev_metric/
├── apps/
│   └── web/                        # Next.js 15 application
│       ├── app/
│       │   ├── (auth)/             # Login, Signup, Onboarding routes (no layout chrome)
│       │   │   ├── login/
│       │   │   ├── signup/
│       │   │   └── onboarding/
│       │   ├── dashboard/          # Protected dashboard shell + sub-routes
│       │   │   ├── layout.tsx      # Auth gate → onboarding gate → Sidebar + Topbar
│       │   │   ├── page.tsx        # Overview
│       │   │   ├── github/         # GitHub Analytics
│       │   │   ├── leetcode/       # LeetCode Metrics
│       │   │   ├── resume/         # Resume Scanner
│       │   │   ├── interviews/     # AI Mock Interview Simulator
│       │   │   ├── hiring/         # Hiring Readiness Score
│       │   │   └── settings/       # User Settings
│       │   ├── api/                # Next.js Route Handlers
│       │   │   ├── auth/[...nextauth]/ # NextAuth endpoints
│       │   │   └── graphql/        # Apollo Server (GraphQL)
│       │   └── page.tsx            # Public marketing landing page (/)
│       ├── server/
│       │   ├── auth/               # NextAuth options, adapter, linking, deletion
│       │   └── repositories/       # Prisma data access layer (UserRepository, etc.)
│       ├── components/
│       │   ├── ui/                 # Sidebar, Topbar, DevMetricLogo, shared primitives
│       │   └── onboarding/         # OnboardingWizard multi-step flow
│       ├── lib/
│       │   └── prisma.ts           # PrismaClient singleton + health check
│       ├── prisma/
│       │   ├── schema.prisma       # Database schema
│       │   ├── seed.ts             # ProblemBank seed data
│       │   └── migrations/         # SQL migration history
│       ├── tests/                  # Vitest unit & integration tests
│       ├── middleware.ts            # Edge auth guard (session cookie check)
│       └── next.config.ts          # Security headers, external packages
└── packages/                       # Shared packages (future)
```

### Request Flow

```
Browser → Next.js Middleware (edge auth guard)
       → Dashboard Layout Server Component (DB session verify + onboarding gate)
       → Page / Route Handler
       → Server Repository (Prisma → PostgreSQL via pg Pool)
```

### Authentication

DevMetric uses **NextAuth v4** with a **database session strategy** and two OAuth providers:

| Provider | Scope | Purpose |
|----------|-------|---------|
| GitHub | `read:user user:email public_repo` | Verified developer identity + commit telemetry |
| Google | `openid email profile` | Verified email SSO |

Session tokens are stored in the `sessions` table (AES-256-GCM encrypted at rest via `EncryptedPrismaAdapter`). Sessions expire after **30 days** with a rolling **24-hour refresh**.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Database | PostgreSQL 17 |
| ORM | Prisma 7 (driver adapter: `@prisma/adapter-pg`) |
| Auth | NextAuth v4 |
| API | Apollo Server 4 + GraphQL |
| Testing | Vitest 4 |
| Monorepo | Turborepo 2 |
| Runtime | Node.js 20 LTS |

---

## Prerequisites

- **Node.js** ≥ 20
- **npm** ≥ 10 (workspaces)
- **PostgreSQL** 17 (or Docker — see below)
- GitHub OAuth App + Google OAuth credentials

---

## Environment Variables

Create `apps/web/.env` (or copy from `.env.example`):

```dotenv
# ─── Database ────────────────────────────────────────────────
DATABASE_URL="postgresql://devmetric:devmetric@localhost:5432/devmetric?schema=public"
TEST_DATABASE_URL="postgresql://devmetric:devmetric@localhost:5432/devmetric_test?schema=public"

# ─── NextAuth ────────────────────────────────────────────────
NEXTAUTH_SECRET="<generate with: openssl rand -base64 32>"
NEXTAUTH_URL="http://localhost:3000"

# ─── GitHub OAuth ────────────────────────────────────────────
# Create at: https://github.com/settings/developers
# Callback URL: http://localhost:3000/api/auth/callback/github
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# ─── Google OAuth ────────────────────────────────────────────
# Create at: https://console.cloud.google.com/apis/credentials
# Callback URL: http://localhost:3000/api/auth/callback/google
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# ─── Encryption (AES-256-GCM token vault) ────────────────────
# Generate: openssl rand -hex 32
ENCRYPTION_KEY=""
```

---

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Start PostgreSQL with Docker

```bash
docker run -d \
  --name devmetric-pg \
  -e POSTGRES_USER=devmetric \
  -e POSTGRES_PASSWORD=devmetric \
  -e POSTGRES_DB=devmetric \
  -p 5432:5432 \
  postgres:17-alpine
```

### 3. Run database migrations

```bash
npm run prisma:migrate:dev --workspace=web
```

### 4. Seed the ProblemBank

```bash
npm run prisma:seed --workspace=web
```

This seeds the following problems into the `problem_bank` table:

| Title | Difficulty | Topic |
|-------|-----------|-------|
| Two Sum | Easy | Arrays |
| LRU Cache | Medium | Data Structures |
| Coin Change | Medium | Dynamic Programming |
| Course Schedule | Medium | Graphs |
| Trapping Rain Water | Hard | Arrays |
| Binary Tree Level Order Traversal | Medium | Trees |
| Concurrent Rate Limiter | Hard | System Design |

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Docker Compose (Full Stack)

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:17-alpine
    environment:
      POSTGRES_USER: devmetric
      POSTGRES_PASSWORD: devmetric
      POSTGRES_DB: devmetric
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://devmetric:devmetric@postgres:5432/devmetric
    depends_on:
      - postgres

volumes:
  pgdata:
```

```bash
docker compose up --build
```

---

## Available Scripts

All scripts can be run from the repository root via Turborepo or scoped to the `web` workspace:

| Command | Description |
|---------|-------------|
| `npm run dev` | Start all apps in watch mode |
| `npm run build` | Production build (all workspaces) |
| `npm run lint` | ESLint across all workspaces |
| `npm run test` | Run all Vitest tests |
| `npm run test --workspace=web` | Run tests for the web app only |
| `npm run test:watch --workspace=web` | Vitest watch mode |
| `npm run prisma:generate --workspace=web` | Regenerate Prisma client |
| `npm run prisma:migrate:dev --workspace=web` | Create + apply migration |
| `npm run prisma:migrate:deploy --workspace=web` | Apply migrations (CI/production) |
| `npm run prisma:studio --workspace=web` | Open Prisma Studio |
| `npm run prisma:seed --workspace=web` | Seed ProblemBank data |

---

## Testing

### Type checking

```bash
npx tsc --noEmit -p apps/web/tsconfig.json
```

### Unit tests (no database required)

```bash
npm run test --workspace=web -- tests/auth/middleware.test.ts tests/auth/encryption.test.ts
```

### Full test suite

```bash
npm run test --workspace=web
```

### Production build verification

```bash
npm run build --workspace=web
```

Verify the build output lists all expected routes:

```
Route (app)                         Size
├ ○ /                               (marketing landing)
├ ƒ /login                          (OAuth login)
├ ƒ /signup                         (OAuth signup)
├ ƒ /onboarding                     (onboarding wizard)
├ ƒ /dashboard                      (overview)
├ ƒ /dashboard/github               (GitHub analytics)
├ ƒ /dashboard/leetcode             (LeetCode metrics)
├ ƒ /dashboard/resume               (resume scanner)
├ ƒ /dashboard/interviews           (AI mock interviews)
├ ƒ /dashboard/hiring               (hiring readiness)
└ ƒ /dashboard/settings             (user settings)
```

---

## Security Headers

Configured in [`apps/web/next.config.ts`](apps/web/next.config.ts) and applied to all routes:

| Header | Value |
|--------|-------|
| `Content-Security-Policy` | Strict in production; `unsafe-eval` allowed in dev |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Permissions-Policy` | `camera=(), microphone=(self), geolocation=()` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |

> **`microphone=(self)`** is intentionally enabled to support the Web Audio / `getUserMedia` API used by the AI Mock Interview Simulator.

---

## Development Roadmap

### Stage 1 — Core Platform ✅
- [x] Turborepo monorepo scaffold
- [x] Next.js 15 App Router with TypeScript
- [x] PostgreSQL + Prisma schema
- [x] NextAuth with GitHub & Google OAuth
- [x] AES-256-GCM token encryption adapter
- [x] Dashboard shell (Sidebar, Topbar, auth gate)
- [x] Onboarding wizard

### Stage 2 — Telemetry Integrations 🚧
- [ ] GitHub API ingestion (commits, languages, repo stats)
- [ ] LeetCode GraphQL scraper + submission sync
- [ ] Resume PDF parser (extract + score)

### Stage 3 — AI Mock Interviews 🔜
- [ ] WebRTC voice capture pipeline
- [ ] Whisper STT transcription
- [ ] GPT-4o interviewer agent with rubric scoring
- [ ] Hiring Readiness Score computation engine

### Stage 4 — Public Profiles & Growth 🔜
- [ ] `/u/:username` public developer profiles
- [ ] Shareable hiring readiness cards (OG image via `@vercel/og`)
- [ ] Weekly digest email (SendGrid)
- [ ] Referral & invite system

---

## License

Private — all rights reserved. © DevMetric 2026.
