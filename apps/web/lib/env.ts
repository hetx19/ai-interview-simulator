import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    GITHUB_CLIENT_ID: z.string().min(1),
    GITHUB_CLIENT_SECRET: z.string().min(1),
    GITHUB_TOKEN_ENCRYPTION_KEY: z.string().length(64),
    JWT_SECRET: z.string().length(128),
    KV_REST_API_URL: z.string().url(),
    KV_REST_API_TOKEN: z.string().min(1),
    GROQ_API_KEY: z.string().min(1),
    GEMINI_API_KEY: z.string().min(1),
    CRON_SECRET: z.string().min(32),
    GMAIL_USER: z.string().email().optional(),
    GMAIL_APP_PASSWORD: z.string().min(1).optional(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    GITHUB_TOKEN_ENCRYPTION_KEY: process.env.GITHUB_TOKEN_ENCRYPTION_KEY,
    JWT_SECRET: process.env.JWT_SECRET,
    KV_REST_API_URL: process.env.KV_REST_API_URL,
    KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    CRON_SECRET: process.env.CRON_SECRET,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    GMAIL_USER: process.env.GMAIL_USER,
    GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD,
  },
});
