# Stage 3 — Core Server Infrastructure: Implementation Plan

**Repository:** `hetx19/ai-interview-simulator`  
**Prepared:** 2026-09-08  
**Stage:** 3 of 12  
**Depends on:** Stage 1 (database/schema ✅), Stage 2 (auth/sessions ✅)

---

## Table of Contents

1. [Repository & Architecture Assessment](#1-repository--architecture-assessment)
2. [Architecture Decisions](#2-architecture-decisions)
3. [Target Architecture](#3-target-architecture)
4. [File-by-File Implementation Plan](#4-file-by-file-implementation-plan)
5. [Cache Design](#5-cache-design)
6. [QStash Design](#6-qstash-design)
7. [Logging & Correlation Design](#7-logging--correlation-design)
8. [BaseRepository Design](#8-baserepository-design)
9. [GraphQL Architecture](#9-graphql-architecture)
10. [Error Handling Contract](#10-error-handling-contract)
11. [Testing Strategy](#11-testing-strategy)
12. [Implementation Sequence](#12-implementation-sequence)
13. [Acceptance Criteria](#13-acceptance-criteria)
14. [Risks, Edge Cases & Failure Modes](#14-risks-edge-cases--failure-modes)
15. [Final Stage 3 Definition of Done](#15-final-stage-3-definition-of-done)

---

## 1. Repository & Architecture Assessment

### Current Architecture

The project is a **Next.js 15 App Router monorepo** (Turborepo) with a single `apps/web` workspace and a `packages/shared-types` workspace (currently minimal). It targets Vercel for deployment with Upstash Redis/KV as the cache layer and QStash for job queuing (per the implementation roadmap decisions).

### What Stage 1 Delivered (Verified)

- **`apps/web/prisma/schema.prisma`** — Complete Prisma schema (486 lines) covering all tables from the architecture doc: `User`, `Account`, `Session`, `GithubProfile`, `LeetcodeProfile`, `Resume`, `ProblemBank`, `InterviewSession`, `InterviewProblem`, `InterviewSubmission`, `InterviewScore`, `VoiceTranscript`, `HiringReadinessScore`, `UserSettings`, `AuditLog`. All `@@index`, `@@unique`, and cascade relations are in place.
- **`apps/web/lib/prisma.ts`** — Singleton `PrismaClient` via `PrismaPg` adapter (pg connection pool). Exports `db` and `checkDatabaseHealth()`. Pool is capped at 5 (prod) / 10 (dev) connections, with ssl and connection timeout configured.
- **`apps/web/prisma/migrations/`** — Migration history exists.
- **`apps/web/__tests__/prisma/constraints.test.ts`** — Schema constraint tests (25 KB).

### What Stage 2 Delivered (Verified)

- **`apps/web/server/auth/options.ts`** — `authOptions` with GitHub + Google providers, **database session strategy** (30-day sessions, 24h rotation threshold), `EncryptedPrismaAdapter`, and `handleAccountLinking`/`validateAndRotateSession` wired into callbacks.
- **`apps/web/server/auth/session.ts`** — `validateAndRotateSession()`: validates session token from DB, soft-delete check, expiry check, rotates token if `createdAt > 24h`. Exports `SessionValidationResult`.
- **`apps/web/server/auth/adapter.ts`** — `EncryptedPrismaAdapter()`: custom NextAuth adapter with AES-256-GCM token encryption.
- **`apps/web/server/auth/encryption.ts`** — `encryptToken`, `decryptToken`, `getDecryptedAccessToken`, `getDecryptedRefreshToken`. Uses `GITHUB_TOKEN_ENCRYPTION_KEY` (64-char hex).
- **`apps/web/server/auth/linking.ts`** — `handleAccountLinking()`: safe account-linking by verified email.
- **`apps/web/server/auth/deletion.ts`** — `deleteAccount()`: soft-delete + session invalidation.
- **`apps/web/server/auth/index.ts`** — Re-exports + `auth()` helper (wraps `getServerSession(authOptions)`).
- **`apps/web/auth.ts`** — Root re-export.
- **`apps/web/middleware.ts`** — Cookie-based session guard: public routes bypass, API routes → 401, app routes → redirect.
- **`apps/web/server/repositories/UserRepository.ts`** — Existing `UserRepository` class (no BaseRepository yet). Has a `TODO` comment at line 28: `// TODO: replace with NotFoundError once stage 3 error types are in`.
- **`apps/web/types/next-auth.d.ts`** — Session augmented with `user.id: string` and `sessionToken?: string`.
- **`apps/web/tests/auth/`** — 7 test files for auth (account deletion, linking, encryption, middleware, OAuth, session rotation, token storage).

### Existing Infrastructure (Relevant to Stage 3)

- **`apps/web/lib/env.ts`** — `@t3-oss/env-nextjs` environment validator. Already has `KV_REST_API_URL` and `KV_REST_API_TOKEN` for Upstash. **No** `QSTASH_TOKEN`, `QSTASH_SIGNING_KEY`, or Pino entries yet.
- **`apps/web/lib/cache/cacheKeys.ts`** — Cache key factory functions (defined, no tag helpers yet). Uses `user:{userId}:{resource}` pattern. Has `userScanPattern(userId)` for SCAN-based invalidation.
- **`apps/web/types/api.ts`** — `ApiSuccess<T>`, `ApiError`, `API_ERROR_CODES` constants. Stage 3 error envelope must **extend this vocabulary**, not replace it.
- **`apps/web/next.config.ts`** — `serverExternalPackages: ["pg", "@prisma/client", "prisma"]`. Stage 3 additions needed.

### Dependencies Already Installed

| Package                 | Version    | Status                                |
| ----------------------- | ---------- | ------------------------------------- |
| `graphql`               | `^16.14.2` | ✅ Installed                          |
| `@apollo/server`        | `^4.11.3`  | ✅ Installed — **unused** scaffolding |
| `@as-integrations/next` | `^3.0.0`   | ✅ Installed — **unused** scaffolding |
| `@vercel/kv`            | `^3.0.0`   | ✅ Installed — not yet used in code   |
| `zod`                   | `^4.4.3`   | ✅ Installed                          |
| `vitest`                | `^4.1.10`  | ✅ Installed (dev dep)                |
| `next-auth`             | `^4.24.15` | ✅ Used (Stage 2)                     |

### Gaps Stage 3 Must Fill

| Gap                                                     | Required For                            |
| ------------------------------------------------------- | --------------------------------------- |
| Redis client singleton + `getCached/invalidateCache`    | All feature stages                      |
| Tag-based cache invalidation + SCAN fallback            | Stages 4–11                             |
| Cache stampede protection (single-flight)               | Stage 10 (public profile), Stage 3 (me) |
| QStash enqueue helper                                   | Stages 4–6 background jobs              |
| QStash signed webhook receiver (`/api/webhooks/qstash`) | Stage 4+                                |
| Pino logger singleton + request correlation             | All stages                              |
| Correlation ID middleware (AsyncLocalStorage)           | All stages                              |
| `BaseRepository<T>` abstract class                      | Stages 4–11 repositories                |
| `UserRepository` refactor to extend BaseRepository      | Stage 3 me query                        |
| GraphQL Yoga server + route handler                     | All GraphQL feature stages              |
| `context.ts` (session → user)                           | All GraphQL resolvers                   |
| `requireAuth(ctx)` guard                                | All authenticated resolvers             |
| Shared GraphQL error envelope                           | All GraphQL stages                      |
| `me` resolver + `UserService`                           | Stage 3 smoke test                      |
| `QSTASH_*` vars in `env.ts`                             | Stage 3 queue                           |
| `pino` and `graphql-yoga` and `@upstash/qstash`         | Stage 3                                 |

### Architecture Conflict: Apollo vs Yoga

> **Conflict identified:** `package.json` has `@apollo/server` and `@as-integrations/next` installed (unused scaffolding), but `docs/implementation-roadmap.md` § Stage 3 explicitly recommends **GraphQL Yoga** for Vercel Edge/serverless compatibility due to Apollo's heavier cold-start weight. Neither is used yet (no `app/api/graphql/route.ts` exists).

Resolution: see Architecture Decision #GQL-1.

### Architecture Conflict: `@vercel/kv` vs `@upstash/redis`

> **Conflict identified:** `package.json` has `@vercel/kv@^3.0.0` installed. `docs/architecture.md` uses `@upstash/redis` in code examples. `lib/env.ts` defines `KV_REST_API_URL` / `KV_REST_API_TOKEN` (the `@vercel/kv` env var names). `@upstash/redis` is **not** in `package.json`.

Resolution: see Architecture Decision #Cache-1.

---

## 2. Architecture Decisions

### Decision #GQL-1: GraphQL Server — Yoga vs Apollo

|                         |                                                                                                                                                                                                                                           |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Recommended**         | **GraphQL Yoga** (`graphql-yoga`)                                                                                                                                                                                                         |
| **Reasoning**           | The implementation roadmap (§ Stage 3) explicitly recommends Yoga "for Vercel Edge/serverless compatibility over Apollo Server, which has heavier cold-start weight." No `app/api/graphql/route.ts` exists yet — nothing needs migrating. |
| **Alternative**         | Apollo Server + `@as-integrations/next`. Both installed already but unused.                                                                                                                                                               |
| **Why not alternative** | Cold-start penalty on Vercel serverless is real; Yoga has native App Router support; no features were built against Apollo.                                                                                                               |
| **Action**              | Add `graphql-yoga` to `package.json`. Apollo packages can be left (unused) or removed — removal is cleaner. Do NOT remove `graphql` (shared peer dep).                                                                                    |

### Decision #Cache-1: Redis Client — `@vercel/kv` vs `@upstash/redis`

|                         |                                                                                                                                                                                                            |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Recommended**         | **`@vercel/kv`** (already installed; wraps `@upstash/redis` internally)                                                                                                                                    |
| **Reasoning**           | `@vercel/kv` is already installed and `lib/env.ts` already defines `KV_REST_API_URL` / `KV_REST_API_TOKEN`, exactly what `@vercel/kv` reads. Using it means no new package install and no env var changes. |
| **Alternative**         | Add `@upstash/redis` and rename env vars.                                                                                                                                                                  |
| **Why not alternative** | Would break the existing `env.ts` config without justification; the two SDKs have nearly identical APIs and `@vercel/kv` wraps Upstash anyway.                                                             |
| **Action**              | Use `@vercel/kv` in `server/cache/redisClient.ts`. Import: `import { kv } from '@vercel/kv'`.                                                                                                              |

### Decision #Lock-1: Cache Stampede Protection

|                   |                                                                                                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Recommended**   | **Two-level strategy:** (a) In-process `Map<string, Promise<T>>` for same-instance concurrency, (b) Redis `SET NX PX` distributed lock for cross-instance serialization. |
| **Reasoning**     | Satisfies the "10 simultaneous requests → fetcher executes once" requirement. In-process Map handles the common case. Redis lock handles the cross-instance case.        |
| **Alternative A** | In-process only — works for single instance, fails under multi-instance deployment.                                                                                      |
| **Alternative B** | Redis lock only — higher latency for the common case.                                                                                                                    |
| **Lock TTL**      | 5 seconds default. Feature stages with slow fetchers must pass a custom `lockTtlMs`.                                                                                     |

### Decision #Inv-1: Cache Invalidation Strategy

|                    |                                                                                                                                                                                                                      |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Recommended**    | **Tag-based set invalidation as primary; SCAN as explicit secondary**                                                                                                                                                |
| **Reasoning**      | The implementation roadmap (§ Stage 3) explicitly requires "explicit key-tag sets as the primary invalidation mechanism, with SCAN as a documented fallback only." `KEYS` is explicitly prohibited.                  |
| **Implementation** | `getCached(key, fetcher, ttl, tags)` writes `SADD tag:{tagName} key` for each tag. `invalidateByTag(tag)` does `SMEMBERS tag → DEL keys → DEL tag`. `SCAN` is only used in `invalidatePattern` as declared fallback. |

### Decision #Repo-1: BaseRepository Scoping Enforcement

|                 |                                                                                                                                                                                                            |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Recommended** | **Constructor injection + private `readonly userId` field**                                                                                                                                                |
| **Reasoning**   | If `userId` is required in the constructor, a repository instance cannot be created without it. All method calls automatically operate within that user's scope. TypeScript enforces this at compile time. |
| **Alternative** | Pass `userId` to every method — more flexible but a convention, not a structural guarantee.                                                                                                                |
| **Tradeoff**    | Admin or cross-user operations cannot use `BaseRepository`. They use `db` directly with an explicit comment — this makes cross-user access a named exception, not a silent default.                        |

### Decision #Log-1: Structured Logging Library

|                 |                                                                                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Recommended** | **Pino**                                                                                                                                               |
| **Reasoning**   | Explicitly required by the Stage 3 specification. Fastest Node.js JSON logger; well-established Next.js integration; industry standard for this stack. |
| **Action**      | Add `pino` (runtime) and `pino-pretty` (dev only) to `package.json`.                                                                                   |

### Decision #Ctx-1: GraphQL Context — Session Resolution

|                            |                                                                                                                                                       |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Recommended**            | **Call `getServerSession(authOptions)` directly in `context.ts`**                                                                                     |
| **Reasoning**              | The Stage 2 `auth()` helper wraps `getServerSession(authOptions)`. This is the single, established authentication mechanism — must not be duplicated. |
| **Context shape**          | `{ user: AuthenticatedUser                                                                                                                            | null, correlationId: string, logger: Logger }` |
| **`requireAuth` behavior** | If `ctx.user` is null, throws `AppError(UNAUTHENTICATED)`.                                                                                            |

---

## 3. Target Architecture

```
HTTP Request (any route)
  │
  ├── [Next.js Middleware] middleware.ts
  │       └── Cookie-based session check (Stage 2, unchanged)
  │
  ├── [Correlation Context] AsyncLocalStorage
  │       ├── Extract X-Correlation-ID header OR generate randomUUID()
  │       └── Runs entire request handler inside runWithCorrelation()
  │
  ├── [GraphQL Route] app/api/graphql/route.ts
  │       └── GraphQL Yoga (runtime: 'nodejs')
  │               │
  │               ├── [Context Factory] server/graphql/context.ts
  │               │       ├── getServerSession(authOptions) → user | null
  │               │       ├── setUserId() → into AsyncLocalStorage
  │               │       └── child logger with { correlationId, userId }
  │               │
  │               ├── [formatError plugin] server/graphql/errors.ts
  │               │       └── AppError → structured; unknown → INTERNAL_ERROR (sanitized)
  │               │
  │               └── [Resolvers] server/graphql/resolvers/
  │                       └── requireAuth(ctx) → asserts ctx.user non-null
  │                               └── [Services] server/services/
  │                                       └── [Repositories] server/repositories/
  │                                               └── BaseRepository<T>(userId)
  │                                                       └── Prisma (lib/prisma.ts → db)
  │                                                               └── PostgreSQL
  │
  ├── [QStash Webhook Route] app/api/webhooks/qstash/route.ts
  │       ├── rawBody = await request.text()  ← MUST be first
  │       ├── verifyQStashSignature(rawBody, headers) → fail → 403
  │       └── dispatchJob(type, payload) → job handlers
  │
  ├── [Cache Layer] server/cache/redisClient.ts
  │       ├── getCached<T>(key, fetcher, { ttl, tags?, lockTtlMs? })
  │       │       ├── Level 1: in-process Map deduplication
  │       │       └── Level 2: Redis SET NX PX distributed lock
  │       ├── invalidateCache(key)          ← single key DEL
  │       ├── invalidateByTag(tag)          ← SMEMBERS + DEL (primary)
  │       └── invalidatePattern(pattern)    ← SCAN cursor loop (secondary fallback)
  │
  ├── [Queue Layer] server/queue/
  │       ├── enqueueJob<T>(type, payload, opts?)
  │       └── verifyQStashSignature(rawBody, headers)
  │
  └── [Logging] server/logging/
          ├── logger.ts          ← Pino singleton, service: "devgrowth-api"
          └── correlationStore.ts ← AsyncLocalStorage, getCorrelationId(), getUserIdFromStore()
```

---

## 4. File-by-File Implementation Plan

| File                                                 | Action     | Responsibility                          | Key Changes                                                                                                                                                                  | Dependencies                                                                 |
| ---------------------------------------------------- | ---------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `apps/web/package.json`                              | **Modify** | Add runtime deps                        | Add: `graphql-yoga`, `pino`, `@upstash/qstash`. Dev: `pino-pretty`                                                                                                           | None                                                                         |
| `apps/web/next.config.ts`                            | **Modify** | Register server packages                | Add `"pino"` and `"@upstash/qstash"` to `serverExternalPackages`                                                                                                             | None                                                                         |
| `apps/web/lib/env.ts`                                | **Modify** | Add QStash env vars                     | Add `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY` + runtimeEnv entries                                                                             | None                                                                         |
| `apps/web/lib/cache/cacheKeys.ts`                    | **Modify** | Add tag + TTL helpers                   | Add `cacheTags` object; add `cacheTTL` constants                                                                                                                             | Stage 1                                                                      |
| `apps/web/server/cache/redisClient.ts`               | **Create** | Redis singleton + cache API             | Export `redis` (kv from @vercel/kv); `getCached<T>`, `invalidateCache`, `invalidateByTag`, `invalidatePattern`                                                               | `lib/env.ts`, `@vercel/kv`                                                   |
| `apps/web/server/logging/logger.ts`                  | **Create** | Pino singleton                          | Base config: `service: "devgrowth-api"`, level by env, pino-pretty in dev                                                                                                    | `pino`                                                                       |
| `apps/web/server/logging/correlationStore.ts`        | **Create** | AsyncLocalStorage context               | `runWithCorrelation`, `getCorrelationId`, `getUserIdFromStore`, `setUserId`                                                                                                  | Node.js built-in `async_hooks`                                               |
| `apps/web/server/logging/requestLogger.ts`           | **Create** | Per-request child logger                | `createRequestLogger(correlationId, userId?)` → child logger; `logRequest(method, path, status, durationMs)`                                                                 | `logger.ts`, `correlationStore.ts`                                           |
| `apps/web/server/repositories/BaseRepository.ts`     | **Create** | Generic scoped data access              | Abstract class; `userId` in constructor, `readonly`; `findFirst`, `findMany`, `update`, `delete`, `softDelete`, `deleteMany` — all inject userId into where clause           | `lib/prisma.ts`                                                              |
| `apps/web/server/repositories/UserRepository.ts`     | **Modify** | Extend BaseRepository                   | Refactor to `class UserRepository extends BaseRepository<...>`. Add `findMe()`. Replace `throw new Error` stub with `AppError(NOT_FOUND)`. Keep all existing public methods. | `BaseRepository.ts`, `errors.ts`                                             |
| `apps/web/server/services/UserService.ts`            | **Create** | User business logic                     | `getAuthenticatedUser()` → calls UserRepository.findMe(), returns domain-safe shape for GraphQL                                                                              | `UserRepository.ts`                                                          |
| `apps/web/server/graphql/schema.ts`                  | **Create** | GraphQL SDL (Stage 3 subset)            | SDL string: `User`, `AppError`, `Query { me: User }`. No Subscription. Future types scaffolded as comments.                                                                  | `graphql`                                                                    |
| `apps/web/server/graphql/context.ts`                 | **Create** | Context factory                         | `createContext(request)` → `{ user, correlationId, logger }`. Calls `getServerSession(authOptions)`.                                                                         | `server/auth/index.ts`, `correlationStore.ts`, `logger.ts`                   |
| `apps/web/server/graphql/errors.ts`                  | **Create** | Shared error types                      | `AppError`, `AppErrorCode` enum, `requireAuth(ctx)` (type assertion function), `formatError` handler                                                                         | `graphql-yoga`                                                               |
| `apps/web/server/graphql/resolvers/userResolvers.ts` | **Create** | User-domain resolvers                   | `Query.me`: `requireAuth(ctx)` → `UserService.getAuthenticatedUser()`                                                                                                        | `UserService.ts`, `errors.ts`                                                |
| `apps/web/server/graphql/resolvers/index.ts`         | **Create** | Resolver registry                       | Merge all resolver maps. Initially: `{ Query: { me } }`                                                                                                                      | `userResolvers.ts`                                                           |
| `apps/web/server/graphql/yoga.ts`                    | **Create** | Yoga server instance                    | `createYoga({ schema, context: createContext, plugins: [...], formatError })`                                                                                                | `graphql-yoga`, `schema.ts`, `context.ts`, `resolvers/index.ts`, `errors.ts` |
| `apps/web/app/api/graphql/route.ts`                  | **Create** | Next.js App Router GraphQL endpoint     | `{ GET, POST } = { handleRequest: yoga.fetch }`. `export const runtime = 'nodejs'`                                                                                           | `yoga.ts`                                                                    |
| `apps/web/server/queue/jobTypes.ts`                  | **Create** | Job type registry                       | `JobType` enum; `JobPayload` discriminated union; types: `GITHUB_SYNC`, `LEETCODE_SYNC`, `RESUME_ANALYSIS`                                                                   | None                                                                         |
| `apps/web/server/queue/qstashClient.ts`              | **Create** | QStash client singleton                 | `Client` from `@upstash/qstash` using `QSTASH_TOKEN`                                                                                                                         | `lib/env.ts`, `@upstash/qstash`                                              |
| `apps/web/server/queue/enqueueJob.ts`                | **Create** | Typed job enqueue                       | `enqueueJob<T>(type, payload, opts?)` → publishes to `{APP_URL}/api/webhooks/qstash` with 3 retries                                                                          | `qstashClient.ts`, `jobTypes.ts`                                             |
| `apps/web/server/queue/verifyQStash.ts`              | **Create** | QStash signature verifier               | `verifyQStashSignature(rawBody, headers)` using `Receiver` from `@upstash/qstash`. Throws on failure (fail closed).                                                          | `@upstash/qstash`, `lib/env.ts`                                              |
| `apps/web/server/queue/jobRouter.ts`                 | **Create** | Job dispatcher                          | `dispatchJob(type, payload)` — switch on type, calls handler. Stage 3: stub handlers only.                                                                                   | `jobTypes.ts`                                                                |
| `apps/web/app/api/webhooks/qstash/route.ts`          | **Create** | QStash webhook receiver                 | `rawBody = await request.text()` FIRST; verify signature; parse; validate; dispatch. Returns 403/400/500/200.                                                                | `verifyQStash.ts`, `jobRouter.ts`                                            |
| `apps/web/middleware.ts`                             | **Modify** | Add webhook to public routes            | Add `/api/webhooks/` to `isPublicRoute` prefix list — otherwise QStash cannot reach the route.                                                                               | Stage 2                                                                      |
| `apps/web/types/graphql.ts`                          | **Create** | GraphQL TypeScript types                | `AuthenticatedUser`, `GraphQLContext`, `AppErrorCode` shared types                                                                                                           | None                                                                         |
| `apps/web/tests/cache/getCached.test.ts`             | **Create** | Cache unit tests                        | 10 tests incl. stampede (test #9: 10 concurrent → 1 fetch)                                                                                                                   | `vitest`, `redisClient.ts`                                                   |
| `apps/web/tests/queue/enqueueJob.test.ts`            | **Create** | Queue unit + integration tests          | 8 tests incl. forged signature rejection                                                                                                                                     | `vitest`, `enqueueJob.ts`, `verifyQStash.ts`                                 |
| `apps/web/tests/logging/correlation.test.ts`         | **Create** | Logging unit tests                      | 7 tests incl. concurrent isolation                                                                                                                                           | `vitest`, `correlationStore.ts`                                              |
| `apps/web/tests/repositories/BaseRepository.test.ts` | **Create** | BaseRepository unit + integration tests | 8 tests: all scoping, cross-user isolation, structural impossibility of omitting userId                                                                                      | `vitest`, `BaseRepository.ts`                                                |
| `apps/web/tests/graphql/me.test.ts`                  | **Create** | GraphQL integration tests               | 7 tests incl. full e2e (#41)                                                                                                                                                 | `vitest`, `yoga.ts`, test DB                                                 |
| `apps/web/tests/graphql/errors.test.ts`              | **Create** | Error handling tests                    | `requireAuth`, AppError mapping, sensitive detail suppression                                                                                                                | `vitest`, `errors.ts`                                                        |

### Files Intentionally Untouched

| File                            | Reason                                                  |
| ------------------------------- | ------------------------------------------------------- |
| `apps/web/server/auth/*` (all)  | Stage 2 — complete; Stage 3 only calls `auth()` from it |
| `apps/web/lib/prisma.ts`        | Stage 1 — complete; used as-is                          |
| `apps/web/prisma/schema.prisma` | Stage 1 — no schema changes in Stage 3                  |
| `apps/web/types/api.ts`         | Stage 2 — Stage 3 error codes extend this vocabulary    |
| `apps/web/app/(auth)/*`         | Stage 2 — UI untouched                                  |

---

## 5. Cache Design

### Redis Client

```typescript
// server/cache/redisClient.ts
import { kv } from "@vercel/kv";
export const redis = kv;
```

`@vercel/kv` reads `KV_REST_API_URL` and `KV_REST_API_TOKEN` automatically from the environment — already defined in `lib/env.ts` and `.env`.

### `getCached<T>` API

```typescript
interface GetCachedOptions {
  ttl: number; // TTL in seconds — caller always specifies
  tags?: string[]; // Tag names for tag-based invalidation
  lockTtlMs?: number; // Distributed lock TTL in ms (default: 5000)
}

async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: GetCachedOptions,
): Promise<T>;
```

### Key Strategy

Keys follow the existing convention in `lib/cache/cacheKeys.ts`:

```
user:{userId}:{resource}         e.g. user:abc123:github
session:{sessionId}:{resource}   e.g. session:xyz:problem
profile:{username}               e.g. profile:johndoe
bank:{id}                        e.g. bank:prob_001
```

### New Additions to `lib/cache/cacheKeys.ts`

```typescript
// Tag name generators — tag keys live in "tag:" namespace to avoid collisions
export const cacheTags = {
  user: (userId: string) => `tag:user:${userId}`,
  session: (sessionId: string) => `tag:session:${sessionId}`,
  profile: (username: string) => `tag:profile:${username}`,
} as const;

// TTL constants in seconds — referenced by call sites
export const cacheTTL = {
  githubProfile: 24 * 60 * 60,
  leetcodeProfile: 24 * 60 * 60,
  activeResume: 60 * 60,
  hiringScore: 60 * 60,
  publicProfile: 5 * 60,
  interviewSession: 15 * 60,
  problemBank: 7 * 24 * 60 * 60,
} as const;
```

### Tag-Based Invalidation (Primary Path)

When `getCached(key, fetcher, { ttl, tags: ['tag:user:abc'] })` writes:

1. `SET user:abc:github <value> EX ttl`
2. `SADD tag:user:abc user:abc:github`
3. `EXPIRE tag:user:abc <ttl + 60>` (tag set outlives data by a buffer)

When `invalidateByTag('tag:user:abc')`:

1. `SMEMBERS tag:user:abc` → `['user:abc:github', 'user:abc:score']`
2. `DEL user:abc:github user:abc:score` (batch delete)
3. `DEL tag:user:abc` (clean up the set)

`SMEMBERS` is O(N) on the set size (bounded by user's cache entries), not on all Redis keys. Safe on Upstash.

### SCAN-Based Invalidation (Secondary Fallback)

```typescript
async function invalidatePattern(pattern: string): Promise<void> {
  let cursor = 0;
  do {
    const [nextCursor, keys] = await redis.scan(cursor, {
      match: pattern,
      count: 100,
    });
    if (keys.length > 0) await redis.del(...keys);
    cursor = Number(nextCursor);
  } while (cursor !== 0);
}
```

**`KEYS` is never used.** `SCAN` is only exposed in `invalidatePattern`, which is documented as a fallback (used via `cacheKeys.userScanPattern(userId)`).

### Stampede Protection — Two-Level Single-Flight

**Level 1 — In-process deduplication (same serverless instance):**

```typescript
const inFlightRequests = new Map<string, Promise<unknown>>();

// Inside getCached — checked before Redis lookup:
if (inFlightRequests.has(key)) {
  return inFlightRequests.get(key) as Promise<T>;
}
const promise = executeFetch(key, fetcher, options);
inFlightRequests.set(key, promise);
promise.finally(() => inFlightRequests.delete(key));
return promise;
```

**Level 2 — Distributed Redis lock (cross-instance):**

```typescript
const lockKey = `lock:${key}`;
const lockToken = randomUUID();

// SET NX PX: only succeeds if key doesn't exist
const acquired = await redis.set(lockKey, lockToken, {
  nx: true,
  px: lockTtlMs,
});

if (!acquired) {
  // Poll until the primary fetcher writes to cache
  return await pollForCachedValue<T>(key, { maxAttempts: 10, intervalMs: 200 });
}

try {
  const value = await fetcher();
  await writeToCache(key, value, options);
  return value;
} finally {
  // Release lock only if still ours (compare-and-delete to avoid releasing another's lock)
  const current = await redis.get(lockKey);
  if (current === lockToken) await redis.del(lockKey);
}
```

**Why this satisfies "10 simultaneous → 1 fetch":**

- Same instance: Requests 2–10 hit `inFlightRequests.has(key)` immediately and share the existing Promise. The fetcher is called once.
- Different instances: Only one acquires the Redis NX lock. Others poll via `pollForCachedValue`. The lock holder calls `fetcher()` once, writes to cache, releases lock. Pollers read the cached value.

**Lock TTL consideration:** Default 5s. If `fetcher()` takes longer than `lockTtlMs`, a second instance may acquire the lock and also call `fetcher()`. For slow operations (AI pipelines in Stages 6–8), callers must pass `lockTtlMs: 30000` or appropriate value.

### Redis Unavailable Behavior

- **Cache read fails:** Log warning with correlationId; call `fetcher()` directly; attempt cache write (also caught silently if it fails). **Never propagate Redis errors to the caller.**
- **Cache write fails:** Log warning; return the fetched value. Data is not cached but operation succeeds.
- **Lock acquisition fails:** Log warning; proceed as if lock was not acquired (call fetcher directly).
- **Result:** Redis unavailability is a performance degradation, not a service outage.

---

## 6. QStash Design

### New Environment Variables

Add to `lib/env.ts`:

```typescript
QSTASH_TOKEN: z.string().min(1),
QSTASH_CURRENT_SIGNING_KEY: z.string().min(1),
QSTASH_NEXT_SIGNING_KEY: z.string().min(1),
```

`QSTASH_TOKEN` publishes messages. `QSTASH_CURRENT_SIGNING_KEY` + `QSTASH_NEXT_SIGNING_KEY` verify incoming webhook signatures (QStash rotates keys; both must be checked).

### `enqueueJob` API

```typescript
interface EnqueueOptions {
  retries?: number; // Default: 3
  delay?: number; // Seconds before delivery. Default: 0
  deduplicationId?: string; // QStash message deduplication
}

async function enqueueJob<T extends JobType>(
  type: T,
  payload: JobPayload[T],
  options?: EnqueueOptions,
): Promise<{ messageId: string }>;
```

**Payload Contract:** Every message body is JSON:

```typescript
interface QStashMessage<T> {
  type: JobType;
  payload: T;
  correlationId: string; // propagated from original request
  userId: string; // subject of the job
  enqueuedAt: string; // ISO timestamp
}
```

Destination URL: `{NEXT_PUBLIC_APP_URL}/api/webhooks/qstash` for all job types.

### Job Types (Stage 3 Scaffold)

```typescript
export enum JobType {
  GITHUB_SYNC = "github_sync",
  LEETCODE_SYNC = "leetcode_sync",
  RESUME_ANALYSIS = "resume_analysis",
}
```

Stage 4+ handlers are stubs in Stage 3. The `dispatchJob` switch routes to them.

### Webhook Route — Critical Implementation Details

**File:** `apps/web/app/api/webhooks/qstash/route.ts`

**CRITICAL — Raw body must be read first:**

```typescript
export async function POST(request: Request) {
  // MUST read text() BEFORE any JSON parsing
  // Once consumed, the body stream cannot be re-read
  const rawBody = await request.text();

  try {
    await verifyQStashSignature(rawBody, request.headers);
  } catch {
    return Response.json(
      { error: "FORBIDDEN", message: "Invalid signature" },
      { status: 403 },
    );
  }

  const payload = JSON.parse(rawBody); // safe to parse now
  // validate + dispatch...
}
```

**Response codes:**

| Scenario                           | Code                 |
| ---------------------------------- | -------------------- |
| Missing `Upstash-Signature` header | 403                  |
| Invalid/forged signature           | 403                  |
| Valid signature, malformed JSON    | 400                  |
| Unknown job type                   | 400                  |
| Handler throws                     | 500 (QStash retries) |
| Processed successfully             | 200                  |

**middleware.ts change required:** Add `/api/webhooks/` to `isPublicRoute` so QStash can reach this route without a session cookie. Without this, the middleware returns 401 and blocks all webhooks.

### Signature Verification

```typescript
// server/queue/verifyQStash.ts
import { Receiver } from "@upstash/qstash";

const receiver = new Receiver({
  currentSigningKey: env.QSTASH_CURRENT_SIGNING_KEY,
  nextSigningKey: env.QSTASH_NEXT_SIGNING_KEY,
});

export async function verifyQStashSignature(
  rawBody: string,
  headers: Headers,
): Promise<void> {
  const signature = headers.get("Upstash-Signature");
  if (!signature) throw new AppError("FORBIDDEN", "Missing QStash signature");
  const isValid = await receiver.verify({ signature, body: rawBody });
  if (!isValid) throw new AppError("FORBIDDEN", "Invalid QStash signature");
}
```

`Receiver.verify` checks both `currentSigningKey` and `nextSigningKey` — handles key rotation without downtime.

### Security Boundaries

- Webhook route is public in middleware but has its own signature guard.
- No webhook request is processed before signature verification.
- Job handlers (Stages 4+) must re-verify the job's `userId` still has an active account — payload `userId` could be stale.
- Replay attacks: QStash includes a message ID. Handlers should implement idempotency (documented requirement for Stage 4+).

---

## 7. Logging & Correlation Design

### Logger Singleton

```typescript
// server/logging/logger.ts
import pino from "pino";

export const logger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  base: { service: "devgrowth-api" }, // in every log entry
  transport:
    process.env.NODE_ENV !== "production"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
  timestamp: pino.stdTimeFunctions.isoTime,
});
```

### Correlation Store (AsyncLocalStorage)

```typescript
// server/logging/correlationStore.ts
import { AsyncLocalStorage } from "async_hooks";

interface CorrelationContext {
  correlationId: string;
  userId?: string;
}

const store = new AsyncLocalStorage<CorrelationContext>();

export function runWithCorrelation<T>(
  ctx: CorrelationContext,
  fn: () => Promise<T>,
): Promise<T> {
  return store.run(ctx, fn);
}

export function getCorrelationId(): string {
  return store.getStore()?.correlationId ?? "unknown";
}

export function getUserIdFromStore(): string | undefined {
  return store.getStore()?.userId;
}

export function setUserId(userId: string): void {
  const s = store.getStore();
  if (s) s.userId = userId;
}
```

### Correlation ID Generation and Propagation

**Generation logic in GraphQL Yoga plugin (on every request):**

```
1. Read request.headers.get('X-Correlation-ID')
2. If present and valid (UUID format, reasonable length) → use it
3. If absent or invalid → generate: crypto.randomUUID()
4. runWithCorrelation({ correlationId }, () => yoga.handleRequest(...))
5. Set X-Correlation-ID in response headers
```

**Propagation chain:**

```
HTTP Request with X-Correlation-ID (or generated)
  ↓ runWithCorrelation({ correlationId }) → AsyncLocalStorage
  ↓ createContext() → getCorrelationId() → ctx.correlationId
  ↓ requireAuth(ctx) → user confirmed
  ↓ setUserId(ctx.user.id) → AsyncLocalStorage
  ↓ Service: ctx.logger.debug('Fetching user', { correlationId, userId })
  ↓ Repository: ctx.logger.debug('DB query', { correlationId, userId })
  ↓ Response headers: X-Correlation-ID: <same id>
  ↓ Error (if any): { correlationId: getCorrelationId() } in extensions
```

Every call to `logger.child({ correlationId, userId })` produces a child logger that includes these fields in every subsequent log call from that instance.

### Required Structured Log Shape

```json
{
  "timestamp": "2026-09-08T07:12:34.567Z",
  "level": "info",
  "service": "devgrowth-api",
  "correlationId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "userId": "abc123def456",
  "method": "POST",
  "path": "/api/graphql",
  "durationMs": 234,
  "statusCode": 200,
  "message": "GraphQL request completed"
}
```

`service` and `timestamp` from base logger. `correlationId` and `userId` from child logger. `method`, `path`, `durationMs`, `statusCode` logged on request completion by Yoga plugin.

### Error Logging

```typescript
logger.error(
  {
    correlationId: getCorrelationId(),
    userId: getUserIdFromStore(),
    error: {
      code: err.code,
      message: err.message,
      stack: process.env.NODE_ENV !== "production" ? err.stack : undefined,
    },
  },
  "Request failed",
);
```

Stack trace included in dev logs; never in production. Client never receives the stack trace regardless.

### Concurrent Request Isolation

`AsyncLocalStorage.run()` creates an independent context per invocation. Concurrent requests on different async chains have different `correlationId` and `userId` values — guaranteed by the AsyncLocalStorage API. Test #23 verifies this.

---

## 8. BaseRepository Design

### Generic Type Parameters and Constructor

```typescript
// server/repositories/BaseRepository.ts
import { db as prismaDb } from "@/lib/prisma";

abstract class BaseRepository {
  protected readonly userId: string;
  protected readonly db: typeof prismaDb;

  constructor(userId: string) {
    if (!userId) throw new Error("BaseRepository requires a userId");
    this.userId = userId;
    this.db = prismaDb;
  }

  // Builds the mandatory user scope — injected into every where clause
  protected userScope(): { userId: string; deletedAt: null } {
    return { userId: this.userId, deletedAt: null };
  }
}
```

`userId` is `protected readonly` — subclasses can read it, not overwrite it. No default, no optional overload. TypeScript enforces this at every `new Repository(...)` call site.

### Protected Helper Methods (All Inject `userId`)

```typescript
protected async findFirst<T>(delegate: any, where?: object, select?: object): Promise<T | null> {
  return delegate.findFirst({
    where: { ...this.userScope(), ...where },
    ...(select ? { select } : {}),
  });
}

protected async findMany<T>(delegate: any, where?: object, orderBy?: object): Promise<T[]> {
  return delegate.findMany({
    where: { ...this.userScope(), ...where },
    ...(orderBy ? { orderBy } : {}),
  });
}

// update: Prisma throws P2025 if id doesn't belong to this.userId
protected async update<T>(delegate: any, id: string, data: object): Promise<T> {
  return delegate.update({ where: { id, userId: this.userId }, data });
}

// delete: same P2025 safety
protected async hardDelete(delegate: any, id: string): Promise<void> {
  await delegate.delete({ where: { id, userId: this.userId } });
}

// Soft delete
protected async softDelete(delegate: any, id: string): Promise<void> {
  await delegate.update({
    where: { id, userId: this.userId },
    data: { deletedAt: new Date() },
  });
}

// Bulk — always scoped to userId
protected async deleteMany(delegate: any, where?: object): Promise<number> {
  const { count } = await delegate.deleteMany({
    where: { userId: this.userId, ...where },
  });
  return count;
}
```

### Prisma Bypass Mitigations

| Bypass Risk                                                 | Mitigation                                                                                                               |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `findUnique({ where: { id } })` — returns any user's record | **Not exposed** in BaseRepository. Use `findFirst({ where: { id, userId: ... } })` instead — identical function, scoped. |
| `findMany()` without where                                  | BaseRepository `findMany` merges `userScope()` into every where.                                                         |
| `update({ where: { id } })` without userId                  | BaseRepository `update` adds `userId: this.userId` to where. Prisma throws P2025 for cross-user updates.                 |
| `delete({ where: { id } })` without userId                  | Same P2025 protection.                                                                                                   |
| `include` traversal to other users' relations               | Documented convention + code review requirement. Cannot be mechanically enforced by BaseRepository.                      |
| Direct `this.db.model.xxx` in subclasses                    | Code review concern — documented in CONTRIBUTING.                                                                        |

### Subclass Pattern

```typescript
// server/repositories/UserRepository.ts
class UserRepository extends BaseRepository {
  constructor(userId: string) {
    super(userId);
  }

  async findMe(): Promise<User | null> {
    return this.findFirst<User>(this.db.user);
  }

  async findOnboardingState(): Promise<{
    onboardingStep: string;
    onboardingCompleted: boolean;
  } | null> {
    return this.findFirst(
      this.db.user,
      {},
      {
        onboardingStep: true,
        onboardingCompleted: true,
      },
    );
  }
}

// Instantiation in resolvers (after requireAuth):
const userRepo = new UserRepository(ctx.user.id);
const user = await userRepo.findMe();
```

### Cross-User/Admin Access

Not supported by BaseRepository. Future admin features use `db` directly with an explicit comment in code. This makes cross-user access a named, reviewable exception.

---

## 9. GraphQL Architecture

### SDL Organization

**Stage 3 operational SDL only** — future types are commented stubs:

```graphql
scalar DateTime
scalar JSON

type User {
  id: ID!
  email: String!
  username: String!
  name: String
  avatarUrl: String
  targetRole: String
  targetCompanies: [String!]!
  createdAt: DateTime!
}

type AppError {
  code: String!
  message: String!
  field: String
  correlationId: String!
}

type Query {
  me: User
}

# Mutation and other types are added by feature stages (4+)
# NO Subscription type — real-time uses polling per Technical Decision #2
```

### Yoga Setup

```typescript
// server/graphql/yoga.ts
import { createYoga, createSchema } from "graphql-yoga";

export const yoga = createYoga({
  schema: createSchema({ typeDefs, resolvers }),
  context: createContext,
  graphqlEndpoint: "/api/graphql",
  landingPage: process.env.NODE_ENV === "development", // GraphiQL in dev only
  maskedErrors: {
    maskError: (error, message) => {
      /* handled by formatError */
    },
  },
  plugins: [correlationPlugin, requestLoggerPlugin],
});
```

### Route

```typescript
// app/api/graphql/route.ts
import { yoga } from "@/server/graphql/yoga";
export const { fetch: GET, fetch: POST } = yoga;
export const runtime = "nodejs"; // Required: Prisma + pg need Node.js APIs
```

### Context Factory

```typescript
// server/graphql/context.ts
export async function createContext(request: Request): Promise<GraphQLContext> {
  const session = await getServerSession(authOptions);
  const user = session?.user
    ? {
        id: session.user.id,
        email: session.user.email!,
        name: session.user.name ?? null,
      }
    : null;

  const correlationId = getCorrelationId(); // from AsyncLocalStorage
  if (user) setUserId(user.id);

  return {
    user,
    correlationId,
    logger: logger.child({
      correlationId,
      ...(user ? { userId: user.id } : {}),
    }),
  };
}
```

**`getServerSession(authOptions)` correctly reads the session cookie from the request in Next.js App Router Route Handlers.** No additional cookie parsing is needed.

### `requireAuth`

```typescript
// server/graphql/errors.ts
export function requireAuth(
  ctx: GraphQLContext,
): asserts ctx is GraphQLContext & { user: AuthenticatedUser } {
  if (!ctx.user) {
    throw new AppError("UNAUTHENTICATED", "Authentication required");
  }
}
```

TypeScript assertion function: after `requireAuth(ctx)`, TS narrows `ctx.user` to non-null for the remainder of the scope.

### me Query — Complete Execution Trace

```
POST /api/graphql  { query: "{ me { id email username } }" }
 ↓
app/api/graphql/route.ts → yoga.fetch(request)
 ↓
Yoga correlationPlugin
  → Extract/generate correlationId
  → runWithCorrelation({ correlationId }, () => ...)
 ↓
createContext(request)
  → getServerSession(authOptions)
  → session.user.id = "abc123"
  → setUserId("abc123") → AsyncLocalStorage
  → logger.child({ correlationId, userId: "abc123" })
  → ctx = { user: { id, email, name }, correlationId, logger }
 ↓
Query.me resolver
  → requireAuth(ctx)   [ctx.user is non-null → continues]
  → new UserService("abc123", ctx.logger)
  → userService.getAuthenticatedUser()
    → new UserRepository("abc123")
    → repo.findMe()
      → db.user.findFirst({ where: { userId: "abc123", deletedAt: null } })
      → PostgreSQL SELECT WHERE user_id = 'abc123' AND deleted_at IS NULL
      ← User row
    ← User object
  ← { id, email, username, name, avatarUrl, targetRole, targetCompanies, createdAt }
 ↓
Yoga requestLoggerPlugin
  → logger.info({ correlationId, userId, method: "POST", path: "/api/graphql", statusCode: 200, durationMs: 42 })
 ↓
HTTP Response
  headers: { "X-Correlation-ID": "a1b2c3d4-...", "Content-Type": "application/json" }
  body: { "data": { "me": { "id": "abc123", "email": "...", "username": "..." } } }
```

### Explicit Absence of Subscriptions

- SDL: **no `Subscription` type**
- Resolvers: **no subscription resolvers**
- Yoga config: **no subscription transport**
- Route: **no WebSocket upgrade handling**

Real-time behavior uses polling. Any PR adding a `Subscription` type is a stage scope violation and must be rejected in code review.

---

## 10. Error Handling Contract

### Error Type

```typescript
// server/graphql/errors.ts
export type AppErrorCode =
  | "UNAUTHENTICATED" // No valid session
  | "FORBIDDEN" // Session valid but insufficient permission
  | "NOT_FOUND" // Resource not found or not accessible
  | "VALIDATION_ERROR" // Input validation failure
  | "INTERNAL_ERROR" // Unexpected server error
  | "CONFLICT" // Resource state conflict
  | "RATE_LIMITED"; // Too many requests

export class AppError extends Error {
  constructor(
    public readonly code: AppErrorCode,
    public readonly message: string,
    public readonly field?: string, // for field-level validation errors
  ) {
    super(message);
    this.name = "AppError";
  }
}
```

`correlationId` is NOT stored on `AppError` — it is added at serialization time from AsyncLocalStorage. This avoids threading it through every error constructor call.

### GraphQL Error Format (via Yoga `formatError`)

```json
{
  "errors": [
    {
      "message": "Authentication required",
      "extensions": {
        "code": "UNAUTHENTICATED",
        "field": null,
        "correlationId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
      }
    }
  ],
  "data": null
}
```

### `formatError` Implementation

```typescript
// In yoga.ts config:
formatError: (formattedError, error) => {
  const original = error instanceof AppError ? error : null;
  const correlationId = getCorrelationId();

  if (original) {
    return {
      message: original.message,
      extensions: {
        code: original.code,
        field: original.field ?? null,
        correlationId,
      },
    };
  }

  // Unknown error — log full details, return sanitized response
  logger.error({ correlationId, error }, "Unexpected GraphQL error");
  return {
    message: "An unexpected error occurred",
    extensions: { code: "INTERNAL_ERROR", field: null, correlationId },
  };
};
```

**Security principle:** Any non-AppError is logged in full on the server and sanitized to `INTERNAL_ERROR` on the client. No stack traces, no internal messages, no implementation details leak to the client.

### Error Movement Through the Stack

```
Repository / Service
  ↓ throws AppError (code, message, field?)
  OR throws Error (Prisma errors, unexpected failures)

GraphQL Resolver
  ↓ error propagates (no try/catch at resolver level unless specific handling needed)

Yoga formatError
  ↓ AppError → { code, message, field, correlationId } in extensions
  ↓ Error → INTERNAL_ERROR, logged, no detail to client

Client
  { errors: [{ message, extensions: { code, field, correlationId } }] }
```

### Error Examples

**Unauthenticated:**

```json
{
  "message": "Authentication required",
  "extensions": {
    "code": "UNAUTHENTICATED",
    "field": null,
    "correlationId": "..."
  }
}
```

**Not Found:**

```json
{
  "message": "User not found",
  "extensions": { "code": "NOT_FOUND", "field": null, "correlationId": "..." }
}
```

**Validation (field-level):**

```json
{
  "message": "Username must be 3+ characters",
  "extensions": {
    "code": "VALIDATION_ERROR",
    "field": "username",
    "correlationId": "..."
  }
}
```

**Internal error (Prisma connection refused):**

```json
{
  "message": "An unexpected error occurred",
  "extensions": {
    "code": "INTERNAL_ERROR",
    "field": null,
    "correlationId": "..."
  }
}
```

Server log: `{ level: "error", correlationId: "...", error: { message: "ECONNREFUSED", stack: "..." }, message: "Unexpected GraphQL error" }`

### REST Error Format

For webhook and v1 REST routes, use `ApiError` from `types/api.ts` enriched with `correlationId`:

```json
{
  "error": "FORBIDDEN",
  "message": "Invalid QStash signature",
  "correlationId": "..."
}
```

### REST vs GraphQL Error Code Vocabulary

- **REST routes:** Use `API_ERROR_CODES` from `types/api.ts` (e.g., `"UNAUTHORIZED"`)
- **GraphQL:** Use `AppErrorCode` (e.g., `"UNAUTHENTICATED"`)

These are different surfaces; client handles them separately. Future stages must not conflate them.

---

## 11. Testing Strategy

All tests use **Vitest** (configured in `vitest.config.ts`). Tests live in `apps/web/tests/` (matching existing `tests/auth/` structure). Unit tests mock Redis and QStash via `vi.mock`. Integration tests use real `TEST_DATABASE_URL`.

### Cache Tests — `tests/cache/getCached.test.ts`

| #     | Test Name                                             | Layer    | Setup                                                 | Action                                                                                      | Expected                                       | Assertion                        |
| ----- | ----------------------------------------------------- | -------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------- | -------------------------------- |
| 1     | Cache hit returns cached value                        | Unit     | `redis.get` → `{ id: 1 }`                             | `getCached('key', fetcher, { ttl: 60 })`                                                    | Returns `{ id: 1 }`                            | `fetcher` called 0 times         |
| 2     | Cache miss calls fetcher                              | Unit     | `redis.get` → null; `redis.set` mocked                | Same                                                                                        | Returns fetcher result; `redis.set` called     | `fetcher` called 1 time          |
| 3     | TTL passed to Redis                                   | Unit     | `redis.set` mocked                                    | `getCached('key', f, { ttl: 300 })`                                                         | `redis.set` called with `ex: 300`              | TTL arg verified                 |
| 4     | Tag-based invalidation removes keys                   | Unit     | `redis.smembers` → `['k1','k2']`                      | `invalidateByTag('tag:user:abc')`                                                           | `redis.del('k1','k2')` called; tag key deleted | `KEYS` never called              |
| 5     | Tags written on cache set                             | Unit     | `redis.sadd` mocked                                   | `getCached('key', f, { ttl: 60, tags: ['tag:user:abc'] })`                                  | `redis.sadd('tag:user:abc', 'key')` called     | Tag written after value          |
| 6     | SCAN loop handles multiple batches                    | Unit     | `redis.scan` returns 2 batches (cursor 10, then 0)    | `invalidatePattern('user:abc:*')`                                                           | `redis.scan` called twice; all keys deleted    | `KEYS` never called              |
| 7     | Redis unavailable — fallback to fetcher               | Unit     | `redis.get` throws                                    | `getCached('key', fetcher, { ttl: 60 })`                                                    | Returns fetcher result                         | No error thrown to caller        |
| 8     | Redis unavailable — invalidate logs warning, no throw | Unit     | `redis.del` throws                                    | `invalidateCache('key')`                                                                    | Does not throw                                 | Warning logged                   |
| **9** | **10 concurrent → fetcher executes once**             | **Unit** | `redis.get` → null; fetcher has 50ms artificial delay | **`Promise.all(Array(10).fill(null).map(() => getCached('same-key', fetcher, {ttl:60})))`** | **All 10 resolve with same value**             | **`fetcher` call count === 1**   |
| 10    | Different keys have separate in-flight state          | Unit     | Both keys miss cache                                  | Concurrent `getCached('k1',...)` and `getCached('k2',...)`                                  | Both call their fetchers                       | Each fetcher called exactly once |

### QStash Tests — `tests/queue/enqueueJob.test.ts`

| #      | Test Name                                 | Layer           | Setup                                                 | Action                                             | Expected                                      | Assertion                              |
| ------ | ----------------------------------------- | --------------- | ----------------------------------------------------- | -------------------------------------------------- | --------------------------------------------- | -------------------------------------- |
| 11     | Valid signed webhook accepted             | Integration     | Real HMAC signature from `QSTASH_CURRENT_SIGNING_KEY` | POST `/api/webhooks/qstash` valid body + signature | 200                                           | Job dispatched                         |
| 12     | Missing signature header → 403            | Integration     | No `Upstash-Signature` header                         | POST without signature                             | 403                                           | Body not processed                     |
| **13** | **Forged signature → 403**                | **Integration** | Body signed with wrong key                            | **POST with forged signature**                     | **403**                                       | **Zero handler calls; warning logged** |
| 14     | Malformed JSON after valid sig → 400      | Integration     | Valid HMAC sig, body = `"not json"`                   | POST                                               | 400                                           | Error before handler                   |
| 15     | Unknown job type → 400                    | Integration     | Valid sig, valid JSON, `type: "unknown_type"`         | POST                                               | 400                                           | Warning logged                         |
| 16     | Handler error → 500                       | Integration     | Valid sig, valid job, handler throws                  | POST                                               | 500                                           | QStash retries                         |
| 17     | enqueueJob sends correct payload shape    | Unit            | Mock QStash `publish`                                 | `enqueueJob(JobType.GITHUB_SYNC, payload)`         | `publish` called with URL, JSON body, headers | `correlationId` in payload             |
| 18     | Verification before processing (ordering) | Integration     | Forged sig + valid job body                           | POST                                               | 403                                           | Verification happens before parsing    |

### Logging Tests — `tests/logging/correlation.test.ts`

| #      | Test Name                               | Layer    | Setup                             | Action                                                                                                          | Expected                       | Assertion                                                                               |
| ------ | --------------------------------------- | -------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------ | --------------------------------------------------------------------------------------- |
| 19     | ID generated when not present           | Unit     | No X-Correlation-ID               | Request without header                                                                                          | UUID generated                 | Format matches UUID v4                                                                  |
| 20     | ID propagated from header               | Unit     | `X-Correlation-ID: "test-id-123"` | Request with header                                                                                             | Same ID used                   | Same ID in response header                                                              |
| 21     | userId included after auth              | Unit     | Authenticated context             | `me` query                                                                                                      | Log includes `userId`          | Matches session user                                                                    |
| 22     | Unauthenticated has no userId           | Unit     | No session                        | Unauthenticated request                                                                                         | Log has no `userId`            | undefined                                                                               |
| **23** | **Concurrent requests don't share IDs** | **Unit** | Two async operations              | **`Promise.all([runWithCorrelation({correlationId:'A'}, fn1), runWithCorrelation({correlationId:'B'}, fn2)])`** | **fn1 sees 'A', fn2 sees 'B'** | **No cross-contamination**                                                              |
| 24     | All required fields in log entry        | Unit     | Mock pino transport               | Any logged request                                                                                              | All required fields present    | timestamp, level, service, correlationId, method, path, durationMs, statusCode, message |
| 25     | Error log preserves correlationId       | Unit     | Force error                       | Error during request                                                                                            | Error log has correlationId    | Same ID as request                                                                      |

### BaseRepository Tests — `tests/repositories/BaseRepository.test.ts`

| #      | Test Name                         | Layer           | Setup                     | Action                                          | Expected                                                | Assertion                |
| ------ | --------------------------------- | --------------- | ------------------------- | ----------------------------------------------- | ------------------------------------------------------- | ------------------------ |
| 26     | findFirst scopes to userId        | Integration     | Users A and B in test DB  | `new UserRepository(A.id).findMe()`             | Returns A's record                                      | B's record not returned  |
| 27     | update rejects cross-user         | Integration     | Users A and B             | `new UserRepository(A.id).update(B.id, data)`   | Throws (Prisma P2025)                                   | B not modified           |
| 28     | delete rejects cross-user         | Integration     | Users A and B             | `new UserRepository(A.id).hardDelete(B.id)`     | Throws (Prisma P2025)                                   | B not deleted            |
| 29     | deleteMany scopes to userId       | Integration     | A has 3 sessions; B has 2 | `new UserRepository(A.id).deleteManySessions()` | Only A's sessions deleted                               | B's sessions intact      |
| **30** | **userId cannot be omitted**      | **Unit + Type** | TypeScript compiler       | `new UserRepository(undefined as any)`          | Throws at runtime: `'BaseRepository requires a userId'` | Compile-time: TS error   |
| 31     | User cannot read another's record | Integration     | Users A and B in test DB  | `new UserRepository(A.id).findMe()`             | Never returns B's data                                  | User isolation           |
| 32     | Soft-deleted user returns null    | Integration     | User with `deletedAt` set | `new UserRepository(deletedUser.id).findMe()`   | Returns null                                            | `deletedAt` filter works |
| 33     | Empty userId throws immediately   | Unit            | —                         | `new UserRepository('')`                        | Throws `Error('BaseRepository requires a userId')`      | Guard in constructor     |

### GraphQL Tests — `tests/graphql/me.test.ts`

| #      | Test Name                                       | Layer           | Setup                                   | Action                                           | Expected                                               | Assertion                         |
| ------ | ----------------------------------------------- | --------------- | --------------------------------------- | ------------------------------------------------ | ------------------------------------------------------ | --------------------------------- |
| 34     | me returns authenticated user                   | Integration     | Real user in DB; mock session → user.id | `POST /api/graphql { me { id email username } }` | User's data returned                                   | id, email, username match         |
| 35     | me returns error when unauthenticated           | Integration     | No session                              | `POST /api/graphql { me { id } }`                | `errors[0].extensions.code === "UNAUTHENTICATED"`      | data: null                        |
| **36** | **me returns correct user, not another's data** | **Integration** | Users A and B in DB; session for A      | **`me` query**                                   | **Returns A's data, not B's**                          | **User isolation**                |
| 37     | Error envelope has all required fields          | Integration     | Unauthenticated request                 | `me` query                                       | Error has code, message, field, correlationId          | All four fields present           |
| 38     | X-Correlation-ID in response                    | Integration     | Any request                             | `POST /api/graphql`                              | Response header contains X-Correlation-ID              | Header present                    |
| 39     | Internal error doesn't leak                     | Integration     | UserService throws generic Error        | `me` query                                       | `errors[0].message === "An unexpected error occurred"` | code === INTERNAL_ERROR; no stack |
| 40     | requireAuth throws AppError for null user       | Unit            | `ctx.user = null`                       | `requireAuth(ctx)`                               | Throws AppError                                        | code === UNAUTHENTICATED          |

### End-to-End Smoke Test

| #      | Test Name                                         | Layer                 | Setup                                                                                                                  | Action                                                | Expected                                                                         | Assertion                                                                                                                          |
| ------ | ------------------------------------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **41** | **Full me stack: HTTP → GraphQL → DB → response** | **Integration (E2E)** | Seed real user in `TEST_DATABASE_URL`; mock `getServerSession` to return `{ user: { id: seededUser.id, email: ... } }` | `POST /api/graphql { me { id email username name } }` | `{ data: { me: { id: "<uuid>", email: "...", username: "...", name: "..." } } }` | Data exactly matches seeded user; no GraphQL errors array; X-Correlation-ID header present; server log contains same correlationId |

---

## 12. Implementation Sequence

| Step | Action                                      | Files                                                             | Verify                                                                                                                     |
| ---- | ------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 1    | **Env & dependencies**                      | `package.json`, `next.config.ts`, `lib/env.ts`                    | `npm install` succeeds; `env.ts` compiles; TypeScript passes                                                               |
| 2    | **Cache key extensions**                    | `lib/cache/cacheKeys.ts`                                          | `cacheTags` and `cacheTTL` exported correctly                                                                              |
| 3    | **Cache foundation**                        | `server/cache/redisClient.ts`                                     | Module exports verified; imports compile                                                                                   |
| 4    | **Cache tests**                             | `tests/cache/getCached.test.ts`                                   | **All 10 tests green, especially #9 (10-concurrent → 1 fetch)**                                                            |
| 5    | **Correlation store**                       | `server/logging/correlationStore.ts`                              | AsyncLocalStorage compiles; exports verified                                                                               |
| 6    | **Pino logger**                             | `server/logging/logger.ts`, `server/logging/requestLogger.ts`     | Logger creates without error; child logger works                                                                           |
| 7    | **Logging tests**                           | `tests/logging/correlation.test.ts`                               | **All 7 tests green, especially #23 (concurrent isolation)**                                                               |
| 8    | **QStash job types**                        | `server/queue/jobTypes.ts`                                        | TypeScript discriminated union compiles                                                                                    |
| 9    | **QStash client + enqueue**                 | `server/queue/qstashClient.ts`, `server/queue/enqueueJob.ts`      | Unit test: payload shape correct                                                                                           |
| 10   | **QStash verifier + router**                | `server/queue/verifyQStash.ts`, `server/queue/jobRouter.ts`       | Stub router registered                                                                                                     |
| 11   | **QStash webhook route + middleware patch** | `app/api/webhooks/qstash/route.ts`, `middleware.ts`               | Route accessible from outside (no 401)                                                                                     |
| 12   | **QStash tests**                            | `tests/queue/enqueueJob.test.ts`                                  | **All 8 tests green, especially #13 (forged → 403)**                                                                       |
| 13   | **BaseRepository**                          | `server/repositories/BaseRepository.ts`                           | Abstract class compiles; userId required                                                                                   |
| 14   | **UserRepository refactor**                 | `server/repositories/UserRepository.ts`                           | Extends BaseRepository; existing tests still pass                                                                          |
| 15   | **BaseRepository tests**                    | `tests/repositories/BaseRepository.test.ts`                       | **All 8 tests green against TEST_DATABASE_URL**                                                                            |
| 16   | **GraphQL error types**                     | `server/graphql/errors.ts`, `types/graphql.ts`                    | `AppError`, `requireAuth`, `formatError` compile                                                                           |
| 17   | **GraphQL SDL**                             | `server/graphql/schema.ts`                                        | SDL parses without errors; no Subscription type                                                                            |
| 18   | **GraphQL context**                         | `server/graphql/context.ts`                                       | Unit test: mock session → correct context shape                                                                            |
| 19   | **UserService**                             | `server/services/UserService.ts`                                  | Unit test with mock repository                                                                                             |
| 20   | **me resolver + resolver registry**         | `server/graphql/resolvers/userResolvers.ts`, `resolvers/index.ts` | Unit test with mock context                                                                                                |
| 21   | **Yoga + route**                            | `server/graphql/yoga.ts`, `app/api/graphql/route.ts`              | Dev server: GET /api/graphql returns GraphiQL                                                                              |
| 22   | **GraphQL tests**                           | `tests/graphql/me.test.ts`, `tests/graphql/errors.test.ts`        | **All 8 tests green, especially #36 and #41**                                                                              |
| 23   | **Final validation**                        | —                                                                 | Full test suite: `vitest run`. TypeScript: `tsc --noEmit`. Manual smoke test: real browser, signed in, hit `/api/graphql`. |

---

## 13. Acceptance Criteria

| #   | Criterion                                                                  | Verification Method                                                                                                           |
| --- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 1   | Cache stampede: 10 simultaneous requests → fetcher executes exactly once   | Test #9 passes in CI                                                                                                          |
| 2   | QStash forged/invalid signatures rejected with 403                         | Tests #13, #18 pass                                                                                                           |
| 3   | Unsigned webhook requests rejected with 403                                | Test #12 passes                                                                                                               |
| 4   | Cache invalidation never uses Redis `KEYS`                                 | `grep -r "redis.keys\|\.keys(" apps/web/server/cache/` → zero results                                                         |
| 5   | Tag-based invalidation is the primary path                                 | `invalidateByTag` is the function called by feature code; `invalidatePattern` is documented secondary                         |
| 6   | BaseRepository operations enforce user scoping                             | Tests #26–32 pass against test DB                                                                                             |
| 7   | Unscoped repository access structurally difficult                          | TypeScript error on `new UserRepository(undefined)`; runtime throws                                                           |
| 8   | Correlation IDs consistently propagated                                    | Tests #20, #23, #37, #38 pass; manual: X-Correlation-ID in response headers                                                   |
| 9   | Required structured logging fields present                                 | Test #24 passes                                                                                                               |
| 10  | Stage 2 auth reused, not duplicated                                        | `createContext` calls `getServerSession(authOptions)` — no alternative session mechanism exists                               |
| 11  | GraphQL Yoga operational                                                   | `GET /api/graphql` → GraphiQL in dev; `POST` accepts queries                                                                  |
| 12  | No Subscription type or resolvers                                          | `grep -r "Subscription" apps/web/server/graphql/` → zero results                                                              |
| 13  | `me` works end-to-end against PostgreSQL                                   | Test #41 passes against `TEST_DATABASE_URL`                                                                                   |
| 14  | Shared errors contain code, message, field, correlationId                  | Test #37 passes                                                                                                               |
| 15  | Future stages can consume Stage 3 infrastructure without additional wiring | Stage 4 can call `enqueueJob`, `getCached`, `new GithubRepository(userId)`, add a resolver — zero foundational changes needed |

---

## 14. Risks, Edge Cases & Failure Modes

| Risk                                                   | Severity   | Mitigation                                                                                                                                                                                                                                  |
| ------------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Redis unavailable**                                  | Medium     | `getCached` falls back to calling fetcher directly. Log warning. No service outage — only caching degraded.                                                                                                                                 |
| **Redis lock TTL too short**                           | High       | If fetcher takes longer than `lockTtlMs` (5s default), a second instance may begin fetching. Mitigation: callers of slow operations (AI pipelines, Stages 6–8) must pass `lockTtlMs: 30000`. Document in JSDoc.                             |
| **Cross-instance lock polling timeout**                | Medium     | Polling with `maxAttempts: 10, intervalMs: 200ms` = 2s max. If primary fetcher fails mid-operation, pollers fall through to direct fetch. Acceptable degradation.                                                                           |
| **Cache tag set grows unbounded**                      | Low        | `SADD` without TTL means the tag set outlives all its members. Mitigation: set `EXPIRE` on tag sets to `data_ttl + 60s`. On invalidation, always `DEL` the tag set itself.                                                                  |
| **Raw body consumed before QStash verification**       | High       | If `request.json()` is called before `request.text()`, body is consumed and verification fails cryptically. Mitigation: route handler MUST call `request.text()` first — enforced in Step 11 of the implementation sequence.                |
| **QStash replay / duplicate delivery**                 | Medium     | QStash is at-least-once. Handlers must be idempotent. Documented requirement for Stage 4+ handlers; enforcement is their responsibility.                                                                                                    |
| **Correlation ID collision**                           | Negligible | UUID v4: 122 bits entropy. Not a practical concern.                                                                                                                                                                                         |
| **Correlation ID spoofing**                            | Low        | Client can send arbitrary `X-Correlation-ID`. Accepted for tracing only. No security decision depends on it. Sanitize value (length limit, format check).                                                                                   |
| **Missing authenticated user**                         | Medium     | `createContext` sets `ctx.user = null`. All authenticated resolvers call `requireAuth(ctx)` which throws `UNAUTHENTICATED`. No resolver accesses `ctx.user` without this guard.                                                             |
| **Cross-user data via Prisma `include`**               | Medium     | BaseRepository cannot mechanically enforce include-level scoping. Mitigation: code review standard — all includes reviewed for user-scoping.                                                                                                |
| **Prisma `findUnique` bypass**                         | Medium     | `findUnique({ where: { id } })` returns any user's record. Mitigation: BaseRepository does not expose `findUnique`. Subclasses must use `findFirst` with `userId`.                                                                          |
| **GraphQL error information leakage**                  | High       | Non-AppError errors could expose internals. Mitigation: `formatError` is the single catch point; all non-AppError sanitized to `INTERNAL_ERROR`. Production logs retain full error. Client gets nothing.                                    |
| **Prisma connection errors**                           | Medium     | Throws `PrismaClientInitializationError`. Propagates to `formatError` as non-AppError → `INTERNAL_ERROR`. Logged in full.                                                                                                                   |
| **`/api/webhooks/qstash` blocked by middleware**       | High       | The existing `middleware.ts` catches all `/api/` routes. QStash has no session cookie → 401. **Mitigation: add `/api/webhooks/` to `isPublicRoute` in Step 11 of the sequence.** This is the most likely implementation error to encounter. |
| **`@vercel/kv` API differences from `@upstash/redis`** | Low        | `@vercel/kv` wraps Upstash. Main API (`get`, `set`, `del`, `sadd`, `smembers`, `scan`) is identical. Auto-reads env vars. No functional concern.                                                                                            |
| **Assumption about Stage 2 `auth()` surface**          | Low        | **Verified:** `server/auth/index.ts` exports `auth()` = `getServerSession(authOptions)`. `createContext` calls exactly this. If Stage 2 changes, the context factory needs a one-line update.                                               |

---

## 15. Final Stage 3 Definition of Done

Stage 3 is complete when **every item on this list is true**:

### Infrastructure Guarantees

- [ ] `getCached<T>` implements two-level stampede protection (in-process Map + Redis NX lock).
- [ ] `invalidateByTag` uses SADD/SMEMBERS/DEL; never KEYS.
- [ ] `invalidatePattern` uses SCAN cursor loop; never KEYS.
- [ ] Redis failure causes graceful fallback, not an uncaught exception.
- [ ] `enqueueJob` sends typed jobs with `correlationId` and `userId` in every payload.
- [ ] `/api/webhooks/qstash` is registered as a public route in `middleware.ts`.
- [ ] The QStash webhook route reads raw body (`request.text()`) before any other parsing.
- [ ] Signature verification happens before any payload processing.
- [ ] An unverified or forged webhook returns 403 and zero handler calls.
- [ ] Pino singleton is initialized with `service: "devgrowth-api"`.
- [ ] `AsyncLocalStorage` correctly isolates `correlationId` and `userId` per async chain.
- [ ] `X-Correlation-ID` is in every HTTP response from GraphQL and webhook routes.
- [ ] `BaseRepository` requires `userId` at construction; no default, no optional.
- [ ] `findUnique` is not exposed in `BaseRepository`; `findFirst` with `userId` is used instead.

### GraphQL Guarantees

- [ ] Yoga is operational at `/api/graphql` with `runtime = 'nodejs'`.
- [ ] `createContext` calls `getServerSession(authOptions)` — no alternative auth mechanism.
- [ ] `requireAuth(ctx)` throws `AppError(UNAUTHENTICATED)` when `ctx.user` is null.
- [ ] `formatError` converts all non-AppError to `INTERNAL_ERROR` without internal detail.
- [ ] The SDL contains **no** `Subscription` type.
- [ ] The resolvers export **no** subscription resolvers.

### me Query Guarantees

- [ ] `me` returns: `id`, `email`, `username`, `name`, `avatarUrl`, `targetRole`, `targetCompanies`, `createdAt`.
- [ ] `me` returns `errors[0].extensions.code === "UNAUTHENTICATED"` for unauthenticated requests.
- [ ] `me` cannot return another user's data (test #36 verifies this).
- [ ] Every response includes `X-Correlation-ID` header.
- [ ] Every request log includes `correlationId`, `userId`, `method`, `path`, `statusCode`, `durationMs`.

### Test Suite

- [ ] Test #9 (10 concurrent → 1 fetcher call) passes in CI.
- [ ] Test #13 (forged signature → 403) passes in CI.
- [ ] Test #23 (concurrent requests share no correlation state) passes.
- [ ] Test #36 (user isolation in me query) passes against `TEST_DATABASE_URL`.
- [ ] Test #41 (full e2e stack) passes against `TEST_DATABASE_URL`.
- [ ] `vitest run` exits with code 0 (all 41 tests green).
- [ ] `tsc --noEmit` exits with code 0.

### Future-Stage Extensibility

- [ ] Stage 4 can call `enqueueJob(JobType.GITHUB_SYNC, { userId, githubUsername })` — zero new wiring.
- [ ] Stage 4 can call `getCached('key', fetcher, { ttl, tags: [cacheTags.user(userId)] })` — zero new wiring.
- [ ] Stage 4 can instantiate `new GithubRepository(userId)` extending `BaseRepository` — zero new wiring.
- [ ] Stage 4 can add a resolver to `resolvers/githubResolvers.ts` and register it in `resolvers/index.ts` — no changes to `yoga.ts`, `context.ts`, or `route.ts` required.
