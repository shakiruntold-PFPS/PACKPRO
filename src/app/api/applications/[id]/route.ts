export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, requireAuth } from "@/lib/api";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAuth(req);
  if (response) return response;
  void user;

  const { id } = await params;
  const application = await db.jobApplication.findUnique({ where: { id } });
  if (!application) return err("Application not found", 404);

  const body = await req.json().catch(() => ({}));
  const { status } = body;
  const VALID = ["NEW", "REVIEWED", "SHORTLISTED", "REJECTED"];
  if (!status || !VALID.includes(status)) return err("Invalid status");

  const updated = await db.jobApplication.update({
    where: { id },
    data: { status },
  });

  return ok(updated);
}
