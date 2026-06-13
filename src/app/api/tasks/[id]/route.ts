export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, err, requireAuth, logAction } from "@/lib/api";

const taskInclude = {
  assignedTo: { select: { name: true } },
  lead: { select: { title: true } },
};

const updateSchema = z.object({
  title:        z.string().min(1).optional(),
  description:  z.string().optional(),
  dueDate:      z.string().datetime().optional().nullable(),
  priority:     z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  status:       z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  assignedToId: z.string().min(1).optional(),
  leadId:       z.string().optional().nullable(),
  completedAt:  z.string().datetime().optional().nullable(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const task = await db.task.findUnique({ where: { id }, include: taskInclude });
  if (!task) return err("Task not found", 404);
  return ok(task);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  const { id } = await params;
  const existing = await db.task.findUnique({ where: { id } });
  if (!existing) return err("Task not found", 404);

  let body: unknown;
  try { body = await req.json(); } catch { return err("Invalid JSON"); }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.errors[0].message);

  const { dueDate, completedAt, ...rest } = parsed.data;

  const data: any = { ...rest };
  if (dueDate !== undefined)     data.dueDate     = dueDate ? new Date(dueDate) : null;
  if (completedAt !== undefined) data.completedAt = completedAt ? new Date(completedAt) : null;

  // Auto-set completedAt when status flips to COMPLETED
  if (data.status === "COMPLETED" && !existing.completedAt && data.completedAt === undefined) {
    data.completedAt = new Date();
  }

  const updated = await db.task.update({ where: { id }, data, include: taskInclude });

  await logAction(user.id, "UPDATE", "Task", id, existing as any, data);

  return ok(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  const { id } = await params;
  const existing = await db.task.findUnique({ where: { id } });
  if (!existing) return err("Task not found", 404);

  await db.task.delete({ where: { id } });
  await logAction(user.id, "DELETE", "Task", id);

  return ok({ deleted: true });
}
