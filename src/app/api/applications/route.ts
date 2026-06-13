export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, requireAuth } from "@/lib/api";

export async function GET(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (response) return response;
  void user;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const applications = await db.jobApplication.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: "desc" },
    include: {
      career: { select: { id: true, title: true, department: true } },
    },
  });

  return ok(applications);
}
