"use client";
import { useState } from "react";
import Link from "next/link";
import { Mail, CheckCircle, AlertCircle, Package } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Something went wrong");
      } else {
        setSent(true);
      }
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
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg,#0ea5a0,#1b4f8a)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Package size={22} color="#fff" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#e8eef8", marginBottom: 6 }}>Forgot Password?</h1>
          <p style={{ fontSize: 13, color: "#5d7399" }}>Enter your email and we&apos;ll send a reset link</p>
        </div>

        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 28 }}>
          {sent ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <CheckCircle size={40} style={{ color: "#22c55e", margin: "0 auto 12px" }} />
              <p style={{ color: "#e8eef8", fontWeight: 700, fontSize: 15 }}>Check your inbox</p>
              <p style={{ color: "#5d7399", fontSize: 13, marginTop: 8, lineHeight: 1.6 }}>
                If <strong style={{ color: "#93a5c4" }}>{email}</strong> is registered, a reset link has been sent. It expires in 1 hour.
              </p>
              <Link href="/login" style={{ display: "inline-block", marginTop: 20, color: "#14c7c0", fontSize: 14, textDecoration: "none", fontWeight: 600 }}>
                ← Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {error && (
                <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "10px 14px", color: "#f87171", fontSize: 13, display: "flex", gap: 8, alignItems: "center" }}>
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#93a5c4", display: "block", marginBottom: 6 }}>Email Address</label>
                <div style={{ position: "relative" }}>
                  <Mail size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#5d7399" }} />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="your@email.com"
                    style={{ width: "100%", padding: "10px 12px 10px 36px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e8eef8", fontSize: 14, outline: "none" }}
                  />
                </div>
              </div>

              <button type="submit" disabled={loading}
                style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg,#0ea5a0,#0c8f8a)", color: "#fff", fontWeight: 700, fontSize: 14, borderRadius: 10, border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
                {loading ? "Sending…" : "Send Reset Link"}
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
