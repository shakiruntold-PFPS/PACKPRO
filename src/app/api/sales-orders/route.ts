export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, requireAuth, paginate, paginatedResponse, logAction } from "@/lib/api";

export async function GET(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const page   = Number(searchParams.get("page")   ?? 1);
  const limit  = Number(searchParams.get("limit")  ?? 20);
  const status = searchParams.get("status") ?? "";
  const search = searchParams.get("search") ?? "";

  const where: any = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { number: { contains: search, mode: "insensitive" } },
      { party: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const { skip, take } = paginate(page, limit);
  const [data, total] = await Promise.all([
    db.salesOrder.findMany({
      where,
      skip,
      take,
      include: {
        party: { select: { id: true, name: true } },
        quote: { select: { number: true } },
        createdBy: { select: { name: true } },
        _count: { select: { items: true, dispatches: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.salesOrder.count({ where }),
  ]);

  return ok(paginatedResponse(data, total, page, limit));
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  const body = await req.json();
  if (!body.partyId) return err("partyId is required");

  const yr  = new Date().getFullYear().toString().slice(-2);
  const mo  = String(new Date().getMonth() + 1).padStart(2, "0");
  const cnt = await db.salesOrder.count();
  const number = `SO-${yr}${mo}-${String(cnt + 1).padStart(3, "0")}`;

  const order = await db.salesOrder.create({
    data: {
      number,
      partyId:     body.partyId,
      quoteId:     body.quoteId,
      createdById: user!.id,
      status:      body.status ?? "CONFIRMED",
      deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : undefined,
      deliveryAddr: body.deliveryAddr,
      subtotal:    body.subtotal ?? 0,
      taxAmount:   body.taxAmount ?? 0,
      total:       body.total ?? 0,
      notes:       body.notes,
    },
  });

  await logAction(user!.id, "CREATE", "SALES_ORDER", order.id, null, order);
  return ok(order, 201);
}
