// src/lib/storage.ts
// Cloud storage abstraction — supports Cloudflare R2, AWS S3, and local filesystem.
//
// Priority:
//   1. If STORAGE_PROVIDER=s3 or STORAGE_PROVIDER=r2  → S3-compatible cloud upload
//   2. If running on Vercel (VERCEL=1) with no provider  → reject (no local filesystem)
//   3. Otherwise → local /public/uploads (dev only)
//
// Cloudflare R2 is recommended for production:
//   - S3-compatible API
//   - Zero egress fees
//   - Free tier: 10GB storage, 1M Class A ops/month
//
// Set these environment variables:
//   STORAGE_PROVIDER=r2
//   STORAGE_BUCKET=packpro-assets
//   STORAGE_ENDPOINT=https://<accountId>.r2.cloudflarestorage.com
//   STORAGE_ACCESS_KEY=<R2 Access Key ID>
//   STORAGE_SECRET_KEY=<R2 Secret Access Key>
//   STORAGE_REGION=auto              (R2 always uses "auto")
//   NEXT_PUBLIC_STORAGE_BASE_URL=https://assets.packpro.site   (CDN/public URL)

import { randomBytes } from "crypto";
import path from "path";

export interface UploadResult {
  url: string;       // Public URL for the stored file
  key: string;       // Storage key (path within bucket or filesystem)
  size: number;
  mimeType: string;
  originalName: string;
}

// ─── Allowed types & size limits ──────────────────────────────────────────────

export const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/vnd.ms-excel",
  "text/csv",
]);

export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

// ─── Key generator ────────────────────────────────────────────────────────────

export function generateStorageKey(originalName: string, folder = "uploads"): string {
  const ext = path.extname(originalName).toLowerCase();
  const ts  = Date.now();
  const rnd = randomBytes(8).toString("hex");
  return `${folder}/${ts}-${rnd}${ext}`;
}

// ─── S3-compatible upload (R2 / AWS S3) ──────────────────────────────────────

async function uploadToS3(
  buffer: Buffer,
  key: string,
  mimeType: string
): Promise<string> {
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");

  const endpoint = process.env.STORAGE_ENDPOINT;
  const bucket   = process.env.STORAGE_BUCKET;
  const region   = process.env.STORAGE_REGION ?? "auto";
  const accessKey = process.env.STORAGE_ACCESS_KEY;
  const secretKey = process.env.STORAGE_SECRET_KEY;
  const baseUrl   = process.env.NEXT_PUBLIC_STORAGE_BASE_URL;

  if (!bucket || !accessKey || !secretKey) {
    throw new Error(
      "Cloud storage misconfigured. Set STORAGE_BUCKET, STORAGE_ACCESS_KEY, STORAGE_SECRET_KEY."
    );
  }

  const client = new S3Client({
    region,
    endpoint,
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
    // R2 requires path-style URLs
    forcePathStyle: !!endpoint,
  });

  await client.send(
    new PutObjectCommand({
      Bucket:      bucket,
      Key:         key,
      Body:        buffer,
      ContentType: mimeType,
      // Set cache headers so CDN can cache assets efficiently
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  // If a CDN/custom domain is configured, use it; otherwise fall back to the S3 endpoint
  if (baseUrl) {
    return `${baseUrl.replace(/\/$/, "")}/${key}`;
  }
  if (endpoint) {
    return `${endpoint.replace(/\/$/, "")}/${bucket}/${key}`;
  }
  // AWS S3 default
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

// ─── Local filesystem upload (development only) ───────────────────────────────

async function uploadToLocal(
  buffer: Buffer,
  key: string
): Promise<string> {
  const { writeFile, mkdir } = await import("fs/promises");

  if (process.env.VERCEL === "1") {
    throw new Error(
      "Local filesystem storage is not available on Vercel. " +
      "Set STORAGE_PROVIDER=r2 and configure R2 credentials."
    );
  }

  const uploadDir = path.join(process.cwd(), "public", path.dirname(key));
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(process.cwd(), "public", key), buffer);

  return `/${key}`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function uploadFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  folder = "uploads"
): Promise<UploadResult> {
  const provider = process.env.STORAGE_PROVIDER?.toLowerCase();
  const key = generateStorageKey(originalName, folder);

  let url: string;

  if (provider === "s3" || provider === "r2") {
    url = await uploadToS3(buffer, key, mimeType);
  } else {
    url = await uploadToLocal(buffer, key);
  }

  return { url, key, size: buffer.length, mimeType, originalName };
}

/**
 * Delete a file from cloud storage by its key.
 * Silently ignores errors so a missing file doesn't block the operation.
 */
export async function deleteFile(key: string): Promise<void> {
  const provider = process.env.STORAGE_PROVIDER?.toLowerCase();

  if (provider !== "s3" && provider !== "r2") {
    // Local: delete the file if it exists
    const { unlink } = await import("fs/promises");
    await unlink(path.join(process.cwd(), "public", key)).catch(() => {});
    return;
  }

  const { S3Client, DeleteObjectCommand } = await import("@aws-sdk/client-s3");
  const bucket    = process.env.STORAGE_BUCKET;
  const region    = process.env.STORAGE_REGION ?? "auto";
  const endpoint  = process.env.STORAGE_ENDPOINT;
  const accessKey = process.env.STORAGE_ACCESS_KEY;
  const secretKey = process.env.STORAGE_SECRET_KEY;

  if (!bucket || !accessKey || !secretKey) return;

  const client = new S3Client({
    region,
    endpoint,
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
    forcePathStyle: !!endpoint,
  });

  await client.send(
    new DeleteObjectCommand({ Bucket: bucket, Key: key })
  ).catch(() => {});
}

/**
 * Generate a signed URL for private file access (e.g. confidential documents).
 * Expires after `expiresIn` seconds (default: 1 hour).
 */
export async function getSignedUrl(
  key: string,
  expiresIn = 3600
): Promise<string> {
  const provider = process.env.STORAGE_PROVIDER?.toLowerCase();

  if (provider !== "s3" && provider !== "r2") {
    // Local: return the direct path
    return `/${key}`;
  }

  const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");
  const { getSignedUrl: awsGetSignedUrl } = await import("@aws-sdk/s3-request-presigner");

  const bucket    = process.env.STORAGE_BUCKET!;
  const region    = process.env.STORAGE_REGION ?? "auto";
  const endpoint  = process.env.STORAGE_ENDPOINT;
  const accessKey = process.env.STORAGE_ACCESS_KEY!;
  const secretKey = process.env.STORAGE_SECRET_KEY!;

  const client = new S3Client({
    region,
    endpoint,
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
    forcePathStyle: !!endpoint,
  });

  return awsGetSignedUrl(
    client,
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn }
  );
}
