export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, requireRole } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  const { response } = await requireRole(req, ["ADMIN"]);
  if (response) return response;

  const { id } = await params;
  const rule = await db.automationRule.findUnique({ where: { id } });
  if (!rule) return err("Automation rule not found", 404);
  return ok(rule);
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { response } = await requireRole(req, ["ADMIN"]);
  if (response) return response;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const existing = await db.automationRule.findUnique({ where: { id } });
  if (!existing) return err("Automation rule not found", 404);

  const { name, description, trigger, conditions, actions, isActive } = body;

  const rule = await db.automationRule.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(trigger !== undefined && { trigger }),
      ...(conditions !== undefined && { conditions }),
      ...(actions !== undefined && { actions }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  return ok(rule);
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { response } = await requireRole(req, ["ADMIN"]);
  if (response) return response;

  const { id } = await params;
  const existing = await db.automationRule.findUnique({ where: { id } });
  if (!existing) return err("Automation rule not found", 404);

  await db.automationRule.delete({ where: { id } });
  return ok({ deleted: true });
}
