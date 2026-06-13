export const runtime = "nodejs";
// src/app/api/products/route.ts
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, created, requireAuth, paginate, paginatedResponse, logAction } from "@/lib/api";
import { sanitizeObject } from "@/lib/sanitize";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const ProductSchema = z.object({
  name:            z.string().min(1).max(300),
  code:            z.string().min(1).max(50),
  sku:             z.string().max(100).optional(),
  hsnCode:         z.string().max(8).optional(),
  gstRate:         z.number().min(0).max(28).default(18),
  categoryId:      z.string().min(1),
  subcategory:     z.string().max(100).optional(),
  brand:           z.string().max(100).optional(),
  unit:            z.string().max(20).default("pcs"),
  moq:             z.number().int().min(1).default(500),
  material:        z.string().max(200).optional(),
  description:     z.string().max(10000).optional(),
  shortDesc:       z.string().max(500).optional(),
  features:        z.array(z.string().max(500)).max(20).default([]),
  specifications:  z.record(z.string(), z.unknown()).optional(),
  purchasePrice:   z.number().min(0).optional(),
  sellingPrice:    z.number().min(0).optional(),
  mrp:             z.number().min(0).optional(),
  status:          z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  featured:        z.boolean().default(false),
  isCatalogVisible:z.boolean().default(true),
  seoTitle:        z.string().max(200).optional(),
  seoDescription:  z.string().max(500).optional(),
  tags:            z.array(z.string().max(50)).max(30).default([]),
  reorderLevel:    z.number().min(0).default(100),
});

export async function GET(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const page       = Number(searchParams.get("page")       ?? 1);
  const limit      = Number(searchParams.get("limit")      ?? 20);
  const search     = searchParams.get("search")     ?? "";
  const categoryId = searchParams.get("categoryId") ?? "";
  const status     = searchParams.get("status")     ?? "";
  const featured   = searchParams.get("featured");

  const where: Prisma.ProductWhereInput = { deletedAt: null };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { code: { contains: search, mode: "insensitive" } },
      { sku:  { contains: search, mode: "insensitive" } },
    ];
  }
  if (categoryId) where.categoryId = categoryId;
  if (status)     where.status = status as Prisma.EnumProductStatusFilter;
  if (featured === "true") where.featured = true;

  const { skip, take } = paginate(page, limit);
  const [data, total] = await Promise.all([
    db.product.findMany({
      where,
      skip,
      take,
      include: {
        category: { select: { id: true, name: true } },
        images:   { where: { isPrimary: true }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.product.count({ where }),
  ]);

  return ok(paginatedResponse(data, total, page, limit));
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  const body = await req.json();
  const parsed = ProductSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.message);

  const data = sanitizeObject(parsed.data) as typeof parsed.data;

  const exists = await db.product.findFirst({
    where: { code: data.code, deletedAt: null } as Prisma.ProductWhereInput,
  });
  if (exists) return err("Product code already exists");

  // Use UncheckedCreateInput so we can pass categoryId directly
  // instead of the relation object { category: { connect: { id } } }
  const product = await db.product.create({
    data: data as Prisma.ProductUncheckedCreateInput,
  });
  await logAction(user.id, "CREATE", "PRODUCT", product.id, null, {
    name: product.name,
    code: product.code,
  });
  return created(product);
}
