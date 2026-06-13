export const runtime = "nodejs";
// src/app/api/upload/route.ts
// Handles file uploads for: product images, invoice PDFs, party documents,
// employee documents, and general attachments.
//
// In production: files go to Cloudflare R2 (or any S3-compatible store).
// In development: files go to /public/uploads on the local filesystem.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, err } from "@/lib/api";
import { uploadFile, ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from "@/lib/storage";

// Folder routing: organise uploads by category so storage stays clean
const FOLDER_MAP: Record<string, string> = {
  product:  "products",
  invoice:  "invoices",
  document: "documents",
  employee: "employees",
  logo:     "branding",
  stamp:    "branding",
};

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return err("Invalid form data");
  }

  const file   = formData.get("file")   as File | null;
  const folder = (formData.get("folder") as string | null) ?? "uploads";

  if (!file) return err("No file provided");
  if (!(file instanceof File)) return err("Invalid file field");

  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return err(
      `File type '${file.type}' is not allowed. ` +
      "Accepted: images (JPEG, PNG, WebP), PDF, XLSX, DOCX, CSV."
    );
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return err(`File exceeds the 20 MB limit (received ${(file.size / 1024 / 1024).toFixed(1)} MB)`);
  }

  // Validate file name length to prevent path traversal edge cases
  if (file.name.length > 255) {
    return err("File name too long (max 255 characters)");
  }

  const resolvedFolder = FOLDER_MAP[folder] ?? "uploads";

  const bytes  = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const result = await uploadFile(buffer, file.name, file.type, resolvedFolder);

  return NextResponse.json({ success: true, data: result }, { status: 201 });
}
