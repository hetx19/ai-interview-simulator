import { describe, it, expect, afterAll } from "vitest";
import { POST } from "@/app/api/auth/dev-login/route";
import { NextRequest } from "next/server";
import { db } from "@/lib/prisma";

describe("Developer Credentials Authentication Route", () => {
  const createdUserIds: string[] = [];

  afterAll(async () => {
    for (const id of createdUserIds) {
      await db.user.delete({ where: { id } }).catch(() => {});
    }
  });

  it("authenticates a developer email, creates a database session and sets session cookie", async () => {
    const testEmail = `dev_${Date.now()}@example.com`;

    const req = new NextRequest("http://localhost:3000/api/auth/dev-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.user.email).toBe(testEmail);
    createdUserIds.push(data.user.id);

    // Verify session cookie was set
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toBeDefined();
    expect(setCookie).toContain("next-auth.session-token=");

    // Verify session exists in database
    const sessionInDb = await db.session.findFirst({
      where: { userId: data.user.id },
    });
    expect(sessionInDb).toBeDefined();
    expect(sessionInDb?.userId).toBe(data.user.id);
  });

  it("rejects dev-login if NODE_ENV is production", async () => {
    const origEnv = process.env.NODE_ENV;
    try {
      (process.env as any).NODE_ENV = "production";

      const req = new NextRequest("http://localhost:3000/api/auth/dev-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "dev@example.com" }),
      });

      const res = await POST(req);
      expect(res.status).toBe(403);
    } finally {
      (process.env as any).NODE_ENV = origEnv;
    }
  });
});
