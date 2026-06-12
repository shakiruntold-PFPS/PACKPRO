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

  const yr     = new Date().getFullYear().toString().slice(-2);
  const mo     = String(new Date().getMonth() + 1).padStart(2, "0");
  const cnt    = await db.purchaseOrder.count();
  const number = `PO-${yr}${mo}-${String(cnt + 1).padStart(3, "0")}`;

  const po = await db.purchaseOrder.create({
    data: {
      number,
      vendorId:     body.vendorId,
      status:       body.status ?? "DRAFT",
      expectedDate: body.expectedDate ? new Date(body.expectedDate) : undefined,
      subtotal:     body.subtotal ?? 0,
      taxAmount:    body.taxAmount ?? 0,
      total:        body.total ?? 0,
      notes:        body.notes,
    },
  });

  await logAction(user!.id, "CREATE", "PURCHASE_ORDER", po.id, null, po);
  return ok(po, 201);
}
