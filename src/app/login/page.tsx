"use client";
import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Lock, Mail, AlertCircle, CheckCircle } from "lucide-react";

function LoginForm() {
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const router = useRouter();
  const params = useSearchParams();
  const registered = params.get("registered") === "1";

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password. Please try again.");
    } else {
      router.push("/admin/dashboard");
      router.refresh();
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(160deg,#060f1e 0%,#0b1e3d 50%,#0b3d3a 100%)" }}
    >
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: "#0ea5a0" }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-8 blur-3xl"
          style={{ background: "#1b4f8a" }} />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: "linear-gradient(135deg,#0ea5a0,#1b4f8a)" }}>
            <span className="text-white font-black text-2xl">P</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-wide">PACKPRO</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Business Operating System</p>
        </div>

        <div
          className="rounded-2xl p-7"
          style={{ background: "rgba(20,38,69,0.9)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}
        >
          <h2 className="text-lg font-bold text-white mb-1">Welcome back</h2>
          <p className="text-xs mb-6" style={{ color: "var(--muted)" }}>
            No account?{" "}
            <Link href="/signup" className="font-semibold" style={{ color: "#14c7c0" }}>
              Create one
            </Link>
          </p>

          {registered && (
            <div className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm"
              style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981" }}>
              <CheckCircle size={14} className="flex-shrink-0" />
              Account created! Sign in below.
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>
              <AlertCircle size={14} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="erp-label">Email Address</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="erp-input" style={{ paddingLeft: "38px" }}
                  placeholder="admin@packpro.site" required autoFocus
                />
              </div>
            </div>

            <div>
              <label className="erp-label">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
                <input
                  type={showPw ? "text" : "password"} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="erp-input" style={{ paddingLeft: "38px", paddingRight: "40px" }}
                  placeholder="Your password" required
                />
                <button type="button" onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }}>
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading} className="btn-primary w-full justify-center mt-2"
              style={{ padding: "11px", fontSize: "14px" }}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : "Sign In →"}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t text-center" style={{ borderColor: "var(--border)" }}>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              Need help?{" "}
              <a href="mailto:support@packpro.site" className="font-semibold" style={{ color: "#14c7c0" }}>
                Contact IT Support
              </a>
            </p>
          </div>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "var(--muted)" }}>
          © 2025 PACKPRO Food Packaging Solutions · Alwar, Rajasthan
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
