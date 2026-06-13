export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, err, requireAuth, logAction } from "@/lib/api";

const billInclude = {
  purchaseOrder: { include: { vendor: true } },
};

const updateSchema = z.object({
  vendorBillNo: z.string().min(1).optional(),
  billDate:     z.string().datetime().optional(),
  dueDate:      z.string().datetime().optional(),
  subtotal:     z.number().min(0).optional(),
  taxAmount:    z.number().min(0).optional(),
  total:        z.number().positive().optional(),
  amountPaid:   z.number().min(0).optional(),
  status:       z.enum(["PENDING", "PARTIALLY_PAID", "PAID", "CANCELLED"]).optional(),
  notes:        z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const bill = await db.purchaseBill.findUnique({ where: { id }, include: billInclude });
  if (!bill) return err("Purchase bill not found", 404);
  return ok(bill);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  const { id } = await params;
  const existing = await db.purchaseBill.findUnique({ where: { id } });
  if (!existing) return err("Purchase bill not found", 404);

  let body: unknown;
  try { body = await req.json(); } catch { return err("Invalid JSON"); }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.errors[0].message);

  const { billDate, dueDate, amountPaid, status, ...rest } = parsed.data;

  const data: any = { ...rest };
  if (billDate) data.billDate = new Date(billDate);
  if (dueDate)  data.dueDate  = new Date(dueDate);

  // Handle amountPaid and auto-derive status
  if (amountPaid !== undefined) {
    data.amountPaid = amountPaid;
    const effectiveTotal = rest.total ?? existing.total;
    if (amountPaid >= effectiveTotal) {
      data.status = "PAID";
    } else if (amountPaid > 0) {
      data.status = "PARTIALLY_PAID";
    }
  }

  // Allow explicit status override if amountPaid not in payload
  if (status !== undefined && amountPaid === undefined) {
    data.status = status;
  }

  const updated = await db.purchaseBill.update({ where: { id }, data, include: billInclude });

  await logAction(user.id, "UPDATE", "PurchaseBill", id, existing as any, data);

  return ok(updated);
}
