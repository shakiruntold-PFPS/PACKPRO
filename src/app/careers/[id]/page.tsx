"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const WA_NUM = "919057627625";
const PHONE = "+91 9057627625";

interface Career {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  requirements?: string | null;
  salary?: string | null;
  status: string;
  _count?: { applications: number };
}

const TYPE_LABELS: Record<string, string> = {
  FULL_TIME: "Full Time",
  PART_TIME: "Part Time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
};

function ApplyForm({ careerId, careerTitle }: { careerId: string; careerTitle: string }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", resumeUrl: "", coverLetter: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone) {
      setError("Name, email and phone are required");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/careers/${careerId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div style={{ background: "rgba(14,165,160,0.1)", border: "1px solid rgba(14,165,160,0.3)", borderRadius: 16, padding: 32, textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#14c7c0", marginBottom: 8 }}>Application Submitted!</div>
        <div style={{ fontSize: 14, color: "#93a5c4", lineHeight: 1.7 }}>
          Thank you for applying for <strong style={{ color: "#e8eef8" }}>{careerTitle}</strong>. Our team will review your application and be in touch shortly.
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3 style={{ fontSize: 20, fontWeight: 800, color: "#e8eef8", marginBottom: 24 }}>Apply for this Position</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {[
          { key: "name", label: "Full Name *", type: "text", placeholder: "Your name", full: true },
          { key: "email", label: "Email *", type: "email", placeholder: "you@example.com" },
          { key: "phone", label: "Phone *", type: "tel", placeholder: "+91 98765 43210" },
          { key: "resumeUrl", label: "Resume URL", type: "url", placeholder: "https://drive.google.com/...", full: true },
        ].map(({ key, label, type, placeholder, full }) => (
          <div key={key} style={{ gridColumn: full ? "1 / -1" : "auto" }}>
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
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#93a5c4", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Cover Letter</label>
          <textarea
            placeholder="Tell us why you're a great fit..."
            value={form.coverLetter}
            onChange={e => setForm(f => ({ ...f, coverLetter: e.target.value }))}
            rows={5}
            style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "10px 12px", color: "#e8eef8", fontSize: 14, outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }}
          />
        </div>
      </div>

      {error && <div style={{ color: "#f87171", fontSize: 13, marginTop: 12 }}>{error}</div>}

      <button type="submit" disabled={submitting}
        style={{ marginTop: 20, background: "linear-gradient(135deg,#0ea5a0,#1b4f8a)", color: "#fff", fontWeight: 700, padding: "13px 32px", borderRadius: 10, border: "none", fontSize: 15, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1 }}>
        {submitting ? "Submitting..." : "Submit Application"}
      </button>
    </form>
  );
}

export default function CareerDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [career, setCareer] = useState<Career | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/careers/${id}`)
      .then(r => {
        if (!r.ok) { setNotFound(true); return null; }
        return r.json();
      })
      .then(j => { if (j) setCareer(j.data); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

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
            <Link href="/careers" style={{ color: "#14c7c0", fontSize: 14, textDecoration: "none", padding: "6px 12px", fontWeight: 700 }}>← Careers</Link>
            <Link href="/contact" style={{ color: "#93a5c4", fontSize: 14, textDecoration: "none", padding: "6px 12px" }}>Contact</Link>
            <a href={`https://wa.me/${WA_NUM}`} target="_blank" rel="noreferrer"
              style={{ background: "#0ea5a0", color: "#fff", fontSize: 13, fontWeight: 700, padding: "8px 16px", borderRadius: 8, textDecoration: "none" }}>
              WhatsApp
            </a>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px 80px" }}>

        {loading && (
          <div style={{ textAlign: "center", padding: 80, color: "#5d7399" }}>Loading...</div>
        )}

        {notFound && (
          <div style={{ textAlign: "center", padding: 80 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#93a5c4", marginBottom: 16 }}>Position not found</div>
            <Link href="/careers" style={{ color: "#14c7c0", textDecoration: "none", fontWeight: 700 }}>← Back to Careers</Link>
          </div>
        )}

        {career && (
          <>
            <Link href="/careers" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#5d7399", fontSize: 13, textDecoration: "none", marginBottom: 32 }}>
              ← All Positions
            </Link>

            {/* Header */}
            <div style={{ marginBottom: 40 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                <span style={{ background: "rgba(14,165,160,0.15)", border: "1px solid rgba(14,165,160,0.3)", color: "#14c7c0", fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 12, letterSpacing: 0.5 }}>
                  {career.department}
                </span>
                <span style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#93a5c4", fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 12 }}>
                  {TYPE_LABELS[career.type] || career.type}
                </span>
                {career.status === "OPEN" ? (
                  <span style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e", fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 12 }}>
                    OPEN
                  </span>
                ) : (
                  <span style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 12 }}>
                    CLOSED
                  </span>
                )}
              </div>

              <h1 style={{ fontSize: "clamp(24px, 4vw, 40px)", fontWeight: 900, color: "#e8eef8", margin: "0 0 16px", lineHeight: 1.2 }}>
                {career.title}
              </h1>

              <div style={{ display: "flex", gap: 20, flexWrap: "wrap", fontSize: 13, color: "#5d7399" }}>
                <span>📍 {career.location}</span>
                {career.salary && <span>💰 {career.salary}</span>}
                {career._count && <span>👥 {career._count.applications} applicants</span>}
              </div>
            </div>

            {/* Description */}
            <div style={{ background: "rgba(15,30,56,0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 32, marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#e8eef8", marginBottom: 16 }}>About this Role</h2>
              <div style={{ fontSize: 15, color: "#93a5c4", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                {career.description}
              </div>
            </div>

            {/* Requirements */}
            {career.requirements && (
              <div style={{ background: "rgba(15,30,56,0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 32, marginBottom: 32 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#e8eef8", marginBottom: 16 }}>Requirements</h2>
                <div style={{ fontSize: 15, color: "#93a5c4", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                  {career.requirements}
                </div>
              </div>
            )}

            {/* Application Form */}
            {career.status === "OPEN" ? (
              <div style={{ background: "rgba(15,30,56,0.9)", border: "1px solid rgba(14,165,160,0.2)", borderRadius: 20, padding: 32 }}>
                <ApplyForm careerId={career.id} careerTitle={career.title} />
              </div>
            ) : (
              <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 16, padding: 24, textAlign: "center" }}>
                <div style={{ fontSize: 14, color: "#ef4444", fontWeight: 700 }}>This position is no longer accepting applications.</div>
                <Link href="/careers" style={{ display: "inline-block", marginTop: 12, color: "#14c7c0", textDecoration: "none", fontWeight: 700, fontSize: 14 }}>
                  View other open positions →
                </Link>
              </div>
            )}
          </>
        )}
      </div>

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
