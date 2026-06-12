"use client";
import { useState } from "react";
import { Package, AlertTriangle, Plus, ArrowDown, ArrowUp, Search } from "lucide-react";

const MOCK_STOCK = [
  { id: "1", name: "Paper Cups 8oz", code: "CUP-8OZ", category: "Paper Cups", unit: "pcs", stockQty: 12500, reorderLevel: 2000, moq: 500, lastTxn: "2025-06-08" },
  { id: "2", name: "Paper Cups 12oz", code: "CUP-12OZ", category: "Paper Cups", unit: "pcs", stockQty: 8200, reorderLevel: 2000, moq: 500, lastTxn: "2025-06-07" },
  { id: "3", name: "Kraft Bowl 500ml", code: "KBWL-500", category: "Food Containers", unit: "pcs", stockQty: 85, reorderLevel: 1000, moq: 500, lastTxn: "2025-06-06" },
  { id: "4", name: "Clear PET Cup 450ml", code: "PET-450", category: "PET Containers", unit: "pcs", stockQty: 4300, reorderLevel: 1000, moq: 1000, lastTxn: "2025-06-05" },
  { id: "5", name: "Meal Box Large", code: "MBOX-L", category: "Food Containers", unit: "pcs", stockQty: 320, reorderLevel: 500, moq: 500, lastTxn: "2025-06-04" },
  { id: "6", name: "Ripple Cup 8oz", code: "RCU-8OZ", category: "Paper Cups", unit: "pcs", stockQty: 6800, reorderLevel: 1500, moq: 500, lastTxn: "2025-06-03" },
  { id: "7", name: "Sweet Box Small", code: "SWBX-S", category: "Bakery Packaging", unit: "pcs", stockQty: 150, reorderLevel: 500, moq: 500, lastTxn: "2025-06-02" },
  { id: "8", name: "Paper Bag Medium", code: "PBAG-M", category: "Paper Bags", unit: "pcs", stockQty: 2100, reorderLevel: 500, moq: 500, lastTxn: "2025-06-01" },
];

function StockBadge({ qty, reorder }: { qty: number; reorder: number }) {
  const pct = (qty / reorder) * 100;
  if (qty === 0) return <span className="badge badge-red">Out of Stock</span>;
  if (qty <= reorder) return <span className="badge badge-red">Low Stock</span>;
  if (pct < 200) return <span className="badge badge-amber">Medium</span>;
  return <span className="badge badge-green">In Stock</span>;
}

export default function InventoryPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [adjModal, setAdjModal] = useState<any>(null);
  const [adjQty, setAdjQty] = useState("");
  const [adjType, setAdjType] = useState("ADJUSTMENT");
  const [adjNotes, setAdjNotes] = useState("");
  const [stock, setStock] = useState(MOCK_STOCK);

  const lowStockItems = stock.filter(s => s.stockQty <= s.reorderLevel);
  const outOfStock = stock.filter(s => s.stockQty === 0);

  const filtered = stock.filter(s => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.code.includes(search.toUpperCase());
    const matchFilter =
      filter === "ALL" ? true :
      filter === "LOW" ? s.stockQty <= s.reorderLevel :
      filter === "OK" ? s.stockQty > s.reorderLevel : true;
    return matchSearch && matchFilter;
  });

  function applyAdjustment() {
    if (!adjModal || !adjQty) return;
    const qty = parseFloat(adjQty);
    const isOut = ["SALE_OUT", "DAMAGE"].includes(adjType);
    const change = isOut ? -Math.abs(qty) : Math.abs(qty);
    setStock(s => s.map(p => p.id === adjModal.id ? { ...p, stockQty: Math.max(0, p.stockQty + change), lastTxn: new Date().toISOString().slice(0, 10) } : p));
    setAdjModal(null);
    setAdjQty("");
    setAdjNotes("");
  }

  return (
    <div className="module-page">
      <div className="module-header">
        <div>
          <h1 className="module-title">Inventory</h1>
          <p className="module-subtitle">{stock.length} products · {lowStockItems.length} low stock · {outOfStock.length} out of stock</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost">
            <ArrowDown size={13} /> Stock In
          </button>
          <button className="btn-primary">
            <Plus size={14} /> Adjust Stock
          </button>
        </div>
      </div>

      {/* Alert banner */}
      {lowStockItems.length > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl mb-5"
          style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)" }}>
          <AlertTriangle size={16} style={{ color: "#f59e0b", flexShrink: 0 }} />
          <span className="text-sm font-semibold" style={{ color: "#f59e0b" }}>
            {lowStockItems.length} item(s) below reorder level:&nbsp;
            {lowStockItems.map(i => i.name).join(", ")}
          </span>
        </div>
      )}

      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="search-bar flex-1 min-w-48">
          <Search size={13} style={{ color: "var(--muted)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…" />
        </div>
        {["ALL", "LOW", "OK"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={filter === f ? "btn-primary" : "btn-ghost"}
            style={{ padding: "7px 14px", fontSize: "12px" }}>
            {f === "LOW" ? `⚠ Low Stock (${lowStockItems.length})` : f}
          </button>
        ))}
      </div>

      <div className="glass rounded-2xl overflow-auto">
        <table className="erp-table">
          <thead>
            <tr>
              {["Product", "Code", "Category", "In Stock", "Reorder Level", "Status", "Last Updated", "Actions"].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(item => {
              const isLow = item.stockQty <= item.reorderLevel;
              return (
                <tr key={item.id}>
                  <td className="font-semibold text-white">{item.name}</td>
                  <td className="font-mono text-xs" style={{ color: "#14c7c0" }}>{item.code}</td>
                  <td style={{ color: "var(--muted)" }}>{item.category}</td>
                  <td>
                    <div>
                      <span className={`font-bold text-sm ${isLow ? "text-red-400" : "text-white"}`}>
                        {item.stockQty.toLocaleString("en-IN")} {item.unit}
                      </span>
                      <div className="w-24 h-1.5 rounded-full mt-1" style={{ background: "var(--border)" }}>
                        <div className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, (item.stockQty / (item.reorderLevel * 3)) * 100)}%`,
                            background: isLow ? "#ef4444" : "#10b981",
                          }} />
                      </div>
                    </div>
                  </td>
                  <td style={{ color: "var(--muted)" }}>{item.reorderLevel.toLocaleString("en-IN")} {item.unit}</td>
                  <td><StockBadge qty={item.stockQty} reorder={item.reorderLevel} /></td>
                  <td style={{ color: "var(--muted)", fontSize: 12 }}>{item.lastTxn}</td>
                  <td>
                    <div className="flex gap-1">
                      <button className="btn-ghost p-1.5 text-xs" onClick={() => setAdjModal(item)}
                        title="Adjust Stock">
                        <ArrowUp size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Adjustment Modal */}
      {adjModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.8)" }}>
          <div className="w-full max-w-md rounded-2xl p-6 animate-in"
            style={{ background: "#142645", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">Stock Adjustment</h3>
              <button onClick={() => setAdjModal(null)} className="btn-ghost p-1.5 text-xs">✕</button>
            </div>
            <div className="mb-4 p-3 rounded-lg" style={{ background: "var(--glass)", border: "1px solid var(--border)" }}>
              <div className="font-semibold text-white">{adjModal.name}</div>
              <div className="text-sm mt-1" style={{ color: "var(--muted)" }}>
                Current Stock: <span className="text-white font-bold">{adjModal.stockQty} {adjModal.unit}</span>
              </div>
            </div>
            <div className="space-y-3 mb-5">
              <div>
                <label className="erp-label">Transaction Type</label>
                <select value={adjType} onChange={e => setAdjType(e.target.value)} className="erp-input"
                  style={{ background: "#0b1e3d" }}>
                  {[["PURCHASE_IN","Purchase In"],["RETURN_IN","Return In"],["OPENING","Opening Stock"],["SALE_OUT","Sale Out"],["DAMAGE","Damage / Loss"],["ADJUSTMENT","Manual Adjustment"]].map(([v,l]) => (
                    <option key={v} value={v} style={{ background: "#0b1e3d" }}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="erp-label">Quantity</label>
                <input type="number" value={adjQty} onChange={e => setAdjQty(e.target.value)}
                  className="erp-input" placeholder="Enter quantity" min="1" />
              </div>
              <div>
                <label className="erp-label">Notes</label>
                <input value={adjNotes} onChange={e => setAdjNotes(e.target.value)}
                  className="erp-input" placeholder="Reason for adjustment…" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setAdjModal(null)} className="btn-ghost flex-1 justify-center">Cancel</button>
              <button onClick={applyAdjustment} className="btn-primary flex-1 justify-center">Apply Adjustment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
