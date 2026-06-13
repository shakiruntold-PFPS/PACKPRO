export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { name, phone, email, company, message, productInterest } = body;
  if (!name || !phone || !message) return err("name, phone and message required");

  await db.lead.create({
    data: {
      title: `Website Enquiry: ${(productInterest || message).slice(0, 80)}`,
      contactName: String(name),
      phone: String(phone),
      email: email ? String(email) : null,
      company: company ? String(company) : null,
      notes: String(message),
      source: "WEBSITE",
      priority: "MEDIUM",
      status: "NEW",
    },
  });

  return ok({ message: "Enquiry received. We'll contact you within 24 hours." });
}
