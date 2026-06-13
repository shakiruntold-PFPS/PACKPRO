import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, requireAuth, requireRole } from "@/lib/api";
import { sanitizeObject } from "@/lib/sanitize";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { response } = await requireAuth(req);
  if (response) return response;

  const settings = await db.companySettings.findUnique({ where: { id: "default" } });
  if (!settings) return err("Settings not found", 404);
  return ok(settings);
}

export async function PUT(req: NextRequest) {
  return PATCH(req);
}

export async function PATCH(req: NextRequest) {
  const { response } = await requireRole(req, ["ADMIN"]);
  if (response) return response;

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;

  const ALLOWED_KEYS = new Set([
    "name","tagline","address","city","state","pincode","phone","email",
    "supportEmail","website","gstin","pan","cin",
    "bankName","bankAccount","bankIfsc","bankBranch",
    "invoicePrefix","financialYear","gstRate",
    "currency","currencySymbol","logoUrl",
  ]);

  const update: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(body)) {
    if (ALLOWED_KEYS.has(key)) update[key] = val;
  }

  if (Object.keys(update).length === 0) return err("No valid fields to update");

  const sanitized = sanitizeObject(update as Record<string, unknown>);

  const settings = await db.companySettings.upsert({
    where: { id: "default" },
    update: sanitized,
    create: { id: "default", name: "PACKPRO", ...sanitized },
  });

  return ok(settings);
}
