"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

const WA_NUM = "919057627625";
const PHONE = "+91 9057627625";

interface Career {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  salary?: string | null;
  createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  FULL_TIME: "Full Time",
  PART_TIME: "Part Time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
};

function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    FULL_TIME: "#14c7c0",
    PART_TIME: "#f59e0b",
    CONTRACT: "#8b5cf6",
    INTERNSHIP: "#3b82f6",
  };
  return (
    <span style={{ display: "inline-block", background: `${colors[type] || "#5d7399"}22`, border: `1px solid ${colors[type] || "#5d7399"}55`, color: colors[type] || "#93a5c4", fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 12, letterSpacing: 0.5 }}>
      {TYPE_LABELS[type] || type}
    </span>
  );
}

export default function CareersPage() {
  const [careers, setCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", phone: "", position: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/careers")
      .then(r => r.json())
      .then(j => setCareers(j.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone) { setError("Name, email and phone are required"); return; }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          message: `General career inquiry${form.position ? ` — interested in: ${form.position}` : ""}`,
          productInterest: form.position || "General Career Inquiry",
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setSubmitted(true);
      setForm({ name: "", email: "", phone: "", position: "" });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ background: "#070f1e", minHeight: "100vh", color: "#e8eef8", fontFamily: "system-ui, sans-serif" }}>

      {/* NAV */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(7,15,30,0.92)", backdropFilter: "blur(12px)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#0ea5a0,#1b4f8a)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14, color: "#fff" }}>P</div>
            <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: 2, color: "#e8eef8" }}>PACKPRO</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <Link href="/catalog" style={{ color: "#93a5c4", fontSize: 14, textDecoration: "none", padding: "6px 12px" }}>Catalog</Link>
            <Link href="/about" style={{ color: "#93a5c4", fontSize: 14, textDecoration: "none", padding: "6px 12px" }}>About</Link>
            <Link href="/blog" style={{ color: "#93a5c4", fontSize: 14, textDecoration: "none", padding: "6px 12px" }}>Blog</Link>
            <Link href="/careers" style={{ color: "#14c7c0", fontSize: 14, textDecoration: "none", padding: "6px 12px", fontWeight: 700 }}>Careers</Link>
            <Link href="/contact" style={{ color: "#93a5c4", fontSize: 14, textDecoration: "none", padding: "6px 12px" }}>Contact</Link>
            <a href={`https://wa.me/${WA_NUM}`} target="_blank" rel="noreferrer"
              style={{ background: "#0ea5a0", color: "#fff", fontSize: 13, fontWeight: 700, padding: "8px 16px", borderRadius: 8, textDecoration: "none" }}>
              WhatsApp
            </a>
            <Link href="/login" style={{ color: "#5d7399", fontSize: 12, textDecoration: "none", padding: "6px 10px" }}>Login</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 24px 60px", textAlign: "center" }}>
        <div style={{ display: "inline-block", background: "rgba(14,165,160,0.12)", border: "1px solid rgba(14,165,160,0.3)", borderRadius: 20, padding: "4px 14px", fontSize: 12, fontWeight: 700, color: "#14c7c0", letterSpacing: 1, marginBottom: 20 }}>
          JOIN OUR TEAM
        </div>
        <h1 style={{ fontSize: "clamp(32px, 6vw, 60px)", fontWeight: 900, lineHeight: 1.1, margin: "0 0 20px", letterSpacing: -1 }}>
          <span style={{ background: "linear-gradient(135deg,#e8eef8,#93a5c4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Careers at
          </span>
          {" "}
          <span style={{ background: "linear-gradient(135deg,#14c7c0,#0ea5a0)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            PACKPRO
          </span>
        </h1>
        <p style={{ fontSize: 18, color: "#93a5c4", maxWidth: 600, margin: "0 auto", lineHeight: 1.7 }}>
          Build your career with India&apos;s growing food packaging manufacturer. We&apos;re looking for passionate people to join our team in Alwar, Rajasthan.
        </p>
      </section>

      {/* CONTENT */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 80px", display: "flex", gap: 40, flexWrap: "wrap", alignItems: "flex-start" }}>

        {/* JOB LISTINGS */}
        <div style={{ flex: "1 1 500px" }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#e8eef8", marginBottom: 24 }}>Open Positions</h2>

          {loading && (
            <div style={{ color: "#5d7399", textAlign: "center", padding: 40 }}>Loading positions...</div>
          )}

          {!loading && careers.length === 0 && (
            <div style={{ background: "rgba(15,30,56,0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 40, textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
              <div style={{ fontWeight: 700, color: "#93a5c4", marginBottom: 8 }}>No open positions right now</div>
              <div style={{ fontSize: 13, color: "#5d7399" }}>Fill the form to express general interest — we&apos;ll reach out when something fits.</div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {careers.map(career => (
              <div key={career.id} style={{ background: "rgba(15,30,56,0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: "#e8eef8", marginBottom: 8 }}>{career.title}</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "#5d7399", background: "rgba(255,255,255,0.04)", padding: "2px 8px", borderRadius: 8 }}>
                      🏢 {career.department}
                    </span>
                    <span style={{ fontSize: 12, color: "#5d7399", background: "rgba(255,255,255,0.04)", padding: "2px 8px", borderRadius: 8 }}>
                      📍 {career.location}
                    </span>
                    <TypeBadge type={career.type} />
                    {career.salary && (
                      <span style={{ fontSize: 12, color: "#14c7c0" }}>💰 {career.salary}</span>
                    )}
                  </div>
                </div>
                <Link href={`/careers/${career.id}`}
                  style={{ background: "linear-gradient(135deg,#0ea5a0,#1b4f8a)", color: "#fff", fontWeight: 700, padding: "10px 20px", borderRadius: 10, textDecoration: "none", fontSize: 13, whiteSpace: "nowrap" }}>
                  View & Apply →
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* GENERAL INQUIRY FORM */}
        <div style={{ flex: "0 1 340px", position: "sticky", top: 80 }}>
          <div style={{ background: "rgba(15,30,56,0.9)", border: "1px solid rgba(14,165,160,0.2)", borderRadius: 20, padding: 28 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#e8eef8", marginBottom: 6 }}>General Inquiry</h3>
            <p style={{ fontSize: 13, color: "#5d7399", marginBottom: 24, lineHeight: 1.6 }}>
              Don&apos;t see a matching role? Tell us about yourself and we&apos;ll keep you in mind.
            </p>

            {submitted ? (
              <div style={{ background: "rgba(14,165,160,0.1)", border: "1px solid rgba(14,165,160,0.3)", borderRadius: 12, padding: 20, textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                <div style={{ fontWeight: 700, color: "#14c7c0", marginBottom: 4 }}>Inquiry Received!</div>
                <div style={{ fontSize: 13, color: "#93a5c4" }}>We&apos;ll reach out when a matching role opens up.</div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {[
                  { key: "name", label: "Full Name *", type: "text", placeholder: "Your name" },
                  { key: "email", label: "Email *", type: "email", placeholder: "you@example.com" },
                  { key: "phone", label: "Phone *", type: "tel", placeholder: "+91 98765 43210" },
                  { key: "position", label: "Position of Interest", type: "text", placeholder: "e.g. Sales Executive" },
                ].map(({ key, label, type, placeholder }) => (
                  <div key={key} style={{ marginBottom: 16 }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#93a5c4", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>
                    <input
                      type={type}
                      placeholder={placeholder}
                      value={form[key as keyof typeof form]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "10px 12px", color: "#e8eef8", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                ))}

                {error && <div style={{ color: "#f87171", fontSize: 13, marginBottom: 12 }}>{error}</div>}

                <button type="submit" disabled={submitting}
                  style={{ width: "100%", background: "linear-gradient(135deg,#0ea5a0,#1b4f8a)", color: "#fff", fontWeight: 700, padding: "12px", borderRadius: 10, border: "none", fontSize: 14, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? "Sending..." : "Submit Inquiry"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "32px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: "#e8eef8", marginBottom: 6 }}>PACKPRO Food Packaging Solutions</div>
          <div style={{ fontSize: 13, color: "#5d7399" }}>Dholidub, Narnaul-Behror Road, Alwar, Rajasthan</div>
          <div style={{ marginTop: 8, fontSize: 12, color: "#3d5070" }}>{PHONE} · sales@packpro.site</div>
          <div style={{ marginTop: 16, fontSize: 12, color: "#3d5070" }}>© {new Date().getFullYear()} PACKPRO · All rights reserved</div>
        </div>
      </footer>

      {/* FLOATING WHATSAPP */}
      <a href={`https://wa.me/${WA_NUM}`} target="_blank" rel="noreferrer"
        style={{ position: "fixed", bottom: 24, right: 24, width: 56, height: 56, borderRadius: "50%", background: "#25d366", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 24px rgba(37,211,102,0.4)", zIndex: 999, textDecoration: "none", fontSize: 26 }}>
        💬
      </a>
    </div>
  );
}
