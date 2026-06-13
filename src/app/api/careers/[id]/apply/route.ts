export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, created } from "@/lib/api";
import { sanitizeText } from "@/lib/sanitize";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const career = await db.career.findUnique({ where: { id } });
  if (!career) return err("Career not found", 404);
  if (career.status !== "OPEN") return err("This position is no longer accepting applications", 400);

  const body = await req.json().catch(() => ({}));
  const { name, email, phone, resumeUrl, coverLetter } = body;

  if (!name || !email || !phone) return err("name, email and phone are required");

  const application = await db.jobApplication.create({
    data: {
      careerId: id,
      name: sanitizeText(name),
      email: sanitizeText(email),
      phone: sanitizeText(phone),
      resumeUrl: resumeUrl ? sanitizeText(resumeUrl) : null,
      coverLetter: coverLetter ? sanitizeText(coverLetter) : null,
    },
  });

  // Also create a CRM Lead
  await db.lead.create({
    data: {
      title: `Job Application: ${career.title}`,
      contactName: sanitizeText(name),
      phone: sanitizeText(phone),
      email: sanitizeText(email),
      source: "WEBSITE",
      status: "NEW",
      priority: "MEDIUM",
      notes: `Applied for: ${career.title}\n${coverLetter ? sanitizeText(coverLetter) : ""}`,
    },
  });

  return created({ message: "Application submitted successfully!", application });
}
