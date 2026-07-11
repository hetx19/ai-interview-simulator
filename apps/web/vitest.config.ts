import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    include: ["tests/**/*.test.ts", "prisma/tests/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
    env: {
      TEST_DATABASE_URL: process.env["TEST_DATABASE_URL"] ?? "",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});