import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Content-Security-Policy
// Kept permissive for the current inline-style-heavy UI.
// Tighten progressively as the codebase matures:
//   - Replace style-src 'unsafe-inline' with nonces once all inline styles are removed.
//   - Replace script-src 'unsafe-eval' once dev-mode HMR is no longer needed.
const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'" + (isDev ? " 'unsafe-eval'" : ""),
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  "connect-src 'self'" + (isDev ? " ws: wss:" : ""),
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  // Prevent clickjacking
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Prevent MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Control referrer information
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable browser DNS prefetching
  { key: "X-DNS-Prefetch-Control", value: "on" },
  // HSTS — only set in production (not localhost)
  ...(isDev
    ? []
    : [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]),
  // Restrict browser feature access
  {
    key: "Permissions-Policy",
    value: [
      "camera=()",
      "microphone=()",
      "geolocation=(self)",
      "payment=(self)",
      "usb=()",
      "magnetometer=()",
      "accelerometer=()",
      "gyroscope=()",
    ].join(", "),
  },
  // CSP
  { key: "Content-Security-Policy", value: cspDirectives },
];

const nextConfig: NextConfig = {
  // TypeScript and ESLint errors must not be silenced in production builds.
  // Fix all type errors before deploying; do not re-enable these flags.
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Security headers on all routes
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  // Silence noisy but harmless peer-dependency warnings from next-auth v4
  serverExternalPackages: ["bcryptjs"],

  images: {
    remotePatterns: [
      // Allow externally-hosted product images and user avatars.
      // Add additional patterns as integrations are added.
      { protocol: "https", hostname: "**.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "**.supabase.co" },
    ],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
