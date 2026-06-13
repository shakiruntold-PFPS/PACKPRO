// Input sanitization utilities.
// All user-supplied strings must pass through sanitizeText before being
// persisted or rendered. This is a defence-in-depth layer — Zod validates
// types, this strips XSS payloads.

// Strip HTML tags and dangerous protocol handlers from a string.
export function sanitizeText(input: unknown): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/<[^>]*>/g, "")           // strip all HTML tags
    .replace(/javascript:/gi, "")      // neutralise JS protocol
    .replace(/data:/gi, "")            // neutralise data URIs
    .replace(/on\w+\s*=/gi, "")        // strip inline event handlers
    .trim();
}

// Sanitize all string values in a plain object (one level deep).
// Deep objects (like `specifications: Json`) are intentionally excluded —
// they are stored as opaque JSON and never rendered as HTML.
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      result[key] = sanitizeText(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map((v) =>
        typeof v === "string" ? sanitizeText(v) : v
      );
    } else {
      result[key] = value;
    }
  }
  return result as T;
}

// Validate a GSTIN format (India).
// Format: 2-digit state code + 10-char PAN + 1Z + 1 checksum = 15 chars
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
export function isValidGSTIN(gstin: string): boolean {
  return GSTIN_REGEX.test(gstin.toUpperCase().trim());
}

// Validate a PAN format (India).
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
export function isValidPAN(pan: string): boolean {
  return PAN_REGEX.test(pan.toUpperCase().trim());
}

// Sanitize a URL — only allow http/https schemes.
export function sanitizeUrl(url: unknown): string {
  if (typeof url !== "string") return "";
  try {
    const parsed = new URL(url.trim());
    if (!["http:", "https:"].includes(parsed.protocol)) return "";
    return parsed.toString();
  } catch {
    return "";
  }
}
