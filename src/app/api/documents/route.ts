export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, requireAuth } from "@/lib/api";

export async function GET(req: NextRequest) {
  const { response } = await requireAuth(req);
  if (response) return response;

  const sp = req.nextUrl.searchParams;
  const search = sp.get("search") ?? "";
  const type = sp.get("type") ?? "";

  const where: any = {};
  if (type) where.type = type;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { tags: { has: search.toLowerCase() } },
    ];
  }

  const docs = await db.document.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { party: { select: { name: true } } },
  });

  return ok(docs);
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  const body = await req.json().catch(() => ({}));
  const { name, type, url, size, mimeType, partyId, tags, notes } = body;

  if (!name || !type || !url) return err("name, type and url are required");

  const doc = await db.document.create({
    data: {
      name,
      type,
      url,
      size: size ?? null,
      mimeType: mimeType ?? null,
      partyId: partyId || null,
      tags: tags ?? [],
      notes: notes ?? null,
      uploadedBy: (user as any)?.name ?? "System",
    },
  });

  return ok(doc, 201);
}

export async function DELETE(req: NextRequest) {
  const { response } = await requireAuth(req);
  if (response) return response;

  const sp = req.nextUrl.searchParams;
  const id = sp.get("id");
  if (!id) return err("id required");

  await db.document.delete({ where: { id } }).catch(() => {});
  return ok({ deleted: true });
}
