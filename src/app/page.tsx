import Link from "next/link";
import { db } from "@/lib/db";

async function getHomeData() {
  const [settings, products, categories] = await Promise.all([
    db.companySettings.findUnique({ where: { id: "default" } }).catch(() => null),
    db.product.findMany({
      where: { isCatalogVisible: true, status: "PUBLISHED", featured: true },
      include: { category: { select: { name: true } }, images: { select: { url: true }, take: 1 } },
      take: 6,
      orderBy: { name: "asc" },
    }).catch(() => []),
    db.category.findMany({ orderBy: { name: "asc" } }).catch(() => []),
  ]);
  return { settings, products, categories };
}

export default async function HomePage() {
  const { settings, products, categories } = await getHomeData();

  const company = settings ?? {
    name: "PACKPRO Food Packaging Solutions",
    tagline: "Premium Packaging for Food & Hospitality",
    address: "Dholidub, Narnaul-Behror Road, Alwar, Rajasthan",
    city: "Alwar",
    state: "Rajasthan",
    phone: "+91 9057627625",
    email: "sales@packpro.site",
    website: "www.packpro.site",
  };

  return (
    <div style={{ background: "#070f1e", minHeight: "100vh", color: "#e8eef8", fontFamily: "system-ui, sans-serif" }}>
      {/* NAV */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(7,15,30,0.92)", backdropFilter: "blur(12px)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#0ea5a0,#1b4f8a)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14, color: "#fff" }}>P</div>
            <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: 2, color: "#e8eef8" }}>PACKPRO</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link href="/catalog" style={{ color: "#93a5c4", fontSize: 14, textDecoration: "none", padding: "6px 12px", borderRadius: 8 }}>Catalog</Link>
            <a href={`tel:${company.phone}`} style={{ color: "#93a5c4", fontSize: 14, textDecoration: "none", padding: "6px 12px", borderRadius: 8 }}>{company.phone}</a>
            <a href={`https://wa.me/${company.phone?.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
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
          PREMIUM PACKAGING SOLUTIONS
        </div>
        <h1 style={{ fontSize: "clamp(32px, 6vw, 64px)", fontWeight: 900, lineHeight: 1.1, margin: "0 0 20px", letterSpacing: -1 }}>
          <span style={{ background: "linear-gradient(135deg,#e8eef8,#93a5c4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Food Packaging
          </span>
          <br />
          <span style={{ background: "linear-gradient(135deg,#14c7c0,#0ea5a0)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Built for India
          </span>
        </h1>
        <p style={{ fontSize: 18, color: "#93a5c4", maxWidth: 560, margin: "0 auto 36px", lineHeight: 1.6 }}>
          Disposable cups, meal boxes, carry bags, and custom packaging for restaurants, hotels, and food chains across India.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/catalog" style={{ background: "linear-gradient(135deg,#0ea5a0,#0c8c87)", color: "#fff", fontWeight: 700, fontSize: 15, padding: "14px 28px", borderRadius: 10, textDecoration: "none" }}>
            Browse Catalog →
          </Link>
          <a href={`https://wa.me/${company.phone?.replace(/\D/g, "")}?text=${encodeURIComponent("Hi, I'd like to get a quote for packaging products.")}`}
            target="_blank" rel="noreferrer"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e8eef8", fontWeight: 600, fontSize: 15, padding: "14px 28px", borderRadius: 10, textDecoration: "none" }}>
            Get a Quote
          </a>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 40, justifyContent: "center", marginTop: 60, flexWrap: "wrap" }}>
          {[["500+", "Products"], ["10K+", "Customers"], ["15+", "Years Experience"], ["Pan India", "Delivery"]].map(([n, l]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#14c7c0" }}>{n}</div>
              <div style={{ fontSize: 13, color: "#5d7399", marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      {categories.length > 0 && (
        <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 60px" }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20, color: "#e8eef8" }}>Product Categories</h2>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/catalog" style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid rgba(14,165,160,0.4)", background: "rgba(14,165,160,0.1)", color: "#14c7c0", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
              All Products
            </Link>
            {(categories as any[]).map((c: any) => (
              <Link key={c.id} href={`/catalog?category=${c.id}`}
                style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "#93a5c4", fontWeight: 600, fontSize: 13, textDecoration: "none" }}>
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* FEATURED PRODUCTS */}
      {products.length > 0 && (
        <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 80px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#e8eef8" }}>Featured Products</h2>
            <Link href="/catalog" style={{ color: "#0ea5a0", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>View all →</Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 }}>
            {(products as any[]).map((p: any) => (
              <Link key={p.id} href={`/catalog?search=${encodeURIComponent(p.name)}`} style={{ textDecoration: "none" }}>
                <div style={{ background: "rgba(15,30,56,0.9)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden", transition: "border-color 0.2s" }}>
                  <div style={{ height: 160, background: "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {p.images?.[0]?.url
                      ? <img src={p.images[0].url} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <div style={{ fontSize: 40, opacity: 0.3 }}>📦</div>}
                  </div>
                  <div style={{ padding: 16 }}>
                    <div style={{ fontSize: 11, color: "#0ea5a0", fontWeight: 700, marginBottom: 4, letterSpacing: 1 }}>{p.category?.name ?? ""}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#e8eef8", marginBottom: 6 }}>{p.name}</div>
                    {p.shortDesc && <div style={{ fontSize: 12, color: "#5d7399", lineHeight: 1.5 }}>{p.shortDesc}</div>}
                    {p.sellingPrice && (
                      <div style={{ marginTop: 12, fontSize: 18, fontWeight: 900, color: "#14c7c0" }}>
                        ₹{p.sellingPrice.toLocaleString("en-IN")}
                        <span style={{ fontSize: 11, color: "#5d7399", fontWeight: 400 }}> / {p.unit}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* WHY US */}
      <section style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "60px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 40, textAlign: "center", color: "#e8eef8" }}>Why Choose PACKPRO?</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 20 }}>
            {[
              ["🚚", "Pan India Delivery", "We ship to all major cities and towns across India within 3-5 business days"],
              ["🏭", "Direct from Factory", "No middlemen — competitive pricing direct from our manufacturing unit in Alwar"],
              ["✅", "Quality Assured", "Food-grade materials, BIS certified products, strict quality checks"],
              ["💬", "Dedicated Support", "WhatsApp support, bulk order assistance, and custom packaging solutions"],
            ].map(([icon, title, desc]) => (
              <div key={title} style={{ background: "rgba(15,30,56,0.6)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 24 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{icon}</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#e8eef8", marginBottom: 8 }}>{title}</div>
                <div style={{ fontSize: 13, color: "#5d7399", lineHeight: 1.6 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "60px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", background: "linear-gradient(135deg,rgba(14,165,160,0.15),rgba(27,79,138,0.15))", border: "1px solid rgba(14,165,160,0.25)", borderRadius: 24, padding: "48px 32px" }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12, color: "#e8eef8" }}>Ready to Order?</h2>
          <p style={{ color: "#93a5c4", fontSize: 15, marginBottom: 28 }}>Talk to our team for bulk pricing, samples, and custom packaging.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href={`https://wa.me/${company.phone?.replace(/\D/g, "")}?text=${encodeURIComponent("Hi, I'd like to get a quote for packaging products.")}`}
              target="_blank" rel="noreferrer"
              style={{ background: "#25d366", color: "#fff", fontWeight: 700, padding: "14px 24px", borderRadius: 10, textDecoration: "none", fontSize: 15 }}>
              WhatsApp Now
            </a>
            <a href={`mailto:${company.email}`}
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e8eef8", fontWeight: 600, padding: "14px 24px", borderRadius: 10, textDecoration: "none", fontSize: 15 }}>
              {company.email}
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "32px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ fontSize: 13, color: "#5d7399" }}>
            © {new Date().getFullYear()} {company.name} · {company.address}, {company.state}
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: "#3d5070" }}>
            {company.phone} · {company.email}
          </div>
        </div>
      </footer>
    </div>
  );
}
