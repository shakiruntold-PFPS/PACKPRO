"use client";
import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Lock, Mail, AlertCircle, CheckCircle, Package } from "lucide-react";

const DEMO_ACCOUNTS = [
  { label: "Admin",    email: "admin@packpro.site",  pw: "packpro@2025", role: "Super Admin", color: "#0ea5a0" },
  { label: "Sales",    email: "rahul@packpro.site",   pw: "sales@2025",   role: "Sales Rep",   color: "#1b4f8a" },
  { label: "Accounts", email: "priya@packpro.site",   pw: "accounts@2025",role: "Accounts",    color: "#f59e0b" },
];

function LoginForm() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [loadingDemo, setLoadingDemo] = useState<string | null>(null);
  const [error, setError]       = useState("");
  const router = useRouter();
  const params = useSearchParams();
  const registered = params.get("registered") === "1";
  const callbackUrl = params.get("callbackUrl") || "/admin/dashboard";

  async function doSignIn(em: string, pw: string) {
    const result = await signIn("credentials", { email: em, password: pw, redirect: false });
    if (result?.error) return "Invalid email or password. Please check your credentials.";
    router.push(callbackUrl);
    router.refresh();
    return null;
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const err = await doSignIn(email, password);
    setLoading(false);
    if (err) setError(err);
  }

  async function handleDemo(acc: typeof DEMO_ACCOUNTS[0]) {
    setError("");
    setLoadingDemo(acc.label);
    const err = await doSignIn(acc.email, acc.pw);
    setLoadingDemo(null);
    if (err) setError("Demo account unavailable — database may not be seeded yet.");
  }

  return (
    <div className="min-h-screen flex" style={{ background: "linear-gradient(160deg,#060f1e 0%,#0b1e3d 55%,#0a2e2c 100%)" }}>
      {/* Left branding panel — desktop only */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 p-10"
        style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}>
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg text-white"
              style={{ background: "linear-gradient(135deg,#0ea5a0,#1b4f8a)" }}>P</div>
            <span className="font-black text-xl tracking-wider text-white">PACKPRO</span>
          </div>
          <h2 className="text-3xl font-black text-white leading-tight mb-4">
            Food Packaging<br />Business OS
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "#8ba5c8" }}>
            Complete ERP for sales, inventory, invoices, HR and more — built for packaging manufacturers.
          </p>
        </div>

        <div className="space-y-2.5">
          {[
            { label: "CRM & Leads",        desc: "Track customers and pipeline" },
            { label: "Quotations & Orders", desc: "Generate quotes and invoices instantly" },
            { label: "Inventory Control",   desc: "Real-time stock with low-stock alerts" },
            { label: "HR & Payroll",        desc: "Employee management and salary slips" },
          ].map(f => (
            <div key={f.label} className="flex items-start gap-3 p-3 rounded-xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: "rgba(14,165,160,0.2)" }}>
                <Package size={11} style={{ color: "#14c7c0" }} />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">{f.label}</div>
                <div className="text-xs mt-0.5" style={{ color: "#8ba5c8" }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs" style={{ color: "rgba(139,165,200,0.4)" }}>
          © 2025 PACKPRO · Alwar, Rajasthan, India
        </p>
      </div>

      {/* Right login panel */}
      <div className="flex-1 flex items-center justify-center p-5 sm:p-8">
        <div className="w-full max-w-[400px]">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 justify-center mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg text-white"
              style={{ background: "linear-gradient(135deg,#0ea5a0,#1b4f8a)" }}>P</div>
            <span className="font-black text-xl tracking-wider text-white">PACKPRO</span>
          </div>

          <div className="mb-7">
            <h1 className="text-2xl font-black text-white mb-1">Welcome back</h1>
            <p className="text-sm" style={{ color: "#8ba5c8" }}>Sign in to your PACKPRO account</p>
          </div>

          {registered && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl mb-5 text-sm"
              style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", color: "#10b981" }}>
              <CheckCircle size={15} className="flex-shrink-0" />
              Account created successfully! Sign in below.
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl mb-5 text-sm"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444" }}>
              <AlertCircle size={15} className="flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Login form */}
          <form onSubmit={handleLogin} className="space-y-4 mb-6">
            <div>
              <label className="erp-label">Email Address</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: "#8ba5c8" }} />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="erp-input" style={{ paddingLeft: "40px" }}
                  placeholder="admin@packpro.site" required autoFocus
                />
              </div>
            </div>

            <div>
              <label className="erp-label">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: "#8ba5c8" }} />
                <input
                  type={showPw ? "text" : "password"} value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="erp-input" style={{ paddingLeft: "40px", paddingRight: "44px" }}
                  placeholder="Your password" required
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded hover:opacity-70 transition-opacity"
                  style={{ color: "#8ba5c8" }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center"
              style={{ padding: "12px", fontSize: "14px", marginTop: "4px" }}>
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : "Sign In →"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
            <span className="text-xs" style={{ color: "#8ba5c8" }}>or use demo account</span>
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
          </div>

          {/* Demo quick-login */}
          <div className="grid grid-cols-3 gap-2.5 mb-7">
            {DEMO_ACCOUNTS.map(acc => (
              <button key={acc.label} type="button"
                disabled={!!loadingDemo}
                onClick={() => handleDemo(acc)}
                className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${acc.color}40`,
                  opacity: loadingDemo && loadingDemo !== acc.label ? 0.5 : 1,
                  cursor: loadingDemo ? "not-allowed" : "pointer",
                }}>
                {loadingDemo === acc.label ? (
                  <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black"
                    style={{ background: `${acc.color}25`, border: `1px solid ${acc.color}50`, color: acc.color }}>
                    {acc.label[0]}
                  </div>
                )}
                <div className="text-center">
                  <div className="text-xs font-bold text-white">{acc.label}</div>
                  <div className="text-[10px]" style={{ color: "#8ba5c8" }}>{acc.role}</div>
                </div>
              </button>
            ))}
          </div>

          <p className="text-center text-sm" style={{ color: "#8ba5c8" }}>
            No account?{" "}
            <Link href="/signup" className="font-semibold hover:underline" style={{ color: "#14c7c0" }}>
              Create one
            </Link>
          </p>

          <div className="mt-6 pt-5" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-center text-xs" style={{ color: "rgba(139,165,200,0.45)" }}>
              Admin credentials
            </p>
            <div className="mt-2 p-3 rounded-xl text-xs font-mono text-center"
              style={{ background: "rgba(14,165,160,0.06)", border: "1px solid rgba(14,165,160,0.15)", color: "#8ba5c8" }}>
              <span style={{ color: "#14c7c0" }}>admin@packpro.site</span>
              {" / "}
              <span style={{ color: "#8ba5c8" }}>packpro@2025</span>
            </div>
          </div>
        </div>
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
