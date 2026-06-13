import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, requireAuth } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { response } = await requireAuth(req);
  if (response) return response;

  const settings = await db.companySettings.findUnique({ where: { id: "default" } });
  if (!settings) return err("Settings not found", 404);
  return ok(settings);
}

export async function PATCH(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  const body = await req.json().catch(() => ({}));

  const allowed = [
    "name","tagline","address","city","state","pincode","phone","email",
    "supportEmail","website","gstin","pan","bankName","accountNo","ifsc",
    "branch","accountType","upiId","invoicePrefix","financialYear","gstRate",
    "currency","currencySymbol","defaultDuedays","notes","logo",
  ];

  const update: Record<string, any> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  if (Object.keys(update).length === 0) return err("No valid fields to update");

  const settings = await db.companySettings.upsert({
    where: { id: "default" },
    update,
    create: { id: "default", name: "PACKPRO", ...update },
  });

  return ok(settings);
}
