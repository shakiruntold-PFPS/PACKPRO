export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, created, requireAuth } from "@/lib/api";

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  const body = await req.json().catch(() => ({}));
  const { type, subject, notes, leadId, partyId } = body;

  if (!type || !subject) return err("type and subject required");

  const activity = await db.activity.create({
    data: {
      type: type as any,
      subject,
      notes: notes ?? null,
      userId: user!.id,
      leadId: leadId ?? null,
      partyId: partyId ?? null,
    },
    include: { user: { select: { name: true, avatar: true } } },
  });

  return created(activity);
}

export async function GET(req: NextRequest) {
  const { response } = await requireAuth(req);
  if (response) return response;

  const sp = req.nextUrl.searchParams;
  const leadId = sp.get("leadId");
  const partyId = sp.get("partyId");

  const where: any = {};
  if (leadId) where.leadId = leadId;
  if (partyId) where.partyId = partyId;

  const activities = await db.activity.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { user: { select: { name: true } } },
  });

  return ok(activities);
}
