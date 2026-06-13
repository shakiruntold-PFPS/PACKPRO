export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, requireAuth } from "@/lib/api";

export async function GET(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get("unread") === "true";

  const where: any = { userId: user!.id };
  if (unreadOnly) where.read = false;

  const [notifications, unreadCount] = await Promise.all([
    db.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.notification.count({ where: { userId: user!.id, read: false } }),
  ]);

  return ok({ notifications, unreadCount });
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  const body = await req.json().catch(() => ({}));
  const { type, title, message, link, targetUserId } = body;

  if (!type || !title || !message) return err("type, title, and message are required");

  const userId = targetUserId ?? user!.id;

  const notification = await db.notification.create({
    data: { userId, type, title, message, link },
  });

  return ok(notification, 201);
}
