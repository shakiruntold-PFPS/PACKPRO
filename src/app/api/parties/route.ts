export const runtime = "nodejs";
// src/app/api/parties/route.ts
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, created, requireAuth, paginate, paginatedResponse, logAction } from "@/lib/api";
import { sanitizeObject, isValidGSTIN } from "@/lib/sanitize";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const PartySchema = z.object({
  type:          z.enum(["CUSTOMER", "VENDOR", "SUPPLIER", "DEALER", "DISTRIBUTOR", "TRANSPORTER"]),
  name:          z.string().min(1).max(200),
  code:          z.string().max(50).optional(),
  contactPerson: z.string().max(100).optional(),
  phone:         z.string().max(20).optional(),
  altPhone:      z.string().max(20).optional(),
  email:         z.string().email().max(254).optional().or(z.literal("")),
  website:       z.string().max(200).optional(),
  gstin:         z.string().max(15).optional(),
  pan:           z.string().max(10).optional(),
  address:       z.string().max(500).optional(),
  city:          z.string().max(100).optional(),
  state:         z.string().max(100).optional(),
  pincode:       z.string().max(10).optional(),
  country:       z.string().max(100).default("India"),
  creditLimit:   z.number().min(0).optional(),
  creditDays:    z.number().int().min(0).max(365).optional(),
  segment:       z.string().max(100).optional(),
  industry:      z.string().max(100).optional(),
  source:        z.string().max(100).optional(),
  tags:          z.array(z.string().max(50)).max(20).default([]),
  notes:         z.string().max(5000).optional(),
});

export async function GET(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const page   = Number(searchParams.get("page")  ?? 1);
  const limit  = Number(searchParams.get("limit") ?? 25);
  const search = searchParams.get("search") ?? "";
  const type   = searchParams.get("type")   ?? "";

  const where: Prisma.PartyWhereInput = { isActive: true, deletedAt: null };
  if (search) {
    where.OR = [
      { name:  { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
      { gstin: { contains: search, mode: "insensitive" } },
      { city:  { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }
  if (type) where.type = type as Prisma.EnumPartyTypeFilter;

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

  const data = sanitizeObject(parsed.data) as typeof parsed.data;

  // Validate GSTIN format if provided
  if (data.gstin && !isValidGSTIN(data.gstin)) {
    return err("Invalid GSTIN format. Expected format: 22AAAAA0000A1Z5");
  }

  // Duplicate phone check
  if (data.phone) {
    const dup = await db.party.findFirst({
      where: { phone: data.phone, deletedAt: null } as Prisma.PartyWhereInput,
      select: { id: true, name: true },
    });
    if (dup) {
      return err(`A party with this phone number already exists: ${dup.name}`);
    }
  }

  const party = await db.party.create({ data: data as Prisma.PartyCreateInput });
  await logAction(user.id, "CREATE", "PARTY", party.id, null, { name: party.name, type: party.type });
  return created(party);
}
