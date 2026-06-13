export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { token, password } = await req.json().catch(() => ({}));

  if (!token || typeof token !== "string") return err("Token is required");
  if (!password || typeof password !== "string" || password.length < 8) {
    return err("Password must be at least 8 characters");
  }

  const resetToken = await db.passwordResetToken.findUnique({
    where: { token },
    include: { user: { select: { id: true, isActive: true } } },
  });

  if (!resetToken) return err("Invalid or expired reset link", 400);
  if (resetToken.used) return err("This reset link has already been used", 400);
  if (resetToken.expiresAt < new Date()) return err("Reset link has expired", 400);
  if (!resetToken.user.isActive) return err("Account is inactive", 400);

  const passwordHash = await bcrypt.hash(password, 12);

  await db.$transaction([
    db.user.update({
      where: { id: resetToken.user.id },
      data: { passwordHash },
    }),
    db.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    }),
  ]);

  return ok({ message: "Password updated successfully. You can now log in." });
}
