"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, Lock, Mail, User, AlertCircle, CheckCircle } from "lucide-react";

export default function SignupPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm) {
      setError("Passwords do not match");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Signup failed");
        setLoading(false);
        return;
      }

      setSuccess(true);
      // Auto sign-in after successful signup
      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (result?.ok) {
        router.push("/admin/dashboard");
      } else {
        // Signup worked but auto-login failed — just send to login
        router.push("/login?registered=1");
      }
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  // Password strength
  const pw = form.password;
  const strength = [pw.length >= 8, /[A-Z]/.test(pw), /[0-9]/.test(pw), /[^a-zA-Z0-9]/.test(pw)].filter(Boolean).length;
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = ["", "#ef4444", "#f59e0b", "#0ea5a0", "#10b981"][strength];

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(160deg,#060f1e 0%,#0b1e3d 50%,#0b3d3a 100%)" }}
    >
      {/* Background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: "#0ea5a0" }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-8 blur-3xl"
          style={{ background: "#1b4f8a" }} />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: "linear-gradient(135deg,#0ea5a0,#1b4f8a)" }}>
            <span className="text-white font-black text-2xl">P</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-wide">PACKPRO</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Create your account</p>
        </div>

        <div
          className="rounded-2xl p-7"
          style={{ background: "rgba(20,38,69,0.9)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}
        >
          <h2 className="text-lg font-bold text-white mb-1">Get started</h2>
          <p className="text-xs mb-6" style={{ color: "var(--muted)" }}>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold" style={{ color: "#14c7c0" }}>
              Sign in
            </Link>
          </p>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>
              <AlertCircle size={14} className="flex-shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm"
              style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981" }}>
              <CheckCircle size={14} className="flex-shrink-0" />
              Account created! Signing you in…
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            {/* Name */}
            <div>
              <label className="erp-label">Full Name</label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
                <input
                  type="text" value={form.name} onChange={set("name")}
                  className="erp-input" style={{ paddingLeft: "38px" }}
                  placeholder="Rahul Sharma" required autoFocus
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="erp-label">Email Address</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
                <input
                  type="email" value={form.email} onChange={set("email")}
                  className="erp-input" style={{ paddingLeft: "38px" }}
                  placeholder="you@packpro.site" required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="erp-label">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
                <input
                  type={showPw ? "text" : "password"} value={form.password} onChange={set("password")}
                  className="erp-input" style={{ paddingLeft: "38px", paddingRight: "40px" }}
                  placeholder="Minimum 8 characters" required
                />
                <button type="button" onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }}>
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {/* Strength bar */}
              {pw.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map((n) => (
                      <div key={n} className="h-1 flex-1 rounded-full transition-all"
                        style={{ background: n <= strength ? strengthColor : "var(--border)" }} />
                    ))}
                  </div>
                  <div className="text-xs font-semibold" style={{ color: strengthColor }}>
                    {strengthLabel}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm */}
            <div>
              <label className="erp-label">Confirm Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
                <input
                  type={showPw ? "text" : "password"} value={form.confirm} onChange={set("confirm")}
                  className="erp-input" style={{
                    paddingLeft: "38px",
                    borderColor: form.confirm && form.confirm !== form.password ? "#ef4444" : undefined,
                  }}
                  placeholder="Repeat password" required
                />
              </div>
              {form.confirm && form.confirm !== form.password && (
                <p className="text-xs mt-1" style={{ color: "#ef4444" }}>Passwords do not match</p>
              )}
            </div>

            <button
              type="submit" disabled={loading || success}
              className="btn-primary w-full justify-center mt-2"
              style={{ padding: "11px", fontSize: "14px" }}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account…
                </span>
              ) : "Create Account →"}
            </button>
          </form>

          <p className="text-center text-xs mt-5 pt-4 border-t" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
            By signing up you agree to use this system responsibly.
          </p>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "var(--muted)" }}>
          © 2025 PACKPRO Food Packaging Solutions · Alwar, Rajasthan
        </p>
      </div>
    </div>
  );
}
