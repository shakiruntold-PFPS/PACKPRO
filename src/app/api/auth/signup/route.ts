// src/app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { applyRateLimit } from "@/lib/api";
import { sanitizeText } from "@/lib/sanitize";

const SignupSchema = z.object({
  name:     z.string().min(2, "Name must be at least 2 characters").max(100),
  email:    z.string().email("Invalid email address").max(254),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

export async function POST(req: NextRequest) {
  // 10 signup attempts per IP per hour — prevents automated account creation
  const limited = applyRateLimit(req, "signup", 10, 60 * 60 * 1000);
  if (limited) return limited;

  try {
    const body = await req.json();
    const parsed = SignupSchema.safeParse(body);

    if (!parsed.success) {
      const msg = parsed.error.issues.map((e) => e.message).join(", ");
      return NextResponse.json({ success: false, error: msg }, { status: 400 });
    }

    const { name, email, password } = parsed.data;
    const safeName = sanitizeText(name);

    if (!safeName) {
      return NextResponse.json(
        { success: false, error: "Name contains invalid characters" },
        { status: 400 }
      );
    }

    // Normalise email before duplicate check and storage
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await db.user.create({
      data: {
        name: safeName,
        email: normalizedEmail,
        passwordHash,
        role: "SALES",   // default; ADMIN/SUPER_ADMIN can elevate in Settings → Users
        isActive: true,
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    return NextResponse.json({ success: true, data: user }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[signup]", msg);
    return NextResponse.json(
      { success: false, error: "Server error. Please try again." },
      { status: 500 }
    );
  }
}
