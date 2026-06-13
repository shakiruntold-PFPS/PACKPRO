import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, requireAuth, paginate, paginatedResponse } from "@/lib/api";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { response } = await requireAuth(req);
  if (response) return response;

  const sp = req.nextUrl.searchParams;
  const { skip, limit } = paginate(sp.get("page"), sp.get("limit"));
  const search = sp.get("search") ?? "";

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    db.user.findMany({
      where,
      skip,
      take: limit,
      select: { id: true, name: true, email: true, role: true, isActive: true, lastLogin: true, createdAt: true, avatar: true },
      orderBy: { createdAt: "desc" },
    }),
    db.user.count({ where }),
  ]);

  return ok(paginatedResponse(data, total, skip, limit));
}

export async function POST(req: NextRequest) {
  const { response } = await requireAuth(req);
  if (response) return response;

  const body = await req.json().catch(() => ({}));
  const { name, email, password, role } = body;

  if (!name || !email || !password) return err("name, email and password are required");

  const exists = await db.user.findUnique({ where: { email } });
  if (exists) return err("Email already registered", 409);

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await db.user.create({
    data: { name, email, passwordHash, role: role || "SALES", isActive: true },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
  });

  return ok(user);
}
