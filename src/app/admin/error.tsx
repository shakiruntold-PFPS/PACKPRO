"use client";
import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[AdminError]", error);
  }, [error]);

  return (
    <div className="module-page flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)" }}>
          <AlertTriangle size={28} style={{ color:"#ef4444" }}/>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
        <p className="text-sm mb-2" style={{ color:"var(--muted)" }}>
          {error.message || "An unexpected error occurred while loading this page."}
        </p>
        <p className="text-xs mb-6" style={{ color:"var(--muted)" }}>
          If this persists, check that DATABASE_URL and NEXTAUTH_SECRET are set in your Vercel environment variables.
        </p>
        <button onClick={reset} className="btn-primary mx-auto">
          <RefreshCw size={13}/> Try Again
        </button>
      </div>
    </div>
  );
}
