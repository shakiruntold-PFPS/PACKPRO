"use client";
import { useState, useEffect, useCallback } from "react";
import { ExternalLink, Eye, EyeOff, Star, StarOff, Search, RefreshCw, Package } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export default function AdminCatalogPage() {
  const { success, error } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ limit: "200" });
      if (search) p.set("search", search);
      if (filter !== "ALL") p.set("status", filter);
      const res = await fetch(`/api/products?${p}`);
      const json = await res.json();
      setProducts(json.data?.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [search, filter]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  async function toggleCatalog(id: string, current: boolean) {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCatalogVisible: !current }),
      });
      if (!res.ok) throw new Error("Failed");
      setProducts(ps => ps.map(p => p.id === id ? { ...p, isCatalogVisible: !current } : p));
      success(!current ? "Added to catalog" : "Hidden from catalog");
    } catch {
      error("Failed to update");
    }
  }

  async function toggleFeatured(id: string, current: boolean) {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: !current }),
      });
      if (!res.ok) throw new Error("Failed");
      setProducts(ps => ps.map(p => p.id === id ? { ...p, isFeatured: !current } : p));
      success(!current ? "Marked as featured" : "Removed from featured");
    } catch {
      error("Failed to update");
    }
  }

  async function toggleStatus(id: string, current: string) {
    const next = current === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error("Failed");
      setProducts(ps => ps.map(p => p.id === id ? { ...p, status: next } : p));
      success(`Product ${next.toLowerCase()}`);
    } catch {
      error("Failed to update");
    }
  }

  const catalogVisible = products.filter(p => p.isCatalogVisible && p.status === "PUBLISHED").length;
  const featured = products.filter(p => p.isFeatured).length;

  return (
    <div className="module-page">
      <div className="module-header">
        <div>
          <h1 className="module-title">Catalog Manager</h1>
          <p className="module-subtitle">
            {catalogVisible} visible in catalog · {featured} featured · Control what customers see
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={fetchProducts}>
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <a href="/catalog" target="_blank" rel="noreferrer" className="btn-primary">
            <ExternalLink size={13} /> View Public Catalog
          </a>
        </div>
      </div>

      {/* Info Banner */}
      <div className="rounded-xl p-4 mb-5 flex items-start gap-3" style={{ background: "rgba(14,165,160,0.08)", border: "1px solid rgba(14,165,160,0.2)" }}>
        <ExternalLink size={14} style={{ color: "var(--brand)", marginTop: 1 }} />
        <div>
          <div className="text-sm font-semibold" style={{ color: "var(--brand)" }}>Your public catalog is live at <a href="/catalog" target="_blank" rel="noreferrer" className="underline">/catalog</a></div>
          <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Toggle visibility and featured status per product. Only PUBLISHED + visible products appear to customers.</div>
        </div>
      </div>

      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="search-bar flex-1 min-w-48">
          <Search size={13} style={{ color: "var(--text-muted)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…" />
        </div>
        {["ALL", "PUBLISHED", "DRAFT"].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={filter === s ? "btn-primary" : "btn-ghost"} style={{ padding: "7px 14px", fontSize: "12px" }}>
            {s}
          </button>
        ))}
      </div>

      <div className="glass rounded-2xl overflow-auto">
        <table className="erp-table">
          <thead>
            <tr>{["Product", "Category", "Price", "Stock", "Status", "Catalog", "Featured"].map(h => <th key={h}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} className="text-center py-8" style={{ color: "var(--text-muted)" }}>Loading…</td></tr>}
            {!loading && products.length === 0 && (
              <tr><td colSpan={7}>
                <div className="empty-state">
                  <Package size={36} />
                  <div className="text-sm mt-2 font-semibold">No products found</div>
                  <div className="text-xs mt-1">Add products in the Products module first</div>
                </div>
              </td></tr>
            )}
            {products.map(p => (
              <tr key={p.id}>
                <td>
                  <div className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{p.name}</div>
                  <div className="font-mono text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{p.code}</div>
                </td>
                <td style={{ color: "var(--text-muted)", fontSize: 13 }}>{p.category?.name ?? "—"}</td>
                <td className="font-semibold" style={{ color: "var(--brand-light)" }}>
                  {p.sellingPrice ? `₹${p.sellingPrice.toLocaleString("en-IN")}` : "—"}
                </td>
                <td style={{ color: p.stockQty <= (p.reorderLevel ?? 0) ? "#f59e0b" : "var(--text-muted)", fontSize: 13 }}>
                  {p.stockQty} {p.unit}
                </td>
                <td>
                  <button onClick={() => toggleStatus(p.id, p.status)}
                    className={`badge cursor-pointer ${p.status === "PUBLISHED" ? "badge-green" : "badge-gray"}`}>
                    {p.status}
                  </button>
                </td>
                <td>
                  <button onClick={() => toggleCatalog(p.id, p.isCatalogVisible)}
                    className="btn-ghost p-1.5" title={p.isCatalogVisible ? "Hide from catalog" : "Show in catalog"}>
                    {p.isCatalogVisible
                      ? <Eye size={14} style={{ color: "var(--brand)" }} />
                      : <EyeOff size={14} style={{ color: "var(--text-muted)" }} />}
                  </button>
                </td>
                <td>
                  <button onClick={() => toggleFeatured(p.id, p.isFeatured)}
                    className="btn-ghost p-1.5" title={p.isFeatured ? "Remove from featured" : "Mark as featured"}>
                    {p.isFeatured
                      ? <Star size={14} style={{ color: "#f59e0b" }} fill="#f59e0b" />
                      : <StarOff size={14} style={{ color: "var(--text-muted)" }} />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
