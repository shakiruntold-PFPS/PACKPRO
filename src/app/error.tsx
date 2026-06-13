"use client";
// Root-level error boundary — catches unhandled errors outside /admin.
// The /admin subtree has its own src/app/admin/error.tsx.
import { useEffect } from "react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In production, wire this to your error-tracking service (Sentry, etc.)
    console.error("[RootError]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#070f1e",
          fontFamily: "system-ui, sans-serif",
          color: "#e8eef8",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 420, padding: "0 24px" }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              fontSize: 24,
            }}
          >
            ⚠
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
            Unexpected Error
          </h1>
          <p style={{ fontSize: 13, color: "#93a5c4", marginBottom: 6 }}>
            {error.message || "Something went wrong loading this page."}
          </p>
          {error.digest && (
            <p style={{ fontSize: 11, color: "#5d7399", marginBottom: 20 }}>
              Error ID: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              padding: "9px 20px",
              borderRadius: 10,
              background: "linear-gradient(135deg,#0ea5a0,#1b4f8a)",
              border: "none",
              color: "#fff",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
