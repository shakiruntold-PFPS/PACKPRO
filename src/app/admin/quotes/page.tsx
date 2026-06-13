"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import {
  Plus, Search, Send, Eye, RefreshCw, Trash2, X, CheckCircle, ShoppingCart,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

/* ─── Types ─────────────────────────────────────────────── */
interface Party   { id: string; name: string; gstin?: string; city?: string; state?: string; }
interface Product { id: string; name: string; code: string; unit?: string; sellingPrice?: number; gstRate?: number; }
interface LineItem {
  productId: string;
  productName: string;
  qty: string;
  unit: string;
  unitPrice: string;
  discount: string;
  gstRate: string;
  isInterState: boolean;
}

const BLANK_ITEM: LineItem = {
  productId: "", productName: "", qty: "1", unit: "pcs",
  unitPrice: "", discount: "0", gstRate: "18", isInterState: false,
};

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "badge-gray", SENT: "badge-blue", VIEWED: "badge-purple",
  APPROVED: "badge-green", REJECTED: "badge-red", EXPIRED: "badge-orange", CONVERTED: "badge-teal",
};

/* ─── Calc helper (mirrors invoices) ─────────────────────── */
function calcItem(item: LineItem) {
  const qty = Number(item.qty) || 0;
  const price = Number(item.unitPrice) || 0;
  const disc = Number(item.discount) || 0;
  const gst = Number(item.gstRate) || 0;
  const taxable = qty * price - disc;
  const taxAmt = (taxable * gst) / 100;
  const half = taxAmt / 2;
  return {
    taxable,
    cgst: item.isInterState ? 0 : half,
    sgst: item.isInterState ? 0 : half,
    igst: item.isInterState ? taxAmt : 0,
    total: taxable + taxAmt,
  };
}

/* ─── Inline product typeahead ───────────────────────────── */
function ProductSearch({
  value, onSelect,
}: {
  value: string;
  onSelect: (p: Product) => void;
}) {
  const [q, setQ] = useState(value);
  const [results, setResults] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setQ(value); }, [value]);

  function handleChange(v: string) {
    setQ(v);
    if (timer.current) clearTimeout(timer.current);
    if (!v) { setResults([]); return; }
    timer.current = setTimeout(async () => {
      const res = await fetch(`/api/products?search=${encodeURIComponent(v)}&limit=8`);
      const json = await res.json();
      if (json.success) setResults(json.data.data ?? []);
      setOpen(true);
    }, 300);
  }

  return (
    <div className="relative">
      <input
        value={q}
        onChange={e => handleChange(e.target.value)}
        onFocus={() => q && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="erp-input"
        placeholder="Search product…"
        autoComplete="off"
      />
      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 rounded-xl overflow-hidden z-30 shadow-xl"
          style={{ background: "#142645", border: "1px solid var(--border)" }}>
          {results.map(p => (
            <button key={p.id} type="button"
              className="w-full text-left px-3 py-2 hover:bg-white/5 transition-colors"
              onMouseDown={() => { onSelect(p); setQ(p.name); setOpen(false); }}>
              <div className="text-sm font-semibold text-white">{p.name}</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>{p.code}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── View / Actions Modal ───────────────────────────────── */
function QuoteModal({ quote, onClose, onRefresh }: { quote: any; onClose: () => void; onRefresh: () => void; }) {
  const { success, error } = useToast();
  const [acting, setActing] = useState<string | null>(null);

  if (!quote) return null;

  async function markSent() {
    setActing("sent");
    try {
      const res = await fetch(`/api/quotes/${quote.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "SENT" }),
      });
      const json = await res.json();
      if (json.success) { success("Quote marked as Sent"); onClose(); onRefresh(); }
      else error("Failed", json.error ?? "Unknown error");
    } catch { error("Network error"); }
    finally { setActing(null); }
  }

  async function convertToOrder() {
    setActing("convert");
    try {
      const res = await fetch(`/api/quotes/${quote.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "convert" }),
      });
      const json = await res.json();
      if (json.success) {
        success("Sales Order Created", `Order ${json.data.number} created`);
        onClose(); onRefresh();
      } else error("Conversion Failed", json.error ?? "Unknown error");
    } catch { error("Network error"); }
    finally { setActing(null); }
  }

  async function deleteQuote() {
    if (!confirm(`Delete quote ${quote.number}? This cannot be undone.`)) return;
    setActing("delete");
    try {
      const res = await fetch(`/api/quotes/${quote.id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) { success("Quote deleted"); onClose(); onRefresh(); }
      else error("Delete Failed", json.error ?? "Unknown error");
    } catch { error("Network error"); }
    finally { setActing(null); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-2xl rounded-2xl animate-in overflow-hidden"
        style={{ background: "#142645", border: "1px solid var(--border)", maxHeight: "90vh", overflowY: "auto" }}>

        {/* Header */}
        <div className="p-5 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: "#14c7c0" }}>Quotation</div>
              <h2 className="text-xl font-black text-white">{quote.number}</h2>
              <div className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{quote.party?.name}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`badge ${STATUS_STYLE[quote.status] ?? ""}`}>{quote.status}</span>
              <button onClick={onClose} className="btn-ghost p-1.5"><X size={15} /></button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-5">
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              ["Valid Till", quote.validTill ? formatDate(quote.validTill) : "—"],
              ["Created By", quote.createdBy?.name ?? "—"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl p-3" style={{ background: "var(--glass)", border: "1px solid var(--border)" }}>
                <div className="erp-label mb-1" style={{ fontSize: 10 }}>{k}</div>
                <div className="text-sm font-semibold text-white">{v}</div>
              </div>
            ))}
          </div>

          {/* Items */}
          {quote.items && quote.items.length > 0 && (
            <div className="mb-5 glass rounded-xl overflow-auto">
              <table className="erp-table">
                <thead>
                  <tr>{["Product", "Qty", "Rate", "GST %", "Total"].map(h => <th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {quote.items.map((item: any, i: number) => (
                    <tr key={i}>
                      <td className="font-semibold text-white">{item.product?.name ?? item.description ?? "—"}</td>
                      <td style={{ color: "var(--text-muted)" }}>{item.qty} {item.unit}</td>
                      <td style={{ color: "var(--text-muted)" }}>₹{Number(item.unitPrice).toLocaleString("en-IN")}</td>
                      <td style={{ color: "var(--text-muted)" }}>{item.gstRate}%</td>
                      <td className="font-bold text-white">₹{Number(item.total ?? 0).toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Totals */}
          <div className="rounded-xl p-4 mb-5" style={{ background: "var(--glass)", border: "1px solid var(--border)" }}>
            {[
              ["Subtotal", `₹${Number(quote.subtotal ?? 0).toLocaleString("en-IN")}`],
              ["GST", `₹${Number(quote.taxAmount ?? 0).toLocaleString("en-IN")}`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm py-1">
                <span style={{ color: "var(--text-muted)" }}>{k}</span>
                <span className="text-white">{v}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold pt-2 border-t text-white" style={{ borderColor: "var(--border)" }}>
              <span>Total</span>
              <span style={{ color: "#14c7c0" }}>₹{Number(quote.total ?? 0).toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* Notes */}
          {quote.notes && (
            <div className="rounded-xl p-3 mb-5 text-sm" style={{ background: "var(--glass)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
              <div className="erp-label mb-1" style={{ fontSize: 10 }}>Notes</div>
              {quote.notes}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            {quote.status === "DRAFT" && (
              <button
                className="btn-ghost flex items-center gap-1.5"
                onClick={markSent}
                disabled={acting !== null}>
                <Send size={13} />
                {acting === "sent" ? "Marking…" : "Mark as Sent"}
              </button>
            )}
            {quote.status === "APPROVED" && (
              <button
                className="btn-primary flex items-center gap-1.5"
                onClick={convertToOrder}
                disabled={acting !== null}>
                <ShoppingCart size={13} />
                {acting === "convert" ? "Converting…" : "Convert to Order"}
              </button>
            )}
            <button
              className="btn-ghost flex items-center gap-1.5 ml-auto"
              onClick={deleteQuote}
              disabled={acting !== null}
              style={{ color: "#ef4444" }}>
              <Trash2 size={13} />
              {acting === "delete" ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Create Quote Drawer ────────────────────────────────── */
function CreateQuoteDrawer({ onClose, onCreated }: { onClose: () => void; onCreated: () => void; }) {
  const { success, error } = useToast();

  /* Party search */
  const [partySearch, setPartySearch] = useState("");
  const [partyResults, setPartyResults] = useState<Party[]>([]);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [partyOpen, setPartyOpen] = useState(false);
  const partyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Form fields */
  const [validTill, setValidTill] = useState("");
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [items, setItems] = useState<LineItem[]>([{ ...BLANK_ITEM }]);
  const [saving, setSaving] = useState(false);

  /* Party typeahead */
  useEffect(() => {
    if (!partySearch) { setPartyResults([]); return; }
    if (partyTimer.current) clearTimeout(partyTimer.current);
    partyTimer.current = setTimeout(async () => {
      const res = await fetch(`/api/parties?search=${encodeURIComponent(partySearch)}&limit=8`);
      const json = await res.json();
      if (json.success) setPartyResults(json.data.data ?? []);
      setPartyOpen(true);
    }, 300);
    return () => { if (partyTimer.current) clearTimeout(partyTimer.current); };
  }, [partySearch]);

  /* Item helpers */
  function updItem(idx: number, k: keyof LineItem, v: any) {
    setItems(p => p.map((it, i) => i === idx ? { ...it, [k]: v } : it));
  }
  function addItem() { setItems(p => [...p, { ...BLANK_ITEM }]); }
  function rmItem(idx: number) { setItems(p => p.filter((_, i) => i !== idx)); }
  function onProductSelect(idx: number, prod: Product) {
    setItems(p => p.map((it, i) => i !== idx ? it : {
      ...it,
      productId: prod.id,
      productName: prod.name,
      unit: prod.unit ?? it.unit,
      unitPrice: prod.sellingPrice != null ? String(prod.sellingPrice) : it.unitPrice,
      gstRate: prod.gstRate != null ? String(prod.gstRate) : it.gstRate,
    }));
  }

  /* Calc totals */
  const calcs = items.map(calcItem);
  const subtotal = calcs.reduce((s, c) => s + c.taxable, 0);
  const totalTax = calcs.reduce((s, c) => s + c.cgst + c.sgst + c.igst, 0);
  const grandTotal = subtotal + totalTax;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedParty) { error("Party Required", "Please select a customer"); return; }
    if (!validTill) { error("Date Required", "Please set a valid till date"); return; }
    if (items.some(it => !it.productId || !it.unitPrice)) {
      error("Incomplete Items", "Select a product and set unit price for all rows");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        partyId: selectedParty.id,
        validTill,
        notes: notes || undefined,
        terms: terms || undefined,
        items: items.map(it => ({
          productId: it.productId,
          qty: Number(it.qty),
          unit: it.unit,
          unitPrice: Number(it.unitPrice),
          discount: Number(it.discount) || 0,
          gstRate: Number(it.gstRate),
        })),
      };
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        success(
          `Quote ${json.data.number} created`,
          `₹${Number(json.data.total).toLocaleString("en-IN")}`,
        );
        onCreated();
        onClose();
      } else {
        error("Failed to create quote", json.error ?? "Unknown error");
      }
    } catch {
      error("Network error", "Please try again");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-end"
      style={{ background: "rgba(0,0,0,0.8)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="h-full w-full max-w-2xl overflow-y-auto animate-in"
        style={{ background: "#0d1f3c", borderLeft: "1px solid var(--border)" }}>

        {/* Sticky header */}
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b"
          style={{ background: "#0d1f3c", borderColor: "var(--border)", zIndex: 10 }}>
          <div>
            <h2 className="text-lg font-bold text-white">New Quote</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              Total: <span className="font-bold" style={{ color: "#14c7c0" }}>₹{grandTotal.toFixed(2)}</span>
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost p-2"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {/* Quote details */}
          <section>
            <div className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: "#14c7c0", letterSpacing: "1.5px" }}>Quote Details</div>
            <div>
              <label className="erp-label">Valid Till <span style={{ color: "#ef4444" }}>*</span></label>
              <input
                type="date"
                value={validTill}
                onChange={e => setValidTill(e.target.value)}
                className="erp-input"
                required />
            </div>
          </section>

          {/* Party */}
          <section>
            <div className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: "#14c7c0", letterSpacing: "1.5px" }}>Customer</div>
            {selectedParty ? (
              <div className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: "rgba(14,165,160,0.1)", border: "1px solid rgba(14,165,160,0.3)" }}>
                <div>
                  <div className="font-bold text-white">{selectedParty.name}</div>
                  {selectedParty.gstin && (
                    <div className="text-xs font-mono mt-0.5" style={{ color: "var(--text-muted)" }}>
                      GSTIN: {selectedParty.gstin}
                    </div>
                  )}
                </div>
                <button type="button" onClick={() => { setSelectedParty(null); setPartySearch(""); }} className="btn-ghost p-1.5">
                  <X size={13} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="search-bar">
                  <Search size={13} style={{ color: "var(--text-muted)" }} />
                  <input
                    value={partySearch}
                    onChange={e => { setPartySearch(e.target.value); setPartyOpen(true); }}
                    onFocus={() => setPartyOpen(true)}
                    onBlur={() => setTimeout(() => setPartyOpen(false), 150)}
                    placeholder="Search customer name…"
                    autoComplete="off"
                  />
                </div>
                {partyOpen && partyResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 rounded-xl overflow-hidden z-20 shadow-xl"
                    style={{ background: "#142645", border: "1px solid var(--border)" }}>
                    {partyResults.map(p => (
                      <button key={p.id} type="button"
                        className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors"
                        onMouseDown={() => { setSelectedParty(p); setPartyOpen(false); setPartySearch(""); }}>
                        <div className="font-semibold text-white text-sm">{p.name}</div>
                        {p.city && <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{p.city}</div>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Line Items */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-bold uppercase tracking-widest"
                style={{ color: "#14c7c0", letterSpacing: "1.5px" }}>Line Items</div>
              <button type="button" onClick={addItem} className="btn-ghost" style={{ padding: "4px 10px", fontSize: "12px" }}>
                <Plus size={12} /> Add Row
              </button>
            </div>
            <div className="space-y-3">
              {items.map((item, idx) => {
                const c = calcItem(item);
                return (
                  <div key={idx} className="rounded-xl p-4"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>

                    {/* Row 1: product + unit + remove */}
                    <div className="grid grid-cols-6 gap-2 mb-2">
                      <div className="col-span-4">
                        <label className="erp-label" style={{ fontSize: 10 }}>Product *</label>
                        <ProductSearch
                          value={item.productName}
                          onSelect={p => onProductSelect(idx, p)}
                        />
                      </div>
                      <div>
                        <label className="erp-label" style={{ fontSize: 10 }}>Unit</label>
                        <select
                          value={item.unit}
                          onChange={e => updItem(idx, "unit", e.target.value)}
                          className="erp-input"
                          style={{ background: "#0b1e3d" }}>
                          {["pcs", "kg", "g", "litre", "box", "set", "pack", "dozen"].map(u => (
                            <option key={u} value={u} style={{ background: "#0b1e3d" }}>{u}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-end pb-0.5">
                        <button
                          type="button"
                          onClick={() => rmItem(idx)}
                          disabled={items.length === 1}
                          className="btn-ghost p-2 w-full justify-center"
                          style={{ color: "#ef4444", opacity: items.length === 1 ? 0.3 : 1 }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Row 2: qty, price, discount, gst, total */}
                    <div className="grid grid-cols-5 gap-2 mb-2">
                      <div>
                        <label className="erp-label" style={{ fontSize: 10 }}>Qty *</label>
                        <input
                          type="number" value={item.qty} min="0.01" step="any"
                          onChange={e => updItem(idx, "qty", e.target.value)}
                          className="erp-input" required />
                      </div>
                      <div>
                        <label className="erp-label" style={{ fontSize: 10 }}>Unit Price *</label>
                        <input
                          type="number" value={item.unitPrice} min="0" step="any"
                          onChange={e => updItem(idx, "unitPrice", e.target.value)}
                          className="erp-input" placeholder="0.00" required />
                      </div>
                      <div>
                        <label className="erp-label" style={{ fontSize: 10 }}>Discount ₹</label>
                        <input
                          type="number" value={item.discount} min="0" step="any"
                          onChange={e => updItem(idx, "discount", e.target.value)}
                          className="erp-input" />
                      </div>
                      <div>
                        <label className="erp-label" style={{ fontSize: 10 }}>GST %</label>
                        <select
                          value={item.gstRate}
                          onChange={e => updItem(idx, "gstRate", e.target.value)}
                          className="erp-input"
                          style={{ background: "#0b1e3d" }}>
                          {["0", "5", "12", "18", "28"].map(r => (
                            <option key={r} value={r} style={{ background: "#0b1e3d" }}>{r}%</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="erp-label" style={{ fontSize: 10 }}>Line Total</label>
                        <div className="erp-input font-bold" style={{ color: "#14c7c0", cursor: "default" }}>
                          ₹{c.total.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Inter-state toggle */}
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.isInterState}
                          onChange={e => updItem(idx, "isInterState", e.target.checked)}
                          className="accent-teal-500" />
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>Inter-state (IGST)</span>
                      </label>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                        Taxable: ₹{c.taxable.toFixed(2)} |{" "}
                        {item.isInterState
                          ? `IGST: ₹${c.igst.toFixed(2)}`
                          : `CGST: ₹${c.cgst.toFixed(2)} + SGST: ₹${c.sgst.toFixed(2)}`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Totals summary */}
          <div className="rounded-xl p-4" style={{ background: "rgba(14,165,160,0.05)", border: "1px solid rgba(14,165,160,0.2)" }}>
            {[["Subtotal", `₹${subtotal.toFixed(2)}`], ["Total GST", `₹${totalTax.toFixed(2)}`]].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm mb-1.5">
                <span style={{ color: "var(--text-muted)" }}>{k}</span>
                <span className="text-white">{v}</span>
              </div>
            ))}
            <div className="flex justify-between font-black text-lg pt-2 border-t"
              style={{ borderColor: "rgba(14,165,160,0.3)" }}>
              <span className="text-white">Grand Total</span>
              <span style={{ color: "#14c7c0" }}>₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="erp-label">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="erp-input"
              rows={3}
              style={{ resize: "none" }}
              placeholder="Internal notes or special instructions…" />
          </div>

          {/* Footer buttons */}
          <div className="flex gap-3 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
            <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving
                ? <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating…
                  </span>
                : <><Plus size={14} /> Create Quote</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────── */
export default function QuotesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selected, setSelected] = useState<any>(null);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (search) params.set("search", search);
      const res = await fetch(`/api/quotes?${params}`);
      const json = await res.json();
      setQuotes(json.data?.data ?? []);
      setTotal(json.data?.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { fetchQuotes(); }, [fetchQuotes]);

  const pipelineValue = quotes
    .filter((q: any) => !["REJECTED", "EXPIRED"].includes(q.status))
    .reduce((s: number, q: any) => s + (q.total ?? 0), 0);

  return (
    <div className="module-page">
      {/* Header */}
      <div className="module-header">
        <div>
          <h1 className="module-title">Quotations</h1>
          <p className="module-subtitle">
            Pipeline: ₹{(pipelineValue / 100000).toFixed(1)}L · {total} quotes
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={fetchQuotes} disabled={loading}>
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={14} /> New Quote
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="search-bar flex-1 min-w-48">
          <Search size={13} style={{ color: "var(--text-muted)" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search quotes…" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["ALL", "DRAFT", "SENT", "APPROVED", "REJECTED", "CONVERTED"].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={statusFilter === s ? "btn-primary" : "btn-ghost"}
              style={{ padding: "7px 12px", fontSize: "11px" }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-auto">
        <table className="erp-table">
          <thead>
            <tr>
              {["Quote #", "Customer", "Created By", "Valid Till", "Subtotal", "GST", "Total", "Status", "Actions"].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={9} className="text-center py-8" style={{ color: "var(--text-muted)" }}>Loading…</td></tr>
            )}
            {!loading && quotes.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-10" style={{ color: "var(--text-muted)" }}>
                  <div className="flex flex-col items-center gap-3">
                    <span>No quotes found</span>
                    <button className="btn-primary" onClick={() => setShowCreate(true)}>
                      <Plus size={13} /> Create First Quote
                    </button>
                  </div>
                </td>
              </tr>
            )}
            {quotes.map((q: any) => (
              <tr key={q.id} className="cursor-pointer" onClick={() => setSelected(q)}>
                <td className="font-bold" style={{ color: "#14c7c0" }}>{q.number}</td>
                <td className="font-semibold text-white">{q.party?.name ?? "—"}</td>
                <td style={{ color: "var(--text-muted)" }}>{q.createdBy?.name ?? "—"}</td>
                <td style={{ color: "var(--text-muted)" }}>{q.validTill ? formatDate(q.validTill) : "—"}</td>
                <td style={{ color: "var(--text-muted)" }}>₹{Number(q.subtotal ?? 0).toLocaleString("en-IN")}</td>
                <td style={{ color: "var(--text-muted)" }}>₹{Number(q.taxAmount ?? 0).toLocaleString("en-IN")}</td>
                <td className="font-bold text-white">₹{Number(q.total ?? 0).toLocaleString("en-IN")}</td>
                <td><span className={`badge ${STATUS_STYLE[q.status] ?? ""}`}>{q.status}</span></td>
                <td>
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    <button className="btn-ghost p-1.5" onClick={() => setSelected(q)} title="View">
                      <Eye size={12} />
                    </button>
                    <button
                      className="btn-ghost p-1.5"
                      title="Mark as Sent"
                      onClick={async () => {
                        if (q.status !== "DRAFT") return;
                        await fetch(`/api/quotes/${q.id}`, {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ status: "SENT" }),
                        });
                        fetchQuotes();
                      }}>
                      <Send size={12} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {selected && (
        <QuoteModal
          quote={selected}
          onClose={() => setSelected(null)}
          onRefresh={fetchQuotes}
        />
      )}
      {showCreate && (
        <CreateQuoteDrawer
          onClose={() => setShowCreate(false)}
          onCreated={fetchQuotes}
        />
      )}
    </div>
  );
}
