import ContactForm from "./ContactForm";
import Link from "next/link";

export const metadata = {
  title: "Contact Us — PACKPRO",
  description: "Get in touch with PACKPRO for bulk packaging orders, samples, and custom solutions.",
};

export default function ContactPage() {
  const phone = "+91 9057627625";
  const email = "sales@packpro.site";
  const waLink = `https://wa.me/919057627625?text=${encodeURIComponent("Hi, I'd like to enquire about packaging products.")}`;

  return (
    <div style={{ background: "#070f1e", minHeight: "100vh", color: "#e8eef8", fontFamily: "system-ui,sans-serif" }}>
      {/* Nav */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(7,15,30,0.95)", backdropFilter: "blur(12px)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#0ea5a0,#1b4f8a)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14, color: "#fff" }}>P</div>
            <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: 2, color: "#e8eef8" }}>PACKPRO</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link href="/catalog" style={{ color: "#93a5c4", fontSize: 13, textDecoration: "none", padding: "6px 10px" }}>Catalog</Link>
            <Link href="/about" style={{ color: "#93a5c4", fontSize: 13, textDecoration: "none", padding: "6px 10px" }}>About</Link>
            <Link href="/services" style={{ color: "#93a5c4", fontSize: 13, textDecoration: "none", padding: "6px 10px" }}>Services</Link>
            <a href={waLink} target="_blank" rel="noreferrer"
              style={{ background: "#0ea5a0", color: "#fff", fontSize: 13, fontWeight: 700, padding: "8px 16px", borderRadius: 8, textDecoration: "none" }}>
              WhatsApp
            </a>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "60px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <div style={{ display: "inline-block", background: "rgba(14,165,160,0.12)", border: "1px solid rgba(14,165,160,0.3)", borderRadius: 20, padding: "4px 14px", fontSize: 11, fontWeight: 700, color: "#14c7c0", letterSpacing: 1, marginBottom: 16 }}>GET IN TOUCH</div>
          <h1 style={{ fontSize: "clamp(28px,5vw,48px)", fontWeight: 900, margin: "0 0 12px" }}>Contact Us</h1>
          <p style={{ fontSize: 16, color: "#93a5c4", maxWidth: 480, margin: "0 auto" }}>Send us your requirement and we'll get back within 24 hours with pricing and samples.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 40 }}>
          {/* Contact Info */}
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 28, color: "#e8eef8" }}>Reach Us Directly</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {[
                { icon: "📞", label: "Phone", value: phone, href: `tel:${phone}` },
                { icon: "💬", label: "WhatsApp", value: "Chat with us", href: waLink },
                { icon: "📧", label: "Email", value: email, href: `mailto:${email}` },
                { icon: "📍", label: "Address", value: "Dholidub, Narnaul-Behror Road\nAlwar, Rajasthan 301001", href: null },
              ].map(({ icon, label, value, href }) => (
                <div key={label} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(14,165,160,0.12)", border: "1px solid rgba(14,165,160,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{icon}</div>
                  <div>
                    <div style={{ fontSize: 11, color: "#5d7399", fontWeight: 700, marginBottom: 3, letterSpacing: 0.5 }}>{label.toUpperCase()}</div>
                    {href
                      ? <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" style={{ color: "#14c7c0", fontWeight: 600, textDecoration: "none", fontSize: 15 }}>{value}</a>
                      : <div style={{ color: "#93a5c4", fontSize: 14, whiteSpace: "pre-line", lineHeight: 1.5 }}>{value}</div>}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 36, padding: 20, borderRadius: 16, background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.2)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#4ade80", marginBottom: 8 }}>💬 WhatsApp is Fastest</div>
              <p style={{ fontSize: 13, color: "#93a5c4", margin: 0, lineHeight: 1.6 }}>For quick quotes and samples, WhatsApp us directly. Most enquiries get a response within 2 hours on business days.</p>
              <a href={waLink} target="_blank" rel="noreferrer"
                style={{ display: "inline-block", marginTop: 12, background: "#25d366", color: "#fff", fontWeight: 700, fontSize: 13, padding: "10px 20px", borderRadius: 8, textDecoration: "none" }}>
                Open WhatsApp Chat →
              </a>
            </div>
          </div>

          {/* Form */}
          <div style={{ background: "rgba(15,30,56,0.8)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 24, color: "#e8eef8" }}>Send an Enquiry</h2>
            <ContactForm />
          </div>
        </div>
      </div>

      {/* Floating WA */}
      <a href={waLink} target="_blank" rel="noreferrer"
        style={{ position: "fixed", bottom: 24, right: 24, zIndex: 90, width: 54, height: 54, borderRadius: "50%", background: "#25d366", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(37,211,102,0.4)", textDecoration: "none", fontSize: 24 }}>
        💬
      </a>
    </div>
  );
}
