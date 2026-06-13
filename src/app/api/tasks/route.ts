export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, err, requireAuth, paginate, paginatedResponse, logAction } from "@/lib/api";

const taskInclude = {
  assignedTo: { select: { name: true } },
  lead: { select: { title: true } },
};

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  assignedToId: z.string().min(1),
  leadId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const page  = searchParams.get("page");
  const limit = searchParams.get("limit");
  const leadId       = searchParams.get("leadId");
  const assignedToId = searchParams.get("assignedToId");
  const status       = searchParams.get("status");
  const dueDate      = searchParams.get("dueDate");

  const where: any = {};
  if (leadId)       where.leadId       = leadId;
  if (assignedToId) where.assignedToId = assignedToId;
  if (status)       where.status       = status;
  if (dueDate === "today") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    where.dueDate = { gte: start, lte: end };
  }

  const { skip, take, page: p, limit: l } = paginate(page, limit);
  const [data, total] = await Promise.all([
    db.task.findMany({ where, skip, take, include: taskInclude, orderBy: { createdAt: "desc" } }),
    db.task.count({ where }),
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

  const { title, description, dueDate, priority, status, assignedToId, leadId } = parsed.data;

  const task = await db.task.create({
    data: {
      title,
      description,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      priority: priority as any,
      status:   status   as any,
      assignedToId,
      leadId,
    },
    include: taskInclude,
  });

  await logAction(user.id, "CREATE", "Task", task.id, null, { title });

  return ok(task, 201);
}
