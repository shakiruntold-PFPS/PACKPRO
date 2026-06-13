export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, requireAuth, logAction } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

// ─── GET /api/purchases/[id] ───────────────────────────────────────────────────

export async function GET(req: NextRequest, ctx: Ctx) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  const { id } = await ctx.params;

  const po = await db.purchaseOrder.findUnique({
    where: { id },
    include: {
      vendor: true,
      items: {
        include: { product: { select: { id: true, name: true, code: true, unit: true } } },
      },
    },
  });

  if (!po) return err("Purchase order not found", 404);
  return ok(po);
}

// ─── PUT /api/purchases/[id] ───────────────────────────────────────────────────

export async function PUT(req: NextRequest, ctx: Ctx) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  const { id } = await ctx.params;

  const existing = await db.purchaseOrder.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!existing) return err("Purchase order not found", 404);

  const body = await req.json();
  const oldStatus = existing.status;
  const newStatus = body.status ?? oldStatus;

  // Build update data using only fields that exist in the schema
  const updateData: {
    status?: string;
    expectedDate?: Date;
    subtotal?: number;
    taxAmount?: number;
    total?: number;
    notes?: string;
  } = {};

  if (body.status !== undefined)       updateData.status       = body.status;
  if (body.expectedDate !== undefined) updateData.expectedDate = new Date(body.expectedDate);
  if (body.subtotal !== undefined)     updateData.subtotal     = body.subtotal;
  if (body.taxAmount !== undefined)    updateData.taxAmount    = body.taxAmount;
  if (body.total !== undefined)        updateData.total        = body.total;
  if (body.notes !== undefined)        updateData.notes        = body.notes;

  // RECEIVED transition: update stock + create inventory transactions
  if (newStatus === "RECEIVED" && oldStatus !== "RECEIVED") {
    if (existing.items.length === 0) {
      return err("Cannot mark as RECEIVED: purchase order has no items");
    }

    await db.$transaction(async (tx) => {
      for (const item of existing.items) {
        const prod = await tx.product.findUnique({ where: { id: item.productId } });
        if (!prod) continue;
        const newStock = (prod.stockQty ?? 0) + item.qty;
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQty: newStock },
        });
        await tx.inventoryTransaction.create({
          data: {
            type: "PURCHASE_IN",
            productId: item.productId,
            qty: item.qty,
            balance: newStock,
            referenceId: existing.id,
            referenceType: "PURCHASE_ORDER",
            notes: `Received from PO ${existing.number}`,
          },
        });
      }
      await tx.purchaseOrder.update({
        where: { id: existing.id },
        data: { status: "RECEIVED" },
      });
    });

    const updated = await db.purchaseOrder.findUnique({
      where: { id },
      include: {
        vendor: true,
        items: {
          include: { product: { select: { id: true, name: true, code: true, unit: true } } },
        },
      },
    });

    await logAction(user!.id, "UPDATE", "PURCHASE_ORDER", id, existing, updated);
    return ok(updated);
  }

  // Normal update
  const updated = await db.purchaseOrder.update({
    where: { id },
    data: updateData,
    include: {
      vendor: true,
      items: {
        include: { product: { select: { id: true, name: true, code: true, unit: true } } },
      },
    },
  });

  await logAction(user!.id, "UPDATE", "PURCHASE_ORDER", id, existing, updated);
  return ok(updated);
}

// ─── DELETE /api/purchases/[id] ────────────────────────────────────────────────

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  const { id } = await ctx.params;

  const po = await db.purchaseOrder.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!po) return err("Purchase order not found", 404);

  if (po.status !== "DRAFT") {
    return err(`Cannot delete a purchase order with status "${po.status}". Only DRAFT orders can be deleted.`, 400);
  }

  // Items are cascade-deleted by the schema (onDelete: Cascade on PurchaseItem)
  await db.purchaseOrder.delete({ where: { id } });

  await logAction(user!.id, "DELETE", "PURCHASE_ORDER", id, po, null);
  return ok({ deleted: true, id });
}
