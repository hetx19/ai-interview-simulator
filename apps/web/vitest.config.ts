import { defineConfig } from "vitest/config";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

const candidateEnvFiles = [
  path.resolve(process.cwd(), ".env.local"),
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "../../.env.local"),
  path.resolve(process.cwd(), "../../.env"),
  path.resolve(process.cwd(), ".env.example"),
  path.resolve(process.cwd(), "../../.env.example"),
];

for (const f of candidateEnvFiles) {
  if (fs.existsSync(f)) {
    dotenv.config({ path: f });
  }
}

const defaultTestDb =
  "postgresql://devmetric:devmetric@localhost:5432/devmetric_test?schema=public";
const resolvedDb =
  process.env["TEST_DATABASE_URL"] || process.env["DATABASE_URL"] || defaultTestDb;

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    include: [
      "tests/**/*.test.ts",
      "prisma/tests/**/*.test.ts",
      "__tests__/**/*.test.ts",
    ],
    env: {
      TEST_DATABASE_URL: resolvedDb,
      DATABASE_URL: resolvedDb,
      QSTASH_TOKEN: process.env["QSTASH_TOKEN"] || "mock_qstash_token",
      SKIP_ENV_VALIDATION: "true",
      VITEST: "true",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
