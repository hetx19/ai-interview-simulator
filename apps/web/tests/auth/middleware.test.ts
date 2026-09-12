import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { middleware, isPublicRoute } from "@/middleware";

function createMockRequest(pathname: string, cookies: Record<string, string> = {}): NextRequest {
  const url = `http://localhost:3000${pathname}`;
  const req = new NextRequest(url);

  for (const [name, value] of Object.entries(cookies)) {
    req.cookies.set(name, value);
  }

  return req;
}

import { encode } from "next-auth/jwt";

describe("Middleware Authentication Guard & Route Protection", () => {
  describe("isPublicRoute helper", () => {
    it("recognizes exact public paths", () => {
      expect(isPublicRoute("/")).toBe(true);
      expect(isPublicRoute("/login")).toBe(true);
      expect(isPublicRoute("/signup")).toBe(true);
    });

    it("recognizes public developer profiles (/u/*)", () => {
      expect(isPublicRoute("/u")).toBe(true);
      expect(isPublicRoute("/u/johndoe")).toBe(true);
      expect(isPublicRoute("/u/johndoe/github")).toBe(true);
      expect(isPublicRoute("/u/alice-dev")).toBe(true);
    });

    it("recognizes public NextAuth API routes (/api/auth/*)", () => {
      expect(isPublicRoute("/api/auth")).toBe(true);
      expect(isPublicRoute("/api/auth/signin")).toBe(true);
      expect(isPublicRoute("/api/auth/callback/github")).toBe(true);
      expect(isPublicRoute("/api/auth/callback/google")).toBe(true);
      expect(isPublicRoute("/api/auth/session")).toBe(true);
      expect(isPublicRoute("/api/auth/csrf")).toBe(true);
      expect(isPublicRoute("/api/auth/providers")).toBe(true);
    });

    it("recognizes static assets and Next.js internals as public", () => {
      expect(isPublicRoute("/favicon.ico")).toBe(true);
      expect(isPublicRoute("/_next/static/chunks/app.js")).toBe(true);
      expect(isPublicRoute("/_next/image?url=...&w=64&q=75")).toBe(true);
    });

    it("correctly identifies protected paths as non-public", () => {
      expect(isPublicRoute("/dashboard")).toBe(false);
      expect(isPublicRoute("/onboarding")).toBe(false);
      expect(isPublicRoute("/settings")).toBe(false);
      expect(isPublicRoute("/interviews/new")).toBe(false);
      expect(isPublicRoute("/interviews/123-abc")).toBe(false);
      expect(isPublicRoute("/api/v1/user/profile")).toBe(false);
      expect(isPublicRoute("/api/v1/github/sync")).toBe(false);
      expect(isPublicRoute("/api/graphql")).toBe(false);
      expect(isPublicRoute("/u-settings")).toBe(false); // colliding prefix
    });
  });

  describe("Middleware response behavior", () => {
    // 1. public app routes
    it("allows unauthenticated requests to public application route (/)", async () => {
      const req = createMockRequest("/");
      const res = await middleware(req);
      expect(res.status).toBe(200);
      expect(res.headers.get("location")).toBeNull();
    });

    it("allows unauthenticated requests to public application route (/login)", async () => {
      const req = createMockRequest("/login");
      const res = await middleware(req);
      expect(res.status).toBe(200);
      expect(res.headers.get("location")).toBeNull();
    });

    it("allows unauthenticated requests to public developer profile (/u/johndoe)", async () => {
      const req = createMockRequest("/u/johndoe");
      const res = await middleware(req);
      expect(res.status).toBe(200);
      expect(res.headers.get("location")).toBeNull();
    });

    // 2. public api routes
    it("allows unauthenticated requests to public API route (/api/auth/session)", async () => {
      const req = createMockRequest("/api/auth/session");
      const res = await middleware(req);
      expect(res.status).toBe(200);
    });

    it("allows unauthenticated requests to public API route (/api/auth/callback/github)", async () => {
      const req = createMockRequest("/api/auth/callback/github");
      const res = await middleware(req);
      expect(res.status).toBe(200);
    });

    // 3. protected api routes
    it("returns 401 JSON for unauthenticated request to protected API route (/api/v1/github/sync)", async () => {
      const req = createMockRequest("/api/v1/github/sync");
      const res = await middleware(req);

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe("UNAUTHORIZED");
      expect(json.message).toBe("Authentication required.");
    });

    it("returns 401 JSON for unauthenticated request to protected API route (/api/graphql)", async () => {
      const req = createMockRequest("/api/graphql");
      const res = await middleware(req);

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe("UNAUTHORIZED");
    });

    it("returns 401 JSON for unauthenticated request to nested protected API route (/api/v1/interviews/session_123/execute)", async () => {
      const req = createMockRequest("/api/v1/interviews/session_123/execute");
      const res = await middleware(req);

      expect(res.status).toBe(401);
    });

    // 4. protected app routes
    it("redirects unauthenticated request to protected application route (/dashboard) to /login with callbackUrl", async () => {
      const req = createMockRequest("/dashboard");
      const res = await middleware(req);

      expect(res.status).toBe(307);
      const location = res.headers.get("location");
      expect(location).not.toBeNull();
      expect(location).toContain("/login");
      expect(location).toContain("callbackUrl=%2Fdashboard");
    });

    it("redirects unauthenticated request to nested protected route (/interviews/session_123) to /login with callbackUrl", async () => {
      const req = createMockRequest("/interviews/session_123");
      const res = await middleware(req);

      expect(res.status).toBe(307);
      const location = res.headers.get("location");
      expect(location).toContain("/login");
      expect(location).toContain("callbackUrl=%2Finterviews%2Fsession_123");
    });

    it("redirects unauthenticated request to /onboarding to /login", async () => {
      const req = createMockRequest("/onboarding");
      const res = await middleware(req);

      expect(res.status).toBe(307);
      const location = res.headers.get("location");
      expect(location).toContain("callbackUrl=%2Fonboarding");
    });

    // 5. authenticated requests
    it("allows authenticated request with valid session token cookie to access protected page (/dashboard)", async () => {
      const req = createMockRequest("/dashboard", {
        "next-auth.session-token": "valid_session_token_123",
      });
      const res = await middleware(req);

      expect(res.status).toBe(200);
      expect(res.headers.get("location")).toBeNull();
    });

    it("allows authenticated request with production session cookie (__Secure-next-auth.session-token) to access protected API route (/api/v1/user/profile)", async () => {
      const req = createMockRequest("/api/v1/user/profile", {
        "__Secure-next-auth.session-token": "valid_prod_session_token_123",
      });
      const res = await middleware(req);

      expect(res.status).toBe(200);
    });

    it("rejects empty or whitespace-only session cookie", async () => {
      const req = createMockRequest("/dashboard", {
        "next-auth.session-token": "   ",
      });
      const res = await middleware(req);

      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/login");
    });

    it("authenticates requests with cryptographically signed JWT via getToken", async () => {
      const secret = "a".repeat(32);
      process.env.NEXTAUTH_SECRET = secret;

      const signedToken = await encode({
        token: { sub: "user-456", email: "auth@example.com" },
        secret,
      });

      const req = createMockRequest("/dashboard", {
        "next-auth.session-token": signedToken,
      });
      const res = await middleware(req);

      expect(res.status).toBe(200);
      expect(res.headers.get("location")).toBeNull();
    });
  });
});
