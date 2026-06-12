"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Plus, Search, Package, Trash2, RefreshCw,
  Star, CheckCircle, AlertCircle, X,
} from "lucide-react";

interface Category { id: string; name: string; }
interface Product {
  id: string;
  name: string;
  code: string;
  unit: string;
  moq: number;
  sellingPrice: number | null;
  stockQty: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  featured: boolean;
  gstRate: number;
  category: { id: string; name: string };
  createdAt: string;
}

const STATUS_STYLE: Record<string, string> = {
  PUBLISHED: "badge-green",
  DRAFT: "badge-gray",
  ARCHIVED: "badge-red",
};

const BLANK_FORM = {
  name: "", code: "", categoryId: "", unit: "pcs",
  moq: "500", sellingPrice: "", purchasePrice: "", gstRate: "18",
  description: "", status: "DRAFT" as const,
};

function Toast({ msg, ok, onDismiss }: { msg: string; ok: boolean; onDismiss: () => void }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl animate-in"
      style={{
        background: ok ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
        border: `1px solid ${ok ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.4)"}`,
        color: ok ? "#10b981" : "#ef4444",
        minWidth: "280px",
      }}>
      {ok ? <CheckCircle size={16} className="flex-shrink-0" /> : <AlertCircle size={16} className="flex-shrink-0" />}
      <span className="text-sm font-semibold flex-1">{msg}</span>
      <button onClick={onDismiss} className="ml-2 opacity-60 hover:opacity-100"><X size={14} /></button>
    </div>
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [view, setView] = useState<"table" | "grid">("table");
  const [selected, setSelected] = useState<Product | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  // ── GET /api/products ────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        limit: "100",
        ...(search && { search }),
        ...(statusFilter !== "ALL" && { status: statusFilter }),
      });
      const res = await fetch(`/api/products?${qs}`);
      const json = await res.json();
      if (json.success) {
        setProducts(json.data.data);
        setTotal(json.data.pagination.total);
      }
    } catch {
      showToast("Failed to load products", false);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  // ── GET /api/products/categories ─────────────────────────────
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/products/categories");
      const json = await res.json();
      if (json.success) setCategories(json.data);
    } catch {}
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  // ── POST /api/products ───────────────────────────────────────
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.categoryId) { showToast("Please select a category", false); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        code: form.code,
        categoryId: form.categoryId,
        unit: form.unit,
        moq: Number(form.moq) || 500,
        sellingPrice: form.sellingPrice ? Number(form.sellingPrice) : undefined,
        purchasePrice: form.purchasePrice ? Number(form.purchasePrice) : undefined,
        gstRate: Number(form.gstRate) || 18,
        description: form.description || undefined,
        status: form.status,
      };
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`"${json.data.name}" added successfully`, true);
        setForm(BLANK_FORM);
        setAddOpen(false);
        fetchProducts();
      } else {
        showToast(json.error || "Failed to add product", false);
      }
    } catch {
      showToast("Network error. Please try again.", false);
    } finally {
      setSaving(false);
    }
  }

  // ── DELETE /api/products/:id ─────────────────────────────────
  async function handleDelete(id: string, name: string) {
    if (!confirm(`Archive "${name}"? It will be hidden from the catalog.`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        showToast(`"${name}" archived`, true);
        if (selected?.id === id) setSelected(null);
        fetchProducts();
      } else {
        showToast(json.error || "Failed to archive", false);
      }
    } catch {
      showToast("Network error. Please try again.", false);
    } finally {
      setDeleting(null);
    }
  }

  const setField = (k: keyof typeof BLANK_FORM) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const published = products.filter((p) => p.status === "PUBLISHED").length;

  return (
    <div className="module-page">
      {toast && <Toast msg={toast.msg} ok={toast.ok} onDismiss={() => setToast(null)} />}

      {/* Header */}
      <div className="module-header">
        <div>
          <h1 className="module-title">Products</h1>
          <p className="module-subtitle">
            {total} total · {published} published
            {loading && <span className="ml-2 text-xs opacity-60">Loading…</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost" onClick={fetchProducts} disabled={loading}>
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
          {["table", "grid"].map((v) => (
            <button key={v} onClick={() => setView(v as any)}
              className={view === v ? "btn-primary" : "btn-ghost"}
              style={{ padding: "7px 12px", fontSize: "12px" }}>
              {v === "grid" ? "Grid" : "Table"}
            </button>
          ))}
          <button className="btn-primary" onClick={() => setAddOpen(true)}>
            <Plus size={14} /> Add Product
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="search-bar flex-1 min-w-48">
          <Search size={13} style={{ color: "var(--muted)" }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products, codes…" />
          {search && (
            <button onClick={() => setSearch("")} style={{ color: "var(--muted)" }}>
              <X size={13} />
            </button>
          )}
        </div>
        {["ALL", "PUBLISHED", "DRAFT", "ARCHIVED"].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={statusFilter === s ? "btn-primary" : "btn-ghost"}
            style={{ padding: "7px 12px", fontSize: "11px" }}>
            {s}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {!loading && products.length === 0 && (
        <div className="glass rounded-2xl">
          <div className="empty-state">
            <Package size={40} />
            <p className="text-sm mt-2 font-semibold">No products found</p>
            <p className="text-xs mt-1">Add your first product to get started</p>
            <button className="btn-primary mt-4" onClick={() => setAddOpen(true)}>
              <Plus size={13} /> Add Product
            </button>
          </div>
        </div>
      )}

      {/* Grid View */}
      {view === "grid" && products.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <div key={p.id} onClick={() => setSelected(p)}
              className="glass rounded-2xl p-4 cursor-pointer hover:bg-white/5 transition-all border border-white/8 hover:border-teal-500/30">
              <div className="w-full h-24 rounded-xl mb-3 flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,rgba(14,165,160,0.1),rgba(27,79,138,0.15))" }}>
                <Package size={28} style={{ color: "rgba(14,165,160,0.5)" }} />
              </div>
              <div className="font-semibold text-white text-sm leading-tight mb-1">{p.name}</div>
              <div className="flex items-center justify-between mt-2">
                <span className="font-mono text-xs" style={{ color: "#14c7c0" }}>{p.code}</span>
                <span className={`badge ${STATUS_STYLE[p.status]}`} style={{ fontSize: "9px" }}>{p.status}</span>
              </div>
              <div className="mt-2 font-bold text-white text-sm">
                {p.sellingPrice != null ? `₹${p.sellingPrice}/${p.unit}` : "—"}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table View */}
      {view === "table" && products.length > 0 && (
        <div className="glass rounded-2xl overflow-auto">
          <table className="erp-table">
            <thead>
              <tr>
                {["", "Product", "Code", "Category", "Unit", "MOQ", "Price", "GST", "Stock", "Status", ""].map((h, i) => (
                  <th key={i}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="cursor-pointer" onClick={() => setSelected(p)}>
                  <td>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: "rgba(14,165,160,0.1)" }}>
                      <Package size={14} style={{ color: "#0ea5a0" }} />
                    </div>
                  </td>
                  <td>
                    <div className="font-semibold text-white">{p.name}</div>
                    {p.featured && <div className="text-xs" style={{ color: "#f59e0b" }}>★ Featured</div>}
                  </td>
                  <td className="font-mono text-xs" style={{ color: "#14c7c0" }}>{p.code}</td>
                  <td style={{ color: "var(--muted)" }}>{p.category?.name ?? "—"}</td>
                  <td style={{ color: "var(--muted)" }}>{p.unit}</td>
                  <td style={{ color: "var(--muted)" }}>{p.moq.toLocaleString("en-IN")}</td>
                  <td className="font-bold text-white">
                    {p.sellingPrice != null ? `₹${p.sellingPrice}` : "—"}
                  </td>
                  <td style={{ color: "var(--muted)" }}>{p.gstRate}%</td>
                  <td className={p.stockQty < 100 ? "text-red-400 font-semibold" : "text-white font-semibold"}>
                    {p.stockQty.toLocaleString("en-IN")}
                  </td>
                  <td>
                    <span className={`badge ${STATUS_STYLE[p.status]}`}>{p.status}</span>
                  </td>
                  <td>
                    <button className="btn-danger p-1.5" disabled={deleting === p.id}
                      onClick={(e) => { e.stopPropagation(); handleDelete(p.id, p.name); }}
                      title="Archive product">
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Product Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.82)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div className="w-full max-w-lg rounded-2xl animate-in overflow-hidden"
            style={{ background: "#142645", border: "1px solid var(--border)" }}>
            <div className="p-5 border-b" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: "#14c7c0" }}>
                    {selected.code}
                  </div>
                  <h2 className="text-lg font-bold text-white">{selected.name}</h2>
                  <div className="text-sm mt-1" style={{ color: "var(--muted)" }}>{selected.category?.name}</div>
                </div>
                <div className="flex items-center gap-2">
                  {selected.featured && <Star size={14} fill="#f59e0b" style={{ color: "#f59e0b" }} />}
                  <span className={`badge ${STATUS_STYLE[selected.status]}`}>{selected.status}</span>
                  <button onClick={() => setSelected(null)} className="btn-ghost p-1.5">✕</button>
                </div>
              </div>
            </div>
            <div className="p-5 grid grid-cols-2 gap-3">
              {([
                ["Unit", selected.unit],
                ["MOQ", `${selected.moq.toLocaleString("en-IN")} ${selected.unit}`],
                ["Selling Price", selected.sellingPrice != null ? `₹${selected.sellingPrice}/${selected.unit}` : "—"],
                ["GST Rate", `${selected.gstRate}%`],
                ["Stock", `${selected.stockQty.toLocaleString("en-IN")} ${selected.unit}`],
                ["Price + GST", selected.sellingPrice != null ? `₹${(selected.sellingPrice * (1 + selected.gstRate / 100)).toFixed(2)}` : "—"],
              ] as [string, string][]).map(([k, v]) => (
                <div key={k} className="rounded-xl p-3" style={{ background: "var(--glass)", border: "1px solid var(--border)" }}>
                  <div className="erp-label mb-1" style={{ fontSize: 10 }}>{k}</div>
                  <div className="text-sm font-bold text-white">{v}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 p-5 pt-0">
              <button className="btn-danger flex-1 justify-center" disabled={deleting === selected.id}
                onClick={() => handleDelete(selected.id, selected.name)}>
                <Trash2 size={13} />
                {deleting === selected.id ? "Archiving…" : "Archive Product"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Drawer */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-end"
          style={{ background: "rgba(0,0,0,0.82)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setAddOpen(false); }}>
          <div className="h-full w-full max-w-xl overflow-y-auto animate-in"
            style={{ background: "#0d1f3c", borderLeft: "1px solid var(--border)" }}>
            <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b"
              style={{ background: "#0d1f3c", borderColor: "var(--border)", zIndex: 10 }}>
              <div>
                <h2 className="text-lg font-bold text-white">Add Product</h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>Saves directly to PostgreSQL</p>
              </div>
              <button onClick={() => setAddOpen(false)} className="btn-ghost p-2"><X size={16} /></button>
            </div>

            <form onSubmit={handleAdd} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="erp-label">Product Name <span style={{ color: "#ef4444" }}>*</span></label>
                  <input value={form.name} onChange={(e) => setField("name")(e.target.value)}
                    className="erp-input" placeholder="Paper Cup 8oz Ripple" required />
                </div>
                <div>
                  <label className="erp-label">Product Code <span style={{ color: "#ef4444" }}>*</span></label>
                  <input value={form.code} onChange={(e) => setField("code")(e.target.value.toUpperCase())}
                    className="erp-input" placeholder="CUP-R8OZ" required />
                </div>
                <div>
                  <label className="erp-label">Category <span style={{ color: "#ef4444" }}>*</span></label>
                  <select value={form.categoryId} onChange={(e) => setField("categoryId")(e.target.value)}
                    className="erp-input" style={{ background: "#0b1e3d" }} required>
                    <option value="" style={{ background: "#0b1e3d" }}>Select category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id} style={{ background: "#0b1e3d" }}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="erp-label">Selling Price (₹)</label>
                  <input type="number" value={form.sellingPrice} min="0" step="any"
                    onChange={(e) => setField("sellingPrice")(e.target.value)}
                    className="erp-input" placeholder="65.00" />
                </div>
                <div>
                  <label className="erp-label">Purchase Price (₹)</label>
                  <input type="number" value={form.purchasePrice} min="0" step="any"
                    onChange={(e) => setField("purchasePrice")(e.target.value)}
                    className="erp-input" placeholder="48.00" />
                </div>
                <div>
                  <label className="erp-label">GST %</label>
                  <select value={form.gstRate} onChange={(e) => setField("gstRate")(e.target.value)}
                    className="erp-input" style={{ background: "#0b1e3d" }}>
                    {["0", "5", "12", "18", "28"].map((r) => (
                      <option key={r} value={r} style={{ background: "#0b1e3d" }}>{r}%</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="erp-label">Unit</label>
                  <select value={form.unit} onChange={(e) => setField("unit")(e.target.value)}
                    className="erp-input" style={{ background: "#0b1e3d" }}>
                    {["pcs", "kg", "g", "litre", "box", "set", "pack", "dozen", "sets", "packs"].map((u) => (
                      <option key={u} value={u} style={{ background: "#0b1e3d" }}>{u}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="erp-label">MOQ</label>
                  <input type="number" value={form.moq} min="1"
                    onChange={(e) => setField("moq")(e.target.value)}
                    className="erp-input" placeholder="500" />
                </div>
              </div>

              <div>
                <label className="erp-label">Description</label>
                <textarea value={form.description} onChange={(e) => setField("description")(e.target.value)}
                  className="erp-input" rows={3} style={{ resize: "none" }}
                  placeholder="Optional product description…" />
              </div>

              <div>
                <label className="erp-label">Status</label>
                <div className="flex gap-2">
                  {["DRAFT", "PUBLISHED"].map((s) => (
                    <button key={s} type="button" onClick={() => setField("status")(s)}
                      className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                      style={{
                        background: form.status === s ? "rgba(14,165,160,0.2)" : "var(--glass)",
                        border: `1px solid ${form.status === s ? "#0ea5a0" : "var(--border)"}`,
                        color: form.status === s ? "#14c7c0" : "var(--muted)",
                      }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
                <button type="button" onClick={() => setAddOpen(false)}
                  className="btn-ghost flex-1 justify-center">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving…
                    </span>
                  ) : <><Plus size={14} /> Save to Database</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
