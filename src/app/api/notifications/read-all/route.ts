export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, requireAuth } from "@/lib/api";

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  await db.notification.updateMany({
    where: { userId: user!.id, read: false },
    data: { read: true },
  });

  return ok({ message: "All notifications marked as read" });
}
