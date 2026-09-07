import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public route prefixes and exact matches
const PUBLIC_EXACT = new Set(["/", "/login"]);

const SESSION_COOKIE_NAMES = [
  "__Secure-next-auth.session-token",
  "next-auth.session-token",
  "__Secure-authjs.session-token",
  "authjs.session-token",
];

/**
 * Determines whether a pathname represents a public route that does not require authentication.
 */
export function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true;

  // Public developer profile pages (/u, /u/username, /u/username/...)
  if (pathname === "/u" || pathname.startsWith("/u/")) return true;

  // NextAuth authentication endpoints (/api/auth, /api/auth/...)
  if (pathname === "/api/auth" || pathname.startsWith("/api/auth/")) return true;

  // Static assets, favicon, Next.js internal bundles
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/public") ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt)$/)
  ) {
    return true;
  }

  return false;
}

/**
 * Checks if the incoming request contains any valid NextAuth session cookie.
 */
export function hasSessionCookie(req: NextRequest): boolean {
  return SESSION_COOKIE_NAMES.some((name) => {
    const cookie = req.cookies.get(name);
    return Boolean(cookie && cookie.value);
  });
}

/**
 * Application-level middleware for route authentication guarding.
 * - Public routes: allowed without authentication.
 * - Unauthenticated protected API routes: return 401 JSON.
 * - Unauthenticated protected application routes: redirect to /login?callbackUrl=...
 * - Authenticated requests: allowed through.
 */
export function middleware(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  const authenticated = hasSessionCookie(req);

  if (!authenticated) {
    // Protected API routes: return 401 JSON
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Authentication required." },
        { status: 401 },
      );
    }

    // Protected application pages: redirect to /login with callbackUrl
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
