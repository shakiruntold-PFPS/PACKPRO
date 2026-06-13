import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, requireRole } from "@/lib/api";
import { sanitizeText } from "@/lib/sanitize";
import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user: actor, response } = await requireRole(req, ["ADMIN"]);
  if (response) return response;

  const { id } = await params;
  const body = await req.json().catch(() => ({})) as Record<string, unknown>;

  const update: {
    name?: string;
    role?: UserRole;
    isActive?: boolean;
    passwordHash?: string;
  } = {};

  if (typeof body.name === "string") update.name = sanitizeText(body.name);
  if (typeof body.role === "string" && body.role in UserRole) update.role = body.role as UserRole;
  if (typeof body.isActive === "boolean") update.isActive = body.isActive;
  if (typeof body.password === "string" && body.password.length >= 8) {
    update.passwordHash = await bcrypt.hash(body.password, 12);
  }

  if (Object.keys(update).length === 0) return err("No valid fields to update");

  // Prevent an admin from downgrading another SUPER_ADMIN (only SUPER_ADMIN can do that)
  if (actor.role !== "SUPER_ADMIN") {
    const target = await db.user.findUnique({ where: { id }, select: { role: true } });
    if (target?.role === "SUPER_ADMIN") return err("Cannot modify a SUPER_ADMIN account", 403);
  }

  const updated = await db.user.update({
    where: { id },
    data: update,
    select: { id: true, name: true, email: true, role: true, isActive: true },
  }).catch(() => null);

  if (!updated) return err("User not found", 404);
  return ok(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user: actor, response } = await requireRole(req, ["ADMIN"]);
  if (response) return response;

  const { id } = await params;

  // Prevent self-deactivation and SUPER_ADMIN deactivation by non-super-admins
  if (actor.id === id) return err("Cannot deactivate your own account", 400);
  if (actor.role !== "SUPER_ADMIN") {
    const target = await db.user.findUnique({ where: { id }, select: { role: true } });
    if (target?.role === "SUPER_ADMIN") return err("Cannot deactivate a SUPER_ADMIN account", 403);
  }

  await db.user.update({ where: { id }, data: { isActive: false } });
  return ok({ message: "User deactivated" });
}
