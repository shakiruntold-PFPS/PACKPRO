export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, err, requireAuth, paginate, paginatedResponse, logAction, generateInvoiceNumber } from "@/lib/api";

const billInclude = {
  purchaseOrder: { include: { vendor: true } },
};

const createSchema = z.object({
  purchaseOrderId: z.string().optional(),
  vendorBillNo:    z.string().min(1),
  billDate:        z.string().datetime(),
  dueDate:         z.string().datetime(),
  subtotal:        z.number().min(0).default(0),
  taxAmount:       z.number().min(0).default(0),
  total:           z.number().positive(),
  notes:           z.string().optional(),
});

export async function GET(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const page            = searchParams.get("page");
  const limit           = searchParams.get("limit");
  const purchaseOrderId = searchParams.get("purchaseOrderId");
  const status          = searchParams.get("status");

  const where: any = {};
  if (purchaseOrderId) where.purchaseOrderId = purchaseOrderId;
  if (status)          where.status          = status;

  const { skip, take, page: p, limit: l } = paginate(page, limit);
  const [data, total] = await Promise.all([
    db.purchaseBill.findMany({ where, skip, take, include: billInclude, orderBy: { createdAt: "desc" } }),
    db.purchaseBill.count({ where }),
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

  const { purchaseOrderId, vendorBillNo, billDate, dueDate, subtotal, taxAmount, total, notes } = parsed.data;

  if (purchaseOrderId) {
    const po = await db.purchaseOrder.findFirst({ where: { id: purchaseOrderId, deletedAt: null } });
    if (!po) return err("Purchase order not found", 404);
  }

  const billCount = await db.purchaseBill.count();
  const number    = generateInvoiceNumber("BILL", billCount + 1);

  const bill = await db.purchaseBill.create({
    data: {
      number,
      purchaseOrderId: purchaseOrderId ?? undefined,
      vendorBillNo,
      billDate:  new Date(billDate),
      dueDate:   new Date(dueDate),
      subtotal:  subtotal ?? 0,
      taxAmount: taxAmount ?? 0,
      total,
      notes,
    },
    include: billInclude,
  });

  await logAction(user.id, "CREATE", "PurchaseBill", bill.id, null, { number, vendorBillNo, total });

  return ok(bill, 201);
}
