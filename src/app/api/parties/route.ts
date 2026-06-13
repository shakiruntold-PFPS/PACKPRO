export const runtime = "nodejs";
// src/app/api/parties/route.ts
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, created, requireAuth, paginate, paginatedResponse, logAction } from "@/lib/api";
import { z } from "zod";

const PartySchema = z.object({
  type: z.enum(["CUSTOMER", "VENDOR", "SUPPLIER", "DEALER", "DISTRIBUTOR", "TRANSPORTER"]),
  name: z.string().min(1),
  code: z.string().optional(),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  altPhone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().optional(),
  gstin: z.string().optional(),
  pan: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  country: z.string().default("India"),
  creditLimit: z.number().optional(),
  creditDays: z.number().int().optional(),
  segment: z.string().optional(),
  industry: z.string().optional(),
  source: z.string().optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 25);
  const search = searchParams.get("search") ?? "";
  const type = searchParams.get("type") ?? "";

  const where: any = { isActive: true };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
      { gstin: { contains: search, mode: "insensitive" } },
      { city: { contains: search, mode: "insensitive" } },
    ];
  }
  if (type) where.type = type;

  const { skip, take } = paginate(page, limit);
  const [data, total] = await Promise.all([
    db.party.findMany({ where, skip, take, orderBy: { name: "asc" } }),
    db.party.count({ where }),
  ]);

  return ok(paginatedResponse(data, total, page, limit));
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  const body = await req.json();
  const parsed = PartySchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.message);

  const party = await db.party.create({ data: parsed.data as any });
  await logAction(user!.id, "CREATE", "PARTY", party.id, null, party);
  return created(party);
}
