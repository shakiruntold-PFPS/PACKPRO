"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Phone, MessageCircle, Package, X } from "lucide-react";

export default function CatalogPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [selected, setSelected] = useState<any>(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (search) p.set("search", search);
      if (category) p.set("category", category);
      const res = await fetch(`/api/catalog?${p}`);
      const json = await res.json();
      setProducts(json.data?.products ?? []);
      setCategories(json.data?.categories ?? []);
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  useEffect(() => { fetch_(); }, [fetch_]);

  function waLink(product?: any) {
    const msg = product
      ? `Hi, I'd like to enquire about ${product.name} (${product.code}). Please share pricing and availability.`
      : "Hi, I'd like to get a quote for packaging products.";
    return `https://wa.me/919057627625?text=${encodeURIComponent(msg)}`;
  }

  return (
    <div style={{ background: "#070f1e", minHeight: "100vh", color: "#e8eef8", fontFamily: "system-ui, sans-serif" }}>
      {/* NAV */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(7,15,30,0.95)", backdropFilter: "blur(12px)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#0ea5a0,#1b4f8a)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 12, color: "#fff" }}>P</div>
            <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: 2, color: "#e8eef8" }}>PACKPRO</span>
          </Link>
          <a href={waLink()} target="_blank" rel="noreferrer"
            style={{ background: "#25d366", color: "#fff", fontWeight: 700, fontSize: 13, padding: "8px 16px", borderRadius: 8, textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
            <MessageCircle size={14} /> Get Quote
          </a>
        </div>
      </nav>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 20px" }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "#e8eef8", marginBottom: 6 }}>Product Catalog</h1>
          <p style={{ fontSize: 14, color: "#5d7399" }}>{products.length} products available · Contact us for bulk pricing</p>
        </div>

        {/* Search + Filter */}
        <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 220, display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "0 12px" }}>
            <Search size={14} style={{ color: "#5d7399" }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search products…"
              style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#e8eef8", fontSize: 14, padding: "10px 0" }} />
            {search && <button onClick={() => setSearch("")} style={{ color: "#5d7399", background: "none", border: "none", cursor: "pointer", padding: 0 }}><X size={13} /></button>}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button onClick={() => setCategory("")}
              style={{ padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "1px solid", borderColor: !category ? "rgba(14,165,160,0.5)" : "rgba(255,255,255,0.08)", background: !category ? "rgba(14,165,160,0.12)" : "rgba(255,255,255,0.03)", color: !category ? "#14c7c0" : "#5d7399" }}>
              All
            </button>
            {categories.map((c: any) => (
              <button key={c.id} onClick={() => setCategory(c.id)}
                style={{ padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "1px solid", borderColor: category === c.id ? "rgba(14,165,160,0.5)" : "rgba(255,255,255,0.08)", background: category === c.id ? "rgba(14,165,160,0.12)" : "rgba(255,255,255,0.03)", color: category === c.id ? "#14c7c0" : "#5d7399" }}>
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#5d7399" }}>Loading products…</div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#5d7399" }}>
            <Package size={40} style={{ opacity: 0.3, margin: "0 auto 12px" }} />
            <div>No products found</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 14 }}>
            {products.map((p: any) => (
              <div key={p.id} onClick={() => setSelected(p)} style={{ background: "rgba(15,30,56,0.9)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, overflow: "hidden", cursor: "pointer", transition: "border-color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(14,165,160,0.35)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}>
                <div style={{ height: 140, background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  {p.images?.[0]?.url
                    ? <img src={p.images[0].url} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ fontSize: 36, opacity: 0.25 }}>📦</span>}
                </div>
                <div style={{ padding: 14 }}>
                  <div style={{ fontSize: 10, color: "#0ea5a0", fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>{p.category?.name ?? ""}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#e8eef8", marginBottom: 4, lineHeight: 1.3 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: "#5d7399", fontFamily: "monospace" }}>{p.code}</div>
                  {p.sellingPrice
                    ? <div style={{ marginTop: 10, fontSize: 17, fontWeight: 900, color: "#14c7c0" }}>₹{p.sellingPrice.toLocaleString("en-IN")}<span style={{ fontSize: 10, fontWeight: 400, color: "#5d7399" }}> / {p.unit}</span></div>
                    : <div style={{ marginTop: 10, fontSize: 12, color: "#5d7399" }}>Contact for price</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div style={{ width: "100%", maxWidth: 480, background: "#0b1629", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, overflow: "hidden" }}>
            <div style={{ height: 200, background: "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
              {selected.images?.[0]?.url
                ? <img src={selected.images[0].url} alt={selected.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ fontSize: 60, opacity: 0.2 }}>📦</span>}
              <button onClick={() => setSelected(null)}
                style={{ position: "absolute", top: 12, right: 12, width: 32, height: 32, borderRadius: 8, background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.1)", color: "#e8eef8", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={14} />
              </button>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ fontSize: 11, color: "#0ea5a0", fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>{selected.category?.name}</div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#e8eef8", marginBottom: 6 }}>{selected.name}</h2>
              <div style={{ fontSize: 12, color: "#5d7399", fontFamily: "monospace", marginBottom: 12 }}>Code: {selected.code}</div>
              {selected.shortDesc && <p style={{ fontSize: 14, color: "#93a5c4", lineHeight: 1.6, marginBottom: 12 }}>{selected.shortDesc}</p>}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
                {[
                  ["Unit", selected.unit],
                  ["GST Rate", `${selected.gstRate ?? 18}%`],
                  selected.brand ? ["Brand", selected.brand] : null,
                  selected.subcategory ? ["Type", selected.subcategory] : null,
                ].filter(Boolean).map(([k, v]: any) => (
                  <div key={k} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "8px 12px" }}>
                    <div style={{ fontSize: 10, color: "#5d7399", marginBottom: 2 }}>{k}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#e8eef8" }}>{v}</div>
                  </div>
                ))}
              </div>
              {selected.sellingPrice && (
                <div style={{ fontSize: 24, fontWeight: 900, color: "#14c7c0", marginBottom: 16 }}>
                  ₹{selected.sellingPrice.toLocaleString("en-IN")}
                  <span style={{ fontSize: 13, fontWeight: 400, color: "#5d7399" }}> / {selected.unit}</span>
                </div>
              )}
              <a href={waLink(selected)} target="_blank" rel="noreferrer"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#25d366", color: "#fff", fontWeight: 700, padding: "13px 0", borderRadius: 10, textDecoration: "none", fontSize: 15 }}>
                <MessageCircle size={16} /> Enquire on WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Floating WA button */}
      <a href={waLink()} target="_blank" rel="noreferrer"
        style={{ position: "fixed", bottom: 24, right: 24, zIndex: 90, width: 54, height: 54, borderRadius: "50%", background: "#25d366", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(37,211,102,0.4)", textDecoration: "none" }}>
        <MessageCircle size={22} color="#fff" />
      </a>
    </div>
  );
}
