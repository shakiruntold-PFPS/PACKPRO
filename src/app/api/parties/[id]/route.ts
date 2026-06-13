export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, requireAuth, logAction } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const party = await db.party.findUnique({
    where: { id },
    include: {
      contacts: true,
      leads: { orderBy: { createdAt: "desc" }, take: 5 },
      quotes: { orderBy: { createdAt: "desc" }, take: 5 },
      activities: { orderBy: { createdAt: "desc" }, take: 10, include: { user: { select: { name: true } } } },
      _count: { select: { quotes: true, invoices: true, salesOrders: true } },
    },
  });
  if (!party) return err("Party not found", 404);
  return ok(party);
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { user, response } = await requireAuth(req);
  if (response) return response;
  const { id } = await params;
  const body = await req.json();
  const old = await db.party.findUnique({ where: { id } });
  if (!old) return err("Party not found", 404);
  const updated = await db.party.update({ where: { id }, data: body });
  await logAction(user!.id, "UPDATE", "PARTY", id, old, updated);
  return ok(updated);
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { user, response } = await requireAuth(req);
  if (response) return response;
  const { id } = await params;
  await db.party.update({ where: { id }, data: { isActive: false } });
  await logAction(user!.id, "DEACTIVATE", "PARTY", id);
  return ok({ message: "Party deactivated" });
}
