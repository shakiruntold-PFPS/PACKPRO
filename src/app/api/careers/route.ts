export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, created, requireAuth } from "@/lib/api";
import { sanitizeText } from "@/lib/sanitize";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const isAdmin = searchParams.get("admin") === "true";

  if (isAdmin) {
    const { user, response } = await requireAuth(req);
    if (response) return response;
    void user;
    const careers = await db.career.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { applications: true } } },
    });
    return ok(careers);
  }

  const careers = await db.career.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, title: true, department: true, location: true,
      type: true, salary: true, status: true, createdAt: true,
    },
  });
  return ok(careers);
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (response) return response;
  if (!["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(user.role)) {
    return err("Forbidden", 403);
  }

  const body = await req.json().catch(() => ({}));
  const { title, department, location, type, description, requirements, salary, status } = body;

  if (!title || !department || !description) return err("title, department and description are required");

  const career = await db.career.create({
    data: {
      title: sanitizeText(title),
      department: sanitizeText(department),
      location: location ? sanitizeText(location) : "Alwar, Rajasthan",
      type: sanitizeText(type || "FULL_TIME"),
      description: sanitizeText(description),
      requirements: requirements ? sanitizeText(requirements) : null,
      salary: salary ? sanitizeText(salary) : null,
      status: status || "OPEN",
    },
  });

  return created(career);
}
