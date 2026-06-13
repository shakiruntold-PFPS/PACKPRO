// src/lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

if (!process.env.NEXTAUTH_SECRET) {
  console.warn("[next-auth] NEXTAUTH_SECRET not set. Using fallback — set it in environment variables for production.");
}

// Auto-detect NEXTAUTH_URL on Vercel if not explicitly set
process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 }, // 8 hours
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;

        // Rate limit login: 10 attempts per IP per 15 minutes
        const ip =
          (req?.headers?.["x-forwarded-for"] as string | undefined)?.split(",")[0].trim() ??
          (req?.headers?.["x-real-ip"] as string | undefined) ??
          "unknown";
        const rl = rateLimit(`login:${ip}`, 10, 15 * 60 * 1000);
        if (!rl.success) return null;

        try {
          const user = await db.user.findUnique({
            where: { email: credentials.email.toLowerCase().trim() },
          });

          if (!user || !user.isActive) return null;

          const valid = await bcrypt.compare(credentials.password, user.passwordHash);
          if (!valid) return null;

          // Update last login (non-blocking)
          db.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } }).catch(() => {});

          return { id: user.id, email: user.email, name: user.name, role: user.role };
        } catch (error) {
          console.error("[auth] authorize error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
};

// ─── Role permission map ───────────────────────────────────────────────────────
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ["*"],
  ADMIN: ["dashboard", "crm", "sales", "purchase", "inventory", "accounts", "hr", "products", "settings"],
  MANAGER: ["dashboard", "crm", "sales", "purchase", "inventory", "reports"],
  SALES: ["dashboard", "crm", "sales", "products"],
  ACCOUNTS: ["dashboard", "sales", "invoices", "payments", "reports"],
  WAREHOUSE: ["dashboard", "inventory", "dispatches"],
  PURCHASE: ["dashboard", "purchase", "inventory"],
  HR: ["dashboard", "hr"],
};

export function hasPermission(role: string, module: string): boolean {
  const perms = ROLE_PERMISSIONS[role] || [];
  return perms.includes("*") || perms.includes(module);
}
