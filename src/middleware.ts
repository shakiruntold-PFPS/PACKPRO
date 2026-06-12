// src/middleware.ts
// Simple cookie-based route guard — works in Edge Runtime without NEXTAUTH_SECRET
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow: Next.js internals, static files, public pages, auth API
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/public") ||
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.startsWith("/api/auth")
  ) {
    return NextResponse.next();
  }

  // All /api/* routes pass through — each handler calls requireAuth() itself
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // /admin/* requires a session cookie
  if (pathname.startsWith("/admin")) {
    const token =
      req.cookies.get("next-auth.session-token")?.value ||
      req.cookies.get("__Secure-next-auth.session-token")?.value;

    if (!token) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|public/).*)"],
};
