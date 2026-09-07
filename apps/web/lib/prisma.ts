import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// pool config
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error(
    "DATABASE_URL environment variable is not set. " +
      "Add it to your .env or .env.local file.",
  );
}

function createPool(): Pool {
  return new Pool({
    connectionString: DATABASE_URL,
    max: process.env.NODE_ENV === "production" ? 5 : 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: true }
        : false,
  });
}

// prisma client factory
function createPrismaClient(): PrismaClient {
  const pool = createPool();
  const adapter = new PrismaPg(pool);

  const client = new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? [
            { emit: "event", level: "query" },
            { emit: "stdout", level: "warn" },
            { emit: "stdout", level: "error" },
          ]
        : [
            { emit: "stdout", level: "warn" },
            { emit: "stdout", level: "error" },
          ],
  });

  if (process.env.NODE_ENV === "development") {
    client.$on("query", (e: { query: string; duration: number }) => {
      if (e.duration > 200) {
        console.warn(`[Prisma] Slow query (${e.duration}ms): ${e.query}`);
      }
    });
  }

  return client;
}

// reuse client in dev to prevent leaking connections on hmr
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const db: PrismaClient = globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = db;
}

// db health check ping
export async function checkDatabaseHealth(): Promise<boolean> {
  await db.$queryRaw`SELECT 1`;
  return true;
}
