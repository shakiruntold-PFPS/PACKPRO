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
      { salesOrder: { party: { name: { contains: search, mode: "insensitive" } } } },
    ];
  }

  const { skip, take } = paginate(page, limit);
  const [data, total] = await Promise.all([
    db.dispatch.findMany({
      where,
      skip,
      take,
      include: {
        salesOrder: {
          select: {
            number: true,
            party: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.dispatch.count({ where }),
  ]);

  return ok(paginatedResponse(data, total, page, limit));
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  const body = await req.json();
  if (!body.salesOrderId) return err("salesOrderId is required");

  const yr     = new Date().getFullYear().toString().slice(-2);
  const mo     = String(new Date().getMonth() + 1).padStart(2, "0");
  const cnt    = await db.dispatch.count();
  const number = `DSP-${yr}${mo}-${String(cnt + 1).padStart(3, "0")}`;

  const dispatch = await db.dispatch.create({
    data: {
      number,
      salesOrderId: body.salesOrderId,
      status:       body.status ?? "READY",
      transporter:  body.transporter,
      vehicleNo:    body.vehicleNo,
      lrNumber:     body.lrNumber,
      notes:        body.notes,
    },
  });

  await logAction(user!.id, "CREATE", "DISPATCH", dispatch.id, null, dispatch);
  return ok(dispatch, 201);
}
