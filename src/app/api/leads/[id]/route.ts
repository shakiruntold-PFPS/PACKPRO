export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, requireAuth, logAction } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const lead = await db.lead.findUnique({
    where: { id },
    include: {
      assignedTo: { select: { id: true, name: true } },
      party: true,
      activities: { orderBy: { createdAt: "desc" }, include: { user: { select: { name: true, avatar: true } } } },
      tasks: { orderBy: { dueDate: "asc" } },
      quotes: { select: { id: true, number: true, total: true, status: true } },
    },
  });
  if (!lead) return err("Lead not found", 404);
  return ok(lead);
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { user, response } = await requireAuth(req);
  if (response) return response;
  const { id } = await params;
  const body = await req.json();
  const old = await db.lead.findUnique({ where: { id } });
  if (!old) return err("Lead not found", 404);
  const updated = await db.lead.update({ where: { id }, data: body });
  if (body.status && body.status !== old.status) {
    await db.activity.create({
      data: {
        type: "STATUS_CHANGE",
        subject: `Status changed: ${old.status} → ${body.status}`,
        userId: user!.id,
        leadId: id,
      },
    });
  }
  await logAction(user!.id, "UPDATE", "LEAD", id, old, updated);
  return ok(updated);
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { user, response } = await requireAuth(req);
  if (response) return response;
  const { id } = await params;
  await db.lead.delete({ where: { id } });
  await logAction(user!.id, "DELETE", "LEAD", id);
  return ok({ message: "Lead deleted" });
}
