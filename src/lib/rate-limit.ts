// Sliding-window in-memory rate limiter.
// Replace the store with a Redis adapter (ioredis + sliding-window script)
// before scaling to multiple server instances.

interface RateLimitWindow {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitWindow>();

// Purge expired entries every 5 minutes to prevent unbounded Map growth.
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, win] of store.entries()) {
      if (win.resetAt < now) store.delete(key);
    }
  }, 5 * 60 * 1000).unref?.();
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

/**
 * Check and increment the rate-limit counter for a given key.
 *
 * @param key     Unique identifier — typically `"route:ip"` e.g. `"signup:127.0.0.1"`
 * @param limit   Maximum requests allowed in the window
 * @param windowMs Window duration in milliseconds (default: 60_000 = 1 min)
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs = 60_000
): RateLimitResult {
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || existing.resetAt < now) {
    // New window
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { success: true, limit, remaining: limit - 1, resetAt };
  }

  existing.count += 1;
  const remaining = Math.max(0, limit - existing.count);
  return {
    success: existing.count <= limit,
    limit,
    remaining,
    resetAt: existing.resetAt,
  };
}

/**
 * Extract the real client IP from a Next.js request.
 * Respects Vercel/Cloudflare forwarded headers.
 */
export function getClientIp(req: Request): string {
  const forwarded = (req.headers as any).get?.("x-forwarded-for") ??
    (req.headers as any)["x-forwarded-for"];
  if (forwarded) {
    return (typeof forwarded === "string" ? forwarded : forwarded[0])
      .split(",")[0]
      .trim();
  }
  return "unknown";
}
