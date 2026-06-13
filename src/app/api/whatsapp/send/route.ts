export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, requireAuth } from "@/lib/api";

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  const body = await req.json().catch(() => ({}));
  const { phone: rawPhone, message, type, leadId } = body;

  if (!rawPhone) return err("phone is required");
  if (!message) return err("message is required");

  // Strip non-digits
  const digits = String(rawPhone).replace(/\D/g, "");

  // Validate: after stripping, must be 10 digits (or 12 with country code 91)
  let normalised = digits;
  if (digits.length === 10) {
    normalised = "91" + digits;
  } else if (digits.length === 12 && digits.startsWith("91")) {
    normalised = digits;
  } else if (digits.length === 11 && digits.startsWith("0")) {
    normalised = "91" + digits.slice(1);
  } else {
    return err("Invalid phone number — must be a 10-digit Indian mobile number");
  }

  const waUrl = `https://wa.me/${normalised}?text=${encodeURIComponent(message)}`;

  // Log as Activity if leadId provided
  if (leadId) {
    try {
      await db.activity.create({
        data: {
          type: "WHATSAPP",
          subject: "WhatsApp message sent",
          notes: message,
          leadId,
          userId: user!.id,
        },
      });
    } catch {
      // Non-fatal — don't fail the response if activity logging fails
    }
  }

  return ok({ waUrl, phone: normalised, message, type: type ?? "custom" });
}
