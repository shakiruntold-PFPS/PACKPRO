export const runtime = "nodejs";
// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, err } from "@/lib/api";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return err("No file provided");
  if (!ALLOWED_TYPES.includes(file.type)) return err("File type not allowed");
  if (file.size > MAX_SIZE) return err("File too large (max 10MB)");

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Create upload dir
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  // Unique filename
  const ext = path.extname(file.name);
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
  const filepath = path.join(uploadDir, filename);

  await writeFile(filepath, buffer);

  const url = `/uploads/${filename}`;

  return NextResponse.json({
    success: true,
    data: {
      url,
      filename,
      originalName: file.name,
      size: file.size,
      type: file.type,
    },
  });
}
