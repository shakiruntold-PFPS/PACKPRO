"use client";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Package } from "lucide-react";

function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords do not match"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Reset failed"); return; }
      setDone(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#070f1e", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg,#0ea5a0,#1b4f8a)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 22, fontWeight: 900, color: "#fff" }}>
            <Package size={22} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#e8eef8", marginBottom: 6 }}>Set New Password</h1>
          <p style={{ fontSize: 13, color: "#5d7399" }}>Enter your new password below</p>
        </div>

        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 28 }}>
          {!token && (
            <div style={{ textAlign: "center", color: "#f87171", fontSize: 14, padding: "20px 0" }}>
              <AlertCircle size={32} style={{ margin: "0 auto 12px" }} />
              <p>Invalid reset link. Please request a new one.</p>
              <Link href="/login" style={{ color: "#14c7c0", marginTop: 16, display: "block" }}>Back to Login</Link>
            </div>
          )}

          {done && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <CheckCircle size={40} style={{ color: "#22c55e", margin: "0 auto 12px" }} />
              <p style={{ color: "#e8eef8", fontWeight: 700, fontSize: 15 }}>Password updated!</p>
              <p style={{ color: "#5d7399", fontSize: 13, marginTop: 8 }}>Redirecting to login…</p>
            </div>
          )}

          {token && !done && (
            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {error && (
                <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "10px 14px", color: "#f87171", fontSize: 13, display: "flex", gap: 8, alignItems: "center" }}>
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#93a5c4", display: "block", marginBottom: 6 }}>New Password</label>
                <div style={{ position: "relative" }}>
                  <Lock size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#5d7399" }} />
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="Minimum 8 characters"
                    style={{ width: "100%", padding: "10px 40px 10px 36px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e8eef8", fontSize: 14, outline: "none" }}
                  />
                  <button type="button" onClick={() => setShowPw(s => !s)}
                    style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#5d7399", cursor: "pointer" }}>
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#93a5c4", display: "block", marginBottom: 6 }}>Confirm Password</label>
                <div style={{ position: "relative" }}>
                  <Lock size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#5d7399" }} />
                  <input
                    type={showPw ? "text" : "password"}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                    placeholder="Repeat password"
                    style={{ width: "100%", padding: "10px 12px 10px 36px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e8eef8", fontSize: 14, outline: "none" }}
                  />
                </div>
              </div>

              <button type="submit" disabled={loading}
                style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg,#0ea5a0,#0c8f8a)", color: "#fff", fontWeight: 700, fontSize: 14, borderRadius: 10, border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
                {loading ? "Updating…" : "Set New Password"}
              </button>

              <div style={{ textAlign: "center" }}>
                <Link href="/login" style={{ fontSize: 13, color: "#5d7399", textDecoration: "none" }}>← Back to Login</Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
