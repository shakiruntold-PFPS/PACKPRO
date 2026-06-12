// src/proxy.ts
// Route protection proxy — Next.js 16 convention (replaces deprecated middleware.ts)
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default withAuth(
  function middleware(req: NextRequest) {
    const token = (req as any).nextauth?.token;
    const { pathname } = req.nextUrl;

    // Authenticated users visiting login/signup → send to dashboard
    if ((pathname === "/login" || pathname === "/signup") && token) {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }

    // Block deactivated accounts from admin
    if (pathname.startsWith("/admin") && token?.isActive === false) {
      return NextResponse.redirect(new URL("/login?error=AccountDisabled", req.url));
    }

    return NextResponse.next();
  },
  {
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
      authorized({ token, req }) {
        const { pathname } = req.nextUrl;

        // Always allow public auth routes
        if (
          pathname === "/login" ||
          pathname === "/signup" ||
          pathname.startsWith("/api/auth") ||
          pathname === "/"
        ) {
          return true;
        }

        // Admin panel requires authentication
        if (pathname.startsWith("/admin")) {
          return !!token;
        }

        // API routes: auth enforced per-route via requireAuth()
        // Proxy allows through; individual API handlers check the session
        return true;
      },
    },
  }
);

export const config = {
  // Only run on pages and API — skip Next.js internals and static files
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
