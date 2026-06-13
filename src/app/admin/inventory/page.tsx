"use client";
import { useState, useCallback, useEffect } from "react";
import { AlertTriangle, ArrowUp, Search, RefreshCw } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

function StockBadge({ qty, reorder }: { qty: number; reorder: number }) {
  if (qty === 0) return <span className="badge badge-red">Out of Stock</span>;
  if (qty <= reorder) return <span className="badge badge-red">Low Stock</span>;
  if (qty < reorder * 2) return <span className="badge badge-amber">Medium</span>;
  return <span className="badge badge-green">In Stock</span>;
}

export default function InventoryPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [adjModal, setAdjModal] = useState<any>(null);
  const [adjQty, setAdjQty] = useState("");
  const [adjType, setAdjType] = useState("ADJUSTMENT");
  const [adjNotes, setAdjNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const { success, error } = useToast();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products?limit=200&status=PUBLISHED");
      const json = await res.json();
      setProducts(json.data?.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.code ?? "").toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "ALL" ? true :
      filter === "LOW" ? p.stockQty <= (p.reorderLevel ?? 0) :
      filter === "OK" ? p.stockQty > (p.reorderLevel ?? 0) : true;
    return matchSearch && matchFilter;
  });

  const lowStockItems = products.filter(p => p.stockQty <= (p.reorderLevel ?? 0));
  const outOfStock = products.filter(p => p.stockQty === 0);

  async function applyAdjustment() {
    if (!adjModal || !adjQty) return;
    setSaving(true);
    try {
      const qty = parseFloat(adjQty);
      const isOut = ["SALE_OUT","DAMAGE"].includes(adjType);
      const change = isOut ? -Math.abs(qty) : Math.abs(qty);
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: adjModal.id, type: adjType, qty: change, notes: adjNotes }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      success("Stock updated", `${adjModal.name}: ${adjType}`);
      setAdjModal(null);
      setAdjQty("");
      setAdjNotes("");
      fetchProducts();
    } catch (err_: any) {
      error("Stock adjustment failed", err_.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="module-page">
      <div className="module-header">
        <div>
          <h1 className="module-title">Inventory</h1>
          <p className="module-subtitle">{products.length} products · {lowStockItems.length} low stock · {outOfStock.length} out of stock</p>
        </div>
        <button className="btn-ghost" onClick={fetchProducts}>
          <RefreshCw size={13} className={loading ? "animate-spin" : ""}/> Refresh
        </button>
      </div>



      {lowStockItems.length > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl mb-5"
          style={{ background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.3)" }}>
          <AlertTriangle size={16} style={{ color:"#f59e0b", flexShrink:0 }} />
          <span className="text-sm font-semibold" style={{ color:"#f59e0b" }}>
            {lowStockItems.length} item(s) below reorder level:&nbsp;
            {lowStockItems.map(i => i.name).join(", ")}
          </span>
        </div>
      )}

      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="search-bar flex-1 min-w-48">
          <Search size={13} style={{ color:"var(--muted)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…" />
        </div>
        {["ALL","LOW","OK"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)}
            className={filter===f?"btn-primary":"btn-ghost"}
            style={{ padding:"7px 14px", fontSize:"12px" }}>
            {f==="LOW"?`⚠ Low Stock (${lowStockItems.length})`:f}
          </button>
        ))}
      </div>

      <div className="glass rounded-2xl overflow-auto">
        <table className="erp-table">
          <thead>
            <tr>{["Product","Code","Category","In Stock","Reorder Level","Status","Actions"].map(h=><th key={h}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} className="text-center py-8" style={{ color:"var(--muted)" }}>Loading…</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-8" style={{ color:"var(--muted)" }}>No products found</td></tr>
            )}
            {filtered.map((item:any) => {
              const reorder = item.reorderLevel ?? 0;
              const isLow = item.stockQty <= reorder;
              return (
                <tr key={item.id}>
                  <td className="font-semibold text-white">{item.name}</td>
                  <td className="font-mono text-xs" style={{ color:"#14c7c0" }}>{item.code}</td>
                  <td style={{ color:"var(--muted)" }}>{item.category?.name ?? "—"}</td>
                  <td>
                    <span className={`font-bold text-sm ${isLow?"text-red-400":"text-white"}`}>
                      {(item.stockQty??0).toLocaleString("en-IN")} {item.unit}
                    </span>
                  </td>
                  <td style={{ color:"var(--muted)" }}>{reorder.toLocaleString("en-IN")} {item.unit}</td>
                  <td><StockBadge qty={item.stockQty??0} reorder={reorder} /></td>
                  <td>
                    <button className="btn-ghost p-1.5" onClick={()=>setAdjModal(item)} title="Adjust Stock">
                      <ArrowUp size={12}/>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {adjModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background:"rgba(0,0,0,0.8)" }}>
          <div className="w-full max-w-md rounded-2xl p-6 animate-in"
            style={{ background:"#142645", border:"1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">Stock Adjustment</h3>
              <button onClick={()=>setAdjModal(null)} className="btn-ghost p-1.5 text-xs">✕</button>
            </div>
            <div className="mb-4 p-3 rounded-lg" style={{ background:"var(--glass)", border:"1px solid var(--border)" }}>
              <div className="font-semibold text-white">{adjModal.name}</div>
              <div className="text-sm mt-1" style={{ color:"var(--muted)" }}>
                Current Stock: <span className="text-white font-bold">{adjModal.stockQty} {adjModal.unit}</span>
              </div>
            </div>
            <div className="space-y-3 mb-5">
              <div>
                <label className="erp-label">Transaction Type</label>
                <select value={adjType} onChange={e=>setAdjType(e.target.value)} className="erp-input"
                  style={{ background:"#0b1e3d" }}>
                  {[["PURCHASE_IN","Purchase In"],["RETURN_IN","Return In"],["OPENING","Opening Stock"],["SALE_OUT","Sale Out"],["DAMAGE","Damage / Loss"],["ADJUSTMENT","Manual Adjustment"]].map(([v,l])=>(
                    <option key={v} value={v} style={{ background:"#0b1e3d" }}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="erp-label">Quantity</label>
                <input type="number" value={adjQty} onChange={e=>setAdjQty(e.target.value)}
                  className="erp-input" placeholder="Enter quantity" min="1"/>
              </div>
              <div>
                <label className="erp-label">Notes</label>
                <input value={adjNotes} onChange={e=>setAdjNotes(e.target.value)}
                  className="erp-input" placeholder="Reason for adjustment…"/>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={()=>setAdjModal(null)} className="btn-ghost flex-1 justify-center">Cancel</button>
              <button onClick={applyAdjustment} disabled={saving} className="btn-primary flex-1 justify-center">
                {saving ? "Saving…" : "Apply Adjustment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
