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
    // Neon + Vercel serverless: keep connection limit low
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
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
