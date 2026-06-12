export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, requireAuth, logAction } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const quote = await db.quote.findUnique({
    where: { id },
    include: {
      party: true,
      createdBy: { select: { id: true, name: true } },
      items: { include: { product: { select: { id: true, name: true, code: true, unit: true } } } },
      salesOrders: { select: { id: true, number: true, status: true } },
    },
  });
  if (!quote) return err("Quote not found", 404);
  return ok(quote);
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { user, response } = await requireAuth(req);
  if (response) return response;
  const { id } = await params;
  const body = await req.json();
  const old = await db.quote.findUnique({ where: { id } });
  if (!old) return err("Quote not found", 404);
  const data: any = { ...body };
  if (body.status === "APPROVED" && old.status !== "APPROVED") {
    data.approvedById = user!.id;
    data.approvedAt = new Date();
  }
  if (body.status === "REJECTED" && old.status !== "REJECTED") {
    data.rejectedAt = new Date();
  }
  const updated = await db.quote.update({ where: { id }, data });
  await logAction(user!.id, "UPDATE", "QUOTE", id, { status: old.status }, { status: data.status });
  return ok(updated);
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { user, response } = await requireAuth(req);
  if (response) return response;
  const { id } = await params;
  const { action } = await req.json();
  if (action !== "convert") return err("Unknown action");
  const quote = await db.quote.findUnique({ where: { id }, include: { items: true } });
  if (!quote) return err("Quote not found", 404);
  if (quote.status !== "APPROVED") return err("Quote must be approved before converting");
  const settings = await db.companySettings.findUnique({ where: { id: "default" } });
  const yr = new Date().getFullYear().toString().slice(-2);
  const mo = String(new Date().getMonth() + 1).padStart(2, "0");
  const soNumber = `SO-${yr}${mo}-${String(settings?.invoiceCounter ?? 1).padStart(3, "0")}`;
  const order = await db.salesOrder.create({
    data: {
      number: soNumber,
      partyId: quote.partyId,
      quoteId: quote.id,
      createdById: user!.id,
      status: "CONFIRMED",
      subtotal: quote.subtotal,
      taxAmount: quote.taxAmount,
      total: quote.total,
      items: {
        create: quote.items.map((i: any) => ({
          productId: i.productId,
          qty: i.qty,
          unit: i.unit,
          unitPrice: i.unitPrice,
          gstRate: i.gstRate,
          gstAmount: i.gstAmount,
          total: i.total,
        })),
      },
    },
  });
  await db.quote.update({ where: { id }, data: { status: "CONVERTED" } });
  await db.companySettings.update({ where: { id: "default" }, data: { invoiceCounter: { increment: 1 } } });
  await logAction(user!.id, "CONVERT", "QUOTE", id, null, { soNumber });
  return ok(order);
}
