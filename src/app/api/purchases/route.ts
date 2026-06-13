export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, requireAuth, paginate, paginatedResponse, logAction } from "@/lib/api";

export async function GET(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const page   = Number(searchParams.get("page")  ?? 1);
  const limit  = Number(searchParams.get("limit") ?? 20);
  const status = searchParams.get("status") ?? "";
  const search = searchParams.get("search") ?? "";

  const where: any = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { number: { contains: search, mode: "insensitive" } },
      { vendor: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const { skip, take } = paginate(page, limit);
  const [data, total] = await Promise.all([
    db.purchaseOrder.findMany({
      where,
      skip,
      take,
      include: {
        vendor: { select: { id: true, name: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.purchaseOrder.count({ where }),
  ]);

  return ok(paginatedResponse(data, total, page, limit));
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  const body = await req.json();
  if (!body.vendorId) return err("vendorId is required");

  // ── Normalise items ────────────────────────────────────────────────────────
  type ItemInput = {
    productId: string;
    qty: number;
    unit?: string;
    unitPrice: number;
    discount?: number;
    gstRate?: number;
  };

  const rawItems: ItemInput[] = Array.isArray(body.items) ? body.items : [];

  if (rawItems.length === 0 && !body.subtotal) {
    // Allow header-only creation (backward compat) but items are preferred
  }

  type ComputedItem = {
    productId: string;
    qty: number;
    unit: string;
    unitPrice: number;
    gstRate: number;
    gstAmount: number;
    total: number;
  };

  const computedItems: ComputedItem[] = rawItems.map((i) => {
    const qty       = i.qty;
    const unitPrice = i.unitPrice;
    const discount  = i.discount ?? 0;
    const gstRate   = i.gstRate ?? 18;
    const taxable   = qty * unitPrice - discount;
    const gstAmount = taxable * gstRate / 100;
    const total     = taxable + gstAmount;
    return {
      productId: i.productId,
      qty,
      unit:      i.unit ?? "pcs",
      unitPrice,
      gstRate,
      gstAmount,
      total,
    };
  });

  // ── Derive PO totals from items (or fall back to body fields) ─────────────
  const derivedSubtotal = computedItems.length
    ? computedItems.reduce((s, i) => s + i.qty * i.unitPrice, 0)
    : (body.subtotal ?? 0);
  const derivedTax = computedItems.length
    ? computedItems.reduce((s, i) => s + i.gstAmount, 0)
    : (body.taxAmount ?? 0);
  const derivedTotal = computedItems.length
    ? computedItems.reduce((s, i) => s + i.total, 0)
    : (body.total ?? 0);

  // ── Generate PO number ─────────────────────────────────────────────────────
  const yr     = new Date().getFullYear().toString().slice(-2);
  const mo     = String(new Date().getMonth() + 1).padStart(2, "0");
  const cnt    = await db.purchaseOrder.count();
  const number = `PO-${yr}${mo}-${String(cnt + 1).padStart(3, "0")}`;

  const status = (body.status ?? "DRAFT") as import("@prisma/client").PurchaseOrderStatus;

  // ── Create PO with nested items ────────────────────────────────────────────
  const po = await db.purchaseOrder.create({
    data: {
      number,
      vendorId:     body.vendorId,
      status,
      expectedDate: body.expectedDate ? new Date(body.expectedDate) : undefined,
      subtotal:     derivedSubtotal,
      taxAmount:    derivedTax,
      total:        derivedTotal,
      notes:        body.notes,
      ...(computedItems.length > 0
        ? {
            items: {
              create: computedItems,
            },
          }
        : {}),
    },
    include: { items: true, vendor: true },
  });

  // ── If status is RECEIVED on creation, trigger inventory update ────────────
  if (status === "RECEIVED" && po.items.length > 0) {
    await db.$transaction(async (tx) => {
      for (const item of po.items) {
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
            referenceId: po.id,
            referenceType: "PURCHASE_ORDER",
            notes: `Received from PO ${po.number}`,
          },
        });
      }
    });
  }

  await logAction(user!.id, "CREATE", "PURCHASE_ORDER", po.id, null, po);
  return ok(po, 201);
}
