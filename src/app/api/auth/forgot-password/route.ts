export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { randomBytes } from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const { email } = await req.json().catch(() => ({}));
  if (!email || typeof email !== "string") return err("Email is required");

  const user = await db.user.findFirst({
    where: { email: email.toLowerCase().trim(), isActive: true },
    select: { id: true, name: true, email: true },
  });

  // Always return success to prevent email enumeration
  if (!user) return ok({ message: "If that email is registered, a reset link has been sent." });

  // Invalidate existing tokens
  await db.passwordResetToken.updateMany({
    where: { userId: user.id, used: false },
    data: { used: true },
  });

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.passwordResetToken.create({
    data: { userId: user.id, token, expiresAt },
  });

  const resetUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/reset-password?token=${token}`;

  // Send email (non-fatal if it fails)
  await sendPasswordResetEmail(user.email, user.name, resetUrl).catch(() => null);

  return ok({ message: "If that email is registered, a reset link has been sent." });
}
