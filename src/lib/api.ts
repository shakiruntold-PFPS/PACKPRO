// src/lib/api.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db, type Prisma } from "@/lib/db";
import { sanitizeObject } from "@/lib/sanitize";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// Re-export for routes that import from here
export { generateInvoiceNumber } from "@/lib/utils";

// ─── Response helpers ──────────────────────────────────────────────────────────
export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function err(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function created<T>(data: T) {
  return ok(data, 201);
}

// Rate-limit response with Retry-After header
export function rateLimited(resetAt: number) {
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
  return NextResponse.json(
    { success: false, error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Reset": String(resetAt),
      },
    }
  );
}

// ─── Auth helpers ──────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  name?: string | null;
  email?: string | null;
  role: string;
}

export async function requireAuth(
  _req: NextRequest
): Promise<{ user: AuthUser; response: null } | { user: null; response: NextResponse }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { user: null, response: err("Unauthorized", 401) };
    }
    return { user: session.user as AuthUser, response: null };
  } catch {
    return { user: null, response: err("Authentication error", 500) };
  }
}

export async function requireRole(
  req: NextRequest,
  roles: string[]
): Promise<{ user: AuthUser; response: null } | { user: null; response: NextResponse }> {
  const { user, response } = await requireAuth(req);
  if (response) return { user: null, response };
  if (user.role !== "SUPER_ADMIN" && !roles.includes(user.role)) {
    return { user: null, response: err("Forbidden", 403) };
  }
  return { user, response: null };
}

// ─── Rate limiting helpers ──────────────────────────────────────────────────────

/**
 * Apply route-level rate limiting. Returns a 429 response if exceeded.
 * Usage: const limited = await applyRateLimit(req, "signup", 10, 60_000);
 *        if (limited) return limited;
 */
export function applyRateLimit(
  req: NextRequest,
  routeKey: string,
  limit: number,
  windowMs = 60_000
): NextResponse | null {
  const ip = getClientIp(req);
  const result = rateLimit(`${routeKey}:${ip}`, limit, windowMs);
  if (!result.success) return rateLimited(result.resetAt);
  return null;
}

// ─── Input sanitization ────────────────────────────────────────────────────────

/** Sanitize all string values in a Zod-parsed object before persisting. */
export { sanitizeObject } from "@/lib/sanitize";

// ─── Soft delete ───────────────────────────────────────────────────────────────

/**
 * Soft-delete a record by setting its deletedAt timestamp.
 * All GET queries must filter where: { deletedAt: null }.
 *
 * Usage:
 *   await softDelete(db.party, id);
 *   await softDelete(db.product, id);
 */
export async function softDelete(
  model: { update: (args: { where: { id: string }; data: { deletedAt: Date } }) => Promise<unknown> },
  id: string
): Promise<void> {
  await model.update({ where: { id }, data: { deletedAt: new Date() } });
}

// ─── Audit log ─────────────────────────────────────────────────────────────────
export async function logAction(
  userId: string,
  action: string,
  module: string,
  recordId?: string,
  oldValue?: Prisma.InputJsonValue | null,
  newValue?: Prisma.InputJsonValue | null
) {
  try {
    await db.auditLog.create({
      data: {
        userId,
        action,
        module,
        recordId,
        // Prisma Json fields accept undefined but not null; coerce null → undefined
        oldValue: oldValue ?? undefined,
        newValue: newValue ?? undefined,
      },
    });
  } catch {
    // Non-fatal — audit log failure must not break the primary operation
  }
}

// ─── Pagination ────────────────────────────────────────────────────────────────
export function paginate(page: number | string | null, limit: number | string | null) {
  const p = Math.max(1, Number(page) || 1);
  const l = Math.min(100, Math.max(1, Number(limit) || 25));
  return { skip: (p - 1) * l, take: l, page: p, limit: l };
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
) {
  return {
    data,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
}
