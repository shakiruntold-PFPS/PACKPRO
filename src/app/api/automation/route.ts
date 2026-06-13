export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, requireRole } from "@/lib/api";

export async function GET(req: NextRequest) {
  const { user, response } = await requireRole(req, ["ADMIN"]);
  if (response) return response;

  const rules = await db.automationRule.findMany({
    orderBy: { createdAt: "desc" },
  });

  return ok(rules);
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireRole(req, ["ADMIN"]);
  if (response) return response;

  const body = await req.json().catch(() => ({}));
  const { name, description, trigger, conditions, actions, isActive } = body;

  if (!name || !trigger || !actions) {
    return err("name, trigger, and actions are required");
  }

  if (!Array.isArray(actions) || actions.length === 0) {
    return err("actions must be a non-empty array");
  }

  const rule = await db.automationRule.create({
    data: {
      name,
      description: description ?? null,
      trigger,
      conditions: conditions ?? null,
      actions,
      isActive: isActive ?? true,
      createdBy: user!.id,
    },
  });

  return ok(rule, 201);
}
