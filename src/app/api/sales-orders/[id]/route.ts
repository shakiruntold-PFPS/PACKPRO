import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, requireAuth, logAction } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const order = await db.salesOrder.findUnique({
    where: { id },
    include: {
      party: true,
      quote: { select: { number: true } },
      items: { include: { product: { select: { name: true, code: true } } } },
      dispatches: { select: { id: true, number: true, status: true } },
      invoices: { select: { id: true, number: true, status: true, total: true } },
    },
  });
  if (!order) return err("Sales order not found", 404);
  return ok(order);
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { user, response } = await requireAuth(req);
  if (response) return response;
  const { id } = await params;
  const body = await req.json();
  const old  = await db.salesOrder.findUnique({ where: { id } });
  if (!old) return err("Sales order not found", 404);
  const updated = await db.salesOrder.update({ where: { id }, data: body });
  await logAction(user!.id, "UPDATE", "SALES_ORDER", id, old, updated);
  return ok(updated);
}
