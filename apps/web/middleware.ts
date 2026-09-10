import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// exact public routes
const PUBLIC_EXACT = new Set(["/", "/login", "/signup"]);

const SESSION_COOKIE_NAMES = [
  "__Secure-next-auth.session-token",
  "next-auth.session-token",
  "__Secure-authjs.session-token",
  "authjs.session-token",
];

// check if route is public
export function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true;

  // public dev profiles
  if (pathname === "/u" || pathname.startsWith("/u/")) return true;

  // next-auth endpoints
  if (pathname === "/api/auth" || pathname.startsWith("/api/auth/"))
    return true;

  // webhooks (signed by qstash or third parties)
  if (pathname === "/api/webhooks" || pathname.startsWith("/api/webhooks/"))
    return true;

  // static files and bundles
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

// check for active session cookie
export function hasSessionCookie(req: NextRequest): boolean {
  return SESSION_COOKIE_NAMES.some((name) => {
    const cookie = req.cookies.get(name);
    return Boolean(cookie && cookie.value);
  });
}

export function middleware(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  const authenticated = hasSessionCookie(req);

  if (!authenticated) {
    // api routes return 401
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Authentication required." },
        { status: 401 },
      );
    }

    // app pages redirect to login with return url
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
