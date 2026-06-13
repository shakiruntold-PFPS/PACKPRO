import Link from "next/link";

export const metadata = {
  title: "Our Services | PACKPRO Food Packaging",
  description: "Custom packaging, bulk orders, private labeling, sample delivery, GST invoicing, and pan India logistics — everything your food business needs.",
};

const WA_NUM = "919057627625";

const SERVICES = [
  {
    icon: "🎨",
    title: "Custom Packaging",
    desc: "Get your brand on every box, cup, and bag. We offer full custom printing with your logo, colours, and design. Minimum order quantities start at 5,000 units.",
  },
  {
    icon: "📦",
    title: "Bulk Orders",
    desc: "Volume pricing for restaurants, cloud kitchens, hotel chains, and distributors. The more you order, the better the rate — with no compromise on quality.",
  },
  {
    icon: "🚀",
    title: "Sample Delivery",
    desc: "Not sure which product fits your needs? We dispatch samples of any product in our 500+ SKU catalog so you can test before committing to a bulk order.",
  },
  {
    icon: "🏷️",
    title: "Private Labeling",
    desc: "Launch your own packaging brand. We manufacture under your label with full confidentiality. Ideal for distributors, retailers, and regional brands.",
  },
  {
    icon: "🧾",
    title: "GST Invoicing",
    desc: "All orders come with proper GST invoices for full tax compliance and ITC claims. We are a registered GST entity — hassle-free B2B procurement.",
  },
  {
    icon: "🚚",
    title: "Pan India Logistics",
    desc: "We ship to every state and major district in India. Partnered with leading couriers and freight companies for reliable, tracked, on-time delivery.",
  },
];

const STEPS = [
  { num: "01", title: "Enquiry", desc: "Reach out via WhatsApp, email, or our contact form. Tell us your product requirements, quantities, and timeline." },
  { num: "02", title: "Quotation", desc: "We prepare a detailed quote within 24 hours — pricing, lead time, and product specs. No hidden charges." },
  { num: "03", title: "Manufacturing", desc: "Your order goes into production at our Alwar facility. Quality checks at every stage before packaging." },
  { num: "04", title: "Delivery", desc: "Your order ships with full tracking. Pan India delivery in 5–10 business days. Bulk orders may vary." },
];

export default function ServicesPage() {
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
            <Link href="/catalog" style={{ color: "#93a5c4", fontSize: 14, textDecoration: "none", padding: "6px 12px", borderRadius: 8 }}>Catalog</Link>
            <Link href="/about" style={{ color: "#93a5c4", fontSize: 14, textDecoration: "none", padding: "6px 12px", borderRadius: 8 }}>About</Link>
            <Link href="/services" style={{ color: "#14c7c0", fontSize: 14, textDecoration: "none", padding: "6px 12px", borderRadius: 8, fontWeight: 700 }}>Services</Link>
            <Link href="/contact" style={{ color: "#93a5c4", fontSize: 14, textDecoration: "none", padding: "6px 12px", borderRadius: 8 }}>Contact</Link>
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
          WHAT WE OFFER
        </div>
        <h1 style={{ fontSize: "clamp(32px, 6vw, 60px)", fontWeight: 900, lineHeight: 1.1, margin: "0 0 20px", letterSpacing: -1 }}>
          <span style={{ background: "linear-gradient(135deg,#e8eef8,#93a5c4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Our</span>
          {" "}
          <span style={{ background: "linear-gradient(135deg,#14c7c0,#0ea5a0)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Services</span>
        </h1>
        <p style={{ fontSize: 18, color: "#93a5c4", maxWidth: 560, margin: "0 auto", lineHeight: 1.7 }}>
          End-to-end packaging solutions for food businesses of every size — from single outlets to national chains.
        </p>
      </section>

      {/* SERVICE CARDS */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
          {SERVICES.map(({ icon, title, desc }) => (
            <div key={title} style={{ background: "rgba(15,30,56,0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 28, transition: "border-color 0.2s" }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>{icon}</div>
              <div style={{ fontWeight: 800, fontSize: 17, color: "#e8eef8", marginBottom: 10 }}>{title}</div>
              <div style={{ fontSize: 14, color: "#5d7399", lineHeight: 1.7 }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "80px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 style={{ fontSize: "clamp(22px, 3vw, 36px)", fontWeight: 800, color: "#e8eef8", marginBottom: 12 }}>How It Works</h2>
            <p style={{ color: "#5d7399", fontSize: 15 }}>From your first message to your doorstep — simple and transparent</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 24 }}>
            {STEPS.map(({ num, title, desc }, i) => (
              <div key={num} style={{ position: "relative" }}>
                <div style={{ background: "rgba(14,165,160,0.08)", border: "1px solid rgba(14,165,160,0.2)", borderRadius: 20, padding: 28, height: "100%" }}>
                  <div style={{ fontSize: 36, fontWeight: 900, color: "rgba(14,165,160,0.3)", marginBottom: 8, lineHeight: 1 }}>{num}</div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: "#e8eef8", marginBottom: 10 }}>{title}</div>
                  <div style={{ fontSize: 13, color: "#5d7399", lineHeight: 1.7 }}>{desc}</div>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ display: "none" }} aria-hidden="true" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "60px 24px 80px", textAlign: "center" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", background: "linear-gradient(135deg,rgba(14,165,160,0.15),rgba(27,79,138,0.15))", border: "1px solid rgba(14,165,160,0.25)", borderRadius: 24, padding: "48px 32px" }}>
          <h2 style={{ fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 800, color: "#e8eef8", marginBottom: 12 }}>
            Ready to Get Started?
          </h2>
          <p style={{ color: "#93a5c4", fontSize: 15, marginBottom: 28, lineHeight: 1.6 }}>
            Tell us what you need and we&apos;ll send a quote within 24 hours. No commitment required.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href={`https://wa.me/${WA_NUM}?text=${encodeURIComponent("Hi, I'd like to enquire about your services.")}`}
              target="_blank" rel="noreferrer"
              style={{ background: "#25d366", color: "#fff", fontWeight: 700, padding: "14px 24px", borderRadius: 10, textDecoration: "none", fontSize: 15 }}>
              WhatsApp Now
            </a>
            <Link href="/contact"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e8eef8", fontWeight: 600, padding: "14px 24px", borderRadius: 10, textDecoration: "none", fontSize: 15 }}>
              Send Enquiry
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "32px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: "#e8eef8", marginBottom: 6 }}>PACKPRO Food Packaging Solutions</div>
          <div style={{ fontSize: 13, color: "#5d7399" }}>Dholidub, Narnaul-Behror Road, Alwar, Rajasthan</div>
          <div style={{ marginTop: 8, fontSize: 12, color: "#3d5070" }}>
            +91 9057627625 · sales@packpro.site
          </div>
          <div style={{ marginTop: 16, fontSize: 12, color: "#3d5070" }}>
            © {new Date().getFullYear()} PACKPRO · All rights reserved
          </div>
        </div>
      </footer>

      {/* FLOATING WHATSAPP */}
      <a href={`https://wa.me/${WA_NUM}?text=${encodeURIComponent("Hi, I'd like to enquire about packaging services.")}`}
        target="_blank" rel="noreferrer"
        style={{ position: "fixed", bottom: 24, right: 24, width: 56, height: 56, borderRadius: "50%", background: "#25d366", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 24px rgba(37,211,102,0.4)", zIndex: 999, textDecoration: "none", fontSize: 26 }}>
        💬
      </a>
    </div>
  );
}
