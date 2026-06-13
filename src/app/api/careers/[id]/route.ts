export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, requireAuth } from "@/lib/api";
import { sanitizeText } from "@/lib/sanitize";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const career = await db.career.findUnique({
    where: { id },
    include: { _count: { select: { applications: true } } },
  });
  if (!career) return err("Career not found", 404);
  return ok(career);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAuth(req);
  if (response) return response;
  void user;

  const { id } = await params;
  const career = await db.career.findUnique({ where: { id } });
  if (!career) return err("Career not found", 404);

  const body = await req.json().catch(() => ({}));
  const { title, department, location, type, description, requirements, salary, status } = body;

  const updated = await db.career.update({
    where: { id },
    data: {
      ...(title && { title: sanitizeText(title) }),
      ...(department && { department: sanitizeText(department) }),
      ...(location && { location: sanitizeText(location) }),
      ...(type && { type: sanitizeText(type) }),
      ...(description && { description: sanitizeText(description) }),
      ...(requirements !== undefined && { requirements: requirements ? sanitizeText(requirements) : null }),
      ...(salary !== undefined && { salary: salary ? sanitizeText(salary) : null }),
      ...(status && { status }),
    },
  });

  return ok(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAuth(req);
  if (response) return response;
  if (!["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
    return err("Forbidden", 403);
  }

  const { id } = await params;
  const career = await db.career.findUnique({ where: { id } });
  if (!career) return err("Career not found", 404);

  await db.career.delete({ where: { id } });
  return ok({ message: "Career deleted" });
}
