export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, requireAuth } from "@/lib/api";

export async function GET(req: NextRequest) {
  const { response } = await requireAuth(req);
  if (response) return response;
  const departments = await db.department.findMany({ orderBy: { name: "asc" } });
  return ok(departments);
}
