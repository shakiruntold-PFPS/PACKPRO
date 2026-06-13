// src/middleware.ts
// Simple cookie-based route guard — works in Edge Runtime without NEXTAUTH_SECRET
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = ["next-auth.session-token", "__Secure-next-auth.session-token"];

function hasSession(req: NextRequest) {
  return SESSION_COOKIE.some(name => req.cookies.get(name)?.value);
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow: Next.js internals, static files, auth API, setup API
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/public") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/setup") ||
    pathname.startsWith("/api/health")
  ) {
    return NextResponse.next();
  }

  // All other /api/* routes pass through — handlers call requireAuth() themselves
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const loggedIn = hasSession(req);

  // If already logged in and on login/signup/root, send to dashboard
  if (loggedIn && (pathname === "/" || pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/admin/dashboard", req.url));
  }

  // /admin/* requires a session cookie
  if (pathname.startsWith("/admin") && !loggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|public/).*)"],
};
