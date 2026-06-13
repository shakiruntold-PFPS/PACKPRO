// src/lib/db.ts
// Prisma singleton — handles both dev hot-reload and Vercel serverless/Neon
import { PrismaClient, Prisma } from "@prisma/client";
export type { Prisma };

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: {
      db: {
        // Neon: use pooled URL for queries; direct URL for migrations (set separately via CLI).
        // The "build:" fallback is never used at runtime — it just satisfies Prisma's
        // constructor validation when DATABASE_URL is absent in the Next.js build step.
        url: process.env.DATABASE_URL ?? "postgresql://build:build@localhost:5432/build",
      },
    },
  });
}

// In production (Vercel), create a new client per invocation.
// In development, reuse the global to avoid too many connections.
export const db: PrismaClient =
  process.env.NODE_ENV === "production"
    ? createPrismaClient()
    : (globalThis.prisma ?? (globalThis.prisma = createPrismaClient()));
