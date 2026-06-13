import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, requireAuth } from "@/lib/api";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAuth(req);
  if (response) return response;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { name, role, isActive, password } = body;

  const update: any = {};
  if (name !== undefined) update.name = name;
  if (role !== undefined) update.role = role;
  if (isActive !== undefined) update.isActive = isActive;
  if (password) update.passwordHash = await bcrypt.hash(password, 12);

  const user = await db.user.update({
    where: { id },
    data: update,
    select: { id: true, name: true, email: true, role: true, isActive: true },
  }).catch(() => null);

  if (!user) return err("User not found", 404);
  return ok(user);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAuth(req);
  if (response) return response;

  const { id } = await params;
  await db.user.update({ where: { id }, data: { isActive: false } });
  return ok({ message: "User deactivated" });
}
