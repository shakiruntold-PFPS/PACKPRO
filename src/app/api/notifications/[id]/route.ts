export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, requireAuth } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const notification = await db.notification.findFirst({
    where: { id, userId: user!.id },
  });
  if (!notification) return err("Notification not found", 404);

  const updated = await db.notification.update({
    where: { id },
    data: { read: body.read ?? true },
  });

  return ok(updated);
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  const { id } = await params;

  const notification = await db.notification.findFirst({
    where: { id, userId: user!.id },
  });
  if (!notification) return err("Notification not found", 404);

  await db.notification.delete({ where: { id } });
  return ok({ deleted: true });
}
