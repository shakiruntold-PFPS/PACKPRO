export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, err, requireAuth, paginate, paginatedResponse, logAction, generateInvoiceNumber } from "@/lib/api";

const grnInclude = {
  purchaseOrder: { include: { vendor: true } },
  items: { include: { product: { select: { name: true, code: true } } } },
};

const itemSchema = z.object({
  productId:   z.string().min(1),
  qtyReceived: z.number().positive(),
  qtyRejected: z.number().min(0).default(0),
  notes:       z.string().optional(),
});

const createSchema = z.object({
  purchaseOrderId: z.string().min(1),
  receivedDate:    z.string().datetime().optional(),
  notes:           z.string().optional(),
  items:           z.array(itemSchema).min(1, "At least one item is required"),
});

export async function GET(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const page            = searchParams.get("page");
  const limit           = searchParams.get("limit");
  const purchaseOrderId = searchParams.get("purchaseOrderId");

  const where: any = {};
  if (purchaseOrderId) where.purchaseOrderId = purchaseOrderId;

  const { skip, take, page: p, limit: l } = paginate(page, limit);
  const [data, total] = await Promise.all([
    db.gRN.findMany({ where, skip, take, include: grnInclude, orderBy: { createdAt: "desc" } }),
    db.gRN.count({ where }),
  ]);

  return ok(paginatedResponse(data, total, p, l));
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  let body: unknown;
  try { body = await req.json(); } catch { return err("Invalid JSON"); }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.errors[0].message);

  const { purchaseOrderId, receivedDate, notes, items } = parsed.data;

  // Verify PO exists
  const po = await db.purchaseOrder.findFirst({
    where: { id: purchaseOrderId, deletedAt: null },
    include: { items: true },
  });
  if (!po) return err("Purchase order not found", 404);

  const grnCount = await db.gRN.count();
  const number   = generateInvoiceNumber("GRN", grnCount + 1);

  const grn = await db.$transaction(async (tx) => {
    // 1. Create GRN
    const grn = await tx.gRN.create({
      data: {
        number,
        purchaseOrderId,
        receivedDate: receivedDate ? new Date(receivedDate) : new Date(),
        notes,
      },
    });

    // 2. Create GRNItems + update stock + create InventoryTransactions
    for (const item of items) {
      await tx.gRNItem.create({
        data: {
          grnId:       grn.id,
          productId:   item.productId,
          qtyReceived: item.qtyReceived,
          qtyRejected: item.qtyRejected,
          notes:       item.notes,
        },
      });

      // 3. Update product stock
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product) throw new Error(`Product ${item.productId} not found`);
      const newStock = (product.stockQty ?? 0) + item.qtyReceived;

      await tx.product.update({
        where: { id: item.productId },
        data:  { stockQty: newStock },
      });

      // 4. InventoryTransaction
      await tx.inventoryTransaction.create({
        data: {
          type:          "PURCHASE_IN",
          productId:     item.productId,
          qty:           item.qtyReceived,
          balance:       newStock,
          referenceId:   grn.id,
          referenceType: "GRN",
        },
      });

      // 5. Update PurchaseItem.received
      const poItem = po.items.find((pi) => pi.productId === item.productId);
      if (poItem) {
        await tx.purchaseItem.update({
          where: { id: poItem.id },
          data:  { received: { increment: item.qtyReceived } },
        });
      }
    }

    // 6. Determine PO status
    const updatedItems = await tx.purchaseItem.findMany({ where: { purchaseOrderId } });
    const allReceived  = updatedItems.every((pi) => pi.received >= pi.qty);
    await tx.purchaseOrder.update({
      where: { id: purchaseOrderId },
      data:  { status: allReceived ? "RECEIVED" : "PARTIAL" },
    });

    return grn;
  });

  await logAction(user.id, "CREATE", "GRN", grn.id, null, { number, purchaseOrderId });

  const full = await db.gRN.findUnique({ where: { id: grn.id }, include: grnInclude });
  return ok(full, 201);
}
