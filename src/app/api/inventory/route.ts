export const runtime = "nodejs";
// src/app/api/inventory/route.ts
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, created, requireAuth, paginate, paginatedResponse, logAction } from "@/lib/api";
import { z } from "zod";

const StockAdjustSchema = z.object({
  productId:     z.string(),
  type:          z.enum(["OPENING","PURCHASE_IN","SALE_OUT","RETURN_IN","RETURN_OUT","ADJUSTMENT","TRANSFER","DAMAGE"]),
  qty:           z.number(),
  warehouseId:   z.string().optional(),
  referenceId:   z.string().optional(),
  referenceType: z.string().optional(),
  notes:         z.string().optional(),
});

// GET /api/inventory          → recent transactions (paginated)
// GET /api/inventory?low=1    → low-stock products
export async function GET(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  const { searchParams } = new URL(req.url);

  // Low-stock report mode
  if (searchParams.get("low") === "1") {
    const products = await db.product.findMany({
      where: { status: "PUBLISHED" },
      select: {
        id: true, name: true, code: true, unit: true,
        stockQty: true, reorderLevel: true,
        category: { select: { name: true } },
      },
    });
    const lowStock = products.filter((p: any) => (p.stockQty ?? 0) <= (p.reorderLevel ?? 100));
    return ok(lowStock);
  }

  const page      = Number(searchParams.get("page")  ?? 1);
  const limit     = Number(searchParams.get("limit") ?? 30);
  const productId = searchParams.get("productId") ?? "";

  const where: any = {};
  if (productId) where.productId = productId;

  const { skip, take } = paginate(page, limit);
  const [data, total] = await Promise.all([
    db.inventoryTransaction.findMany({
      where,
      skip,
      take,
      include: { product: { select: { id: true, name: true, code: true, unit: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.inventoryTransaction.count({ where }),
  ]);

  return ok(paginatedResponse(data, total, page, limit));
}

// POST /api/inventory → create stock adjustment
export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  const body   = await req.json();
  const parsed = StockAdjustSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.message);

  const product = await db.product.findUnique({ where: { id: parsed.data.productId } });
  if (!product) return err("Product not found", 404);

  const outTypes = ["SALE_OUT", "RETURN_OUT", "DAMAGE", "TRANSFER"];
  const isOut    = outTypes.includes(parsed.data.type) && parsed.data.qty > 0;
  const qtyChange = isOut ? -Math.abs(parsed.data.qty) : Math.abs(parsed.data.qty);
  const newBalance = (product as any).stockQty + qtyChange;

  if (newBalance < 0) {
    return err(`Insufficient stock. Current stock: ${(product as any).stockQty}`);
  }

  // Use $transaction array form (supported by stub and real Prisma)
  const results = await db.$transaction([
    db.inventoryTransaction.create({
      data: {
        ...parsed.data,
        qty:     qtyChange,
        balance: newBalance,
      },
    }),
    db.product.update({
      where: { id: parsed.data.productId },
      data:  { stockQty: newBalance },
    }),
  ]);

  const txn = results[0];

  await logAction(
    user!.id, "STOCK_ADJUST", "INVENTORY", (product as any).id,
    { stock: (product as any).stockQty },
    { stock: newBalance }
  );
  return created(txn);
}
