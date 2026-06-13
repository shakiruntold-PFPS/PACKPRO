export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok } from "@/lib/api";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const search = sp.get("search") ?? "";
  const category = sp.get("category") ?? "";

  const where: any = {
    isCatalogVisible: true,
    status: "PUBLISHED",
  };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { code: { contains: search, mode: "insensitive" } },
      { shortDesc: { contains: search, mode: "insensitive" } },
      { brand: { contains: search, mode: "insensitive" } },
    ];
  }

  if (category) {
    where.categoryId = category;
  }

  const [products, categories] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: [{ featured: "desc" }, { name: "asc" }],
      include: {
        category: { select: { id: true, name: true } },
        images: { select: { url: true }, take: 1 },
      },
    }),
    db.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return ok({ products, categories });
}
