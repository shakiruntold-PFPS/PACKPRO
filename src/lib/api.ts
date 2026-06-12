// src/lib/api.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateInvoiceNumber } from "@/lib/utils";

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

// ─── Auth helpers ──────────────────────────────────────────────────────────────
export async function requireAuth(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { user: null, response: err("Unauthorized", 401) };
    }
    return { user: session.user, response: null };
  } catch {
    return { user: null, response: err("Authentication error", 500) };
  }
}

export async function requireRole(_req: NextRequest, roles: string[]) {
  const { user, response } = await requireAuth(_req);
  if (response) return { user: null, response };
  const role = (user as any).role;
  if (role !== "SUPER_ADMIN" && !roles.includes(role)) {
    return { user: null, response: err("Forbidden", 403) };
  }
  return { user, response: null };
}

// ─── Audit log ─────────────────────────────────────────────────────────────────
export async function logAction(
  userId: string,
  action: string,
  module: string,
  recordId?: string,
  oldValue?: any,
  newValue?: any
) {
  try {
    await db.auditLog.create({
      data: { userId, action, module, recordId, oldValue, newValue },
    });
  } catch {
    // Non-fatal — audit log failure should not break the operation
  }
}

// ─── Pagination ────────────────────────────────────────────────────────────────
export function paginate(page: number, limit: number) {
  const p = Math.max(1, page);
  const l = Math.min(100, Math.max(1, limit));
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
