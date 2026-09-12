import { defineConfig } from "vitest/config";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

let envPath = path.resolve(process.cwd(), ".env");
if (!fs.existsSync(envPath)) {
  envPath = path.resolve(process.cwd(), "../../.env");
}
dotenv.config({ path: envPath });

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
      TEST_DATABASE_URL: process.env["TEST_DATABASE_URL"] ?? "",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
