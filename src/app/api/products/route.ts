// src/app/api/products/route.ts
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, created, requireAuth, paginate, paginatedResponse, logAction } from "@/lib/api";
import { z } from "zod";

const ProductSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  sku: z.string().optional(),
  hsnCode: z.string().optional(),
  gstRate: z.number().default(18),
  categoryId: z.string(),
  subcategory: z.string().optional(),
  brand: z.string().optional(),
  unit: z.string().default("pcs"),
  moq: z.number().int().default(500),
  material: z.string().optional(),
  description: z.string().optional(),
  shortDesc: z.string().optional(),
  features: z.array(z.string()).default([]),
  specifications: z.record(z.string(), z.unknown()).optional(),
  purchasePrice: z.number().optional(),
  sellingPrice: z.number().optional(),
  mrp: z.number().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  featured: z.boolean().default(false),
  isCatalogVisible: z.boolean().default(true),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  tags: z.array(z.string()).default([]),
  reorderLevel: z.number().default(100),
});

export async function GET(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 20);
  const search = searchParams.get("search") ?? "";
  const categoryId = searchParams.get("categoryId") ?? "";
  const status = searchParams.get("status") ?? "";
  const featured = searchParams.get("featured");

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { code: { contains: search, mode: "insensitive" } },
      { tags: { has: search } },
    ];
  }
  if (categoryId) where.categoryId = categoryId;
  if (status) where.status = status;
  if (featured === "true") where.featured = true;

  const { skip, take } = paginate(page, limit);
  const [data, total] = await Promise.all([
    db.product.findMany({
      where,
      skip,
      take,
      include: {
        category: { select: { id: true, name: true } },
        images: { where: { isPrimary: true }, take: 1 },
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

  // Check duplicate code
  const exists = await db.product.findUnique({ where: { code: parsed.data.code } });
  if (exists) return err("Product code already exists");

  const product = await db.product.create({ data: parsed.data });
  await logAction(user!.id, "CREATE", "PRODUCT", product.id, null, product);
  return created(product);
}
