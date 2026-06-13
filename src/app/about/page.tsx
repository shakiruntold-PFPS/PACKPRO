import Link from "next/link";

export const metadata = {
  title: "About PACKPRO | Food Packaging Solutions",
  description: "Founded in 2009, PACKPRO has been manufacturing food-grade disposable packaging for restaurants, hotels, and food chains across India.",
};

const PHONE = "+91 9057627625";
const WA_NUM = "919057627625";
const EMAIL = "sales@packpro.site";
const ADDRESS = "Dholidub, Narnaul-Behror Road, Alwar, Rajasthan";

export default function AboutPage() {
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
            <Link href="/about" style={{ color: "#14c7c0", fontSize: 14, textDecoration: "none", padding: "6px 12px", borderRadius: 8, fontWeight: 700 }}>About</Link>
            <Link href="/services" style={{ color: "#93a5c4", fontSize: 14, textDecoration: "none", padding: "6px 12px", borderRadius: 8 }}>Services</Link>
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
          OUR STORY
        </div>
        <h1 style={{ fontSize: "clamp(32px, 6vw, 60px)", fontWeight: 900, lineHeight: 1.1, margin: "0 0 20px", letterSpacing: -1 }}>
          <span style={{ background: "linear-gradient(135deg,#e8eef8,#93a5c4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            About
          </span>
          {" "}
          <span style={{ background: "linear-gradient(135deg,#14c7c0,#0ea5a0)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            PACKPRO
          </span>
        </h1>
        <p style={{ fontSize: 18, color: "#93a5c4", maxWidth: 600, margin: "0 auto", lineHeight: 1.7 }}>
          India&apos;s trusted manufacturer of food-grade disposable packaging — serving restaurants, hotels, and food chains since 2009.
        </p>
      </section>

      {/* STORY */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{ display: "flex", gap: 48, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: "1 1 320px" }}>
            <div style={{ width: "100%", minHeight: 280, background: "linear-gradient(135deg,rgba(14,165,160,0.15),rgba(27,79,138,0.2))", border: "1px solid rgba(14,165,160,0.2)", borderRadius: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 64 }}>🏭</div>
                <div style={{ marginTop: 16, fontSize: 14, color: "#5d7399" }}>Manufacturing Unit · Alwar, Rajasthan</div>
              </div>
            </div>
          </div>
          <div style={{ flex: "1 1 320px" }}>
            <h2 style={{ fontSize: "clamp(22px, 3vw, 32px)", fontWeight: 800, color: "#e8eef8", marginBottom: 20, lineHeight: 1.3 }}>
              Built from the ground up in Alwar
            </h2>
            <p style={{ color: "#93a5c4", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>
              Founded in 2009, PACKPRO has been manufacturing food-grade disposable packaging from our state-of-the-art facility in Alwar, Rajasthan. What started as a small regional supplier has grown into a pan-India distribution network trusted by over 10,000 customers.
            </p>
            <p style={{ color: "#93a5c4", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>
              Our product range covers everything a food business needs — from single-use cups and meal boxes to carry bags, clamshells, and custom-branded packaging. Every product we manufacture meets food-safety standards and is designed to protect food quality during transit and service.
            </p>
            <p style={{ color: "#93a5c4", fontSize: 15, lineHeight: 1.8 }}>
              As a direct manufacturer, we eliminate middlemen to offer the most competitive pricing in the market, while maintaining uncompromising quality through in-house quality control at every production stage.
            </p>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "80px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "clamp(22px, 3vw, 36px)", fontWeight: 800, color: "#e8eef8", marginBottom: 12 }}>What We Stand For</h2>
            <p style={{ color: "#5d7399", fontSize: 15 }}>The values that drive every decision at PACKPRO</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 }}>
            {[
              { icon: "✅", title: "Quality First", desc: "Every product undergoes rigorous quality checks. We use only food-grade, BIS-certified raw materials that meet the highest safety standards." },
              { icon: "🤝", title: "Customer Focus", desc: "From your first enquiry to final delivery, we assign dedicated support. Bulk orders, samples, and custom specs — we handle it all with care." },
              { icon: "🌱", title: "Sustainable", desc: "We continuously invest in eco-friendly packaging alternatives, reducing plastic and transitioning toward compostable materials for a greener future." },
              { icon: "🚚", title: "Pan India", desc: "Our logistics network reaches every major city and district across India. Reliable, timely delivery so your business never runs short of packaging." },
            ].map(({ icon, title, desc }) => (
              <div key={title} style={{ background: "rgba(15,30,56,0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 28 }}>
                <div style={{ fontSize: 36, marginBottom: 16 }}>{icon}</div>
                <div style={{ fontWeight: 800, fontSize: 16, color: "#e8eef8", marginBottom: 10 }}>{title}</div>
                <div style={{ fontSize: 13, color: "#5d7399", lineHeight: 1.7 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={{ padding: "60px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", background: "linear-gradient(135deg,rgba(14,165,160,0.1),rgba(27,79,138,0.1))", border: "1px solid rgba(14,165,160,0.2)", borderRadius: 24, padding: "48px 32px" }}>
          <div style={{ display: "flex", gap: 40, justifyContent: "center", flexWrap: "wrap", textAlign: "center" }}>
            {[
              ["15+", "Years of Experience"],
              ["500+", "Products"],
              ["10,000+", "Customers Served"],
              ["Pan India", "Delivery Network"],
            ].map(([num, label]) => (
              <div key={label}>
                <div style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 900, color: "#14c7c0", lineHeight: 1 }}>{num}</div>
                <div style={{ fontSize: 13, color: "#5d7399", marginTop: 6, maxWidth: 120 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "40px 24px 80px", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(22px, 3vw, 32px)", fontWeight: 800, color: "#e8eef8", marginBottom: 12 }}>Let&apos;s Work Together</h2>
          <p style={{ color: "#93a5c4", fontSize: 15, marginBottom: 28, lineHeight: 1.6 }}>
            Whether you need bulk orders, custom branding, or just want to learn more — we&apos;re always happy to talk.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href={`https://wa.me/${WA_NUM}?text=${encodeURIComponent("Hi, I'd like to know more about PACKPRO.")}`}
              target="_blank" rel="noreferrer"
              style={{ background: "#25d366", color: "#fff", fontWeight: 700, padding: "14px 24px", borderRadius: 10, textDecoration: "none", fontSize: 15 }}>
              WhatsApp Us
            </a>
            <Link href="/contact"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e8eef8", fontWeight: 600, padding: "14px 24px", borderRadius: 10, textDecoration: "none", fontSize: 15 }}>
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "32px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: "#e8eef8", marginBottom: 6 }}>PACKPRO Food Packaging Solutions</div>
          <div style={{ fontSize: 13, color: "#5d7399" }}>{ADDRESS}</div>
          <div style={{ marginTop: 8, fontSize: 12, color: "#3d5070" }}>
            {PHONE} · {EMAIL}
          </div>
          <div style={{ marginTop: 16, fontSize: 12, color: "#3d5070" }}>
            © {new Date().getFullYear()} PACKPRO · All rights reserved
          </div>
        </div>
      </footer>

      {/* FLOATING WHATSAPP */}
      <a href={`https://wa.me/${WA_NUM}?text=${encodeURIComponent("Hi, I'd like to enquire about packaging products.")}`}
        target="_blank" rel="noreferrer"
        style={{ position: "fixed", bottom: 24, right: 24, width: 56, height: 56, borderRadius: "50%", background: "#25d366", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 24px rgba(37,211,102,0.4)", zIndex: 999, textDecoration: "none", fontSize: 26 }}>
        💬
      </a>
    </div>
  );
}
