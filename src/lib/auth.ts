// src/lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

if (!process.env.NEXTAUTH_SECRET) {
  console.warn("[next-auth] NEXTAUTH_SECRET not set. Using fallback — set it in environment variables for production.");
}

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
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const user = await db.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user || !(user as any).isActive) return null;

          const valid = await bcrypt.compare(credentials.password, (user as any).passwordHash);
          if (!valid) return null;

          // Update last login (non-blocking)
          db.user.update({
            where: { id: (user as any).id },
            data: { lastLogin: new Date() },
          }).catch(() => {});

          return {
            id: (user as any).id,
            email: (user as any).email,
            name: (user as any).name,
            role: (user as any).role,
          };
        } catch (error) {
          // Database not available (e.g. Prisma stub in dev without DB)
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
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
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
