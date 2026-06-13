"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import {
  Plus, Search, Eye, RefreshCw, Trash2, X, CheckCircle, Package,
  Truck, IndianRupee,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

/* ─── Types ────────────────────────────────────────────────── */
interface Vendor  { id: string; name: string; gstin?: string; city?: string; state?: string; phone?: string; }
interface Product { id: string; name: string; code: string; unit?: string; purchasePrice?: number; sellingPrice?: number; gstRate?: number; }
interface LineItem {
  productId: string;
  productName: string;
  qty: string;
  unit: string;
  unitPrice: string;
  discount: string;
  gstRate: string;
}
interface PurchaseOrder {
  id: string;
  number: string;
  vendor: { id: string; name: string };
  status: string;
  createdAt: string;
  expectedDate?: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  shippingCharges?: number;
  otherCharges?: number;
  notes?: string;
  paymentMethod?: string;
  advancePaid?: number;
  _count?: { items: number };
  items?: any[];
}

/* ─── Constants ─────────────────────────────────────────────── */
const BLANK_ITEM: LineItem = {
  productId: "", productName: "", qty: "1", unit: "pcs",
  unitPrice: "", discount: "0", gstRate: "18",
};

const STATUS_BADGE: Record<string, string> = {
  DRAFT: "badge-gray", CONFIRMED: "badge-blue",
  PARTIAL: "badge-amber", RECEIVED: "badge-green", CANCELLED: "badge-red",
};

function calcItem(item: LineItem) {
  const qty = Number(item.qty) || 0;
  const price = Number(item.unitPrice) || 0;
  const disc = Number(item.discount) || 0;
  const gst = Number(item.gstRate) || 0;
  const taxable = qty * price - disc;
  const gstAmt = (taxable * gst) / 100;
  return { taxable, gstAmt, total: taxable + gstAmt };
}

function genPONumber() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const xxx = String(Math.floor(Math.random() * 900) + 100);
  return `PO-${yy}${mm}${dd}-${xxx}`;
}

/* ─── Product Typeahead ─────────────────────────────────────── */
function ProductSearch({ value, onSelect }: { value: string; onSelect: (p: Product) => void; }) {
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
      if (json.success) { setResults(json.data.data ?? []); setOpen(true); }
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

/* ─── View Modal ─────────────────────────────────────────────── */
function ViewModal({ po, onClose, onRefresh }: { po: PurchaseOrder; onClose: () => void; onRefresh: () => void; }) {
  const { success, error } = useToast();
  const [full, setFull] = useState<PurchaseOrder | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/purchases/${po.id}`)
      .then(r => r.json())
      .then(j => { if (j.success) setFull(j.data); });
  }, [po.id]);

  const data = full ?? po;

  async function updateStatus(status: string) {
    setActing(status);
    try {
      const res = await fetch(`/api/purchases/${po.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (json.success) {
        success(`PO marked as ${status}`, status === "RECEIVED" ? "Inventory updated" : undefined);
        onClose(); onRefresh();
      } else error("Failed", json.error ?? "Unknown error");
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
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "var(--border)" }}>
          <div>
            <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: "#14c7c0" }}>Purchase Order</div>
            <h2 className="text-xl font-black text-white">{data.number}</h2>
            <div className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{data.vendor?.name}</div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`badge ${STATUS_BADGE[data.status] ?? "badge-gray"}`}>{data.status}</span>
            <button onClick={onClose} className="btn-ghost p-1.5"><X size={15} /></button>
          </div>
        </div>

        <div className="p-5">
          {/* Meta */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              ["Vendor", data.vendor?.name ?? "—"],
              ["Status", data.status],
              ["PO Date", formatDate(data.createdAt)],
              ["Expected Delivery", data.expectedDate ? formatDate(data.expectedDate) : "—"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl p-3" style={{ background: "var(--glass)", border: "1px solid var(--border)" }}>
                <div className="erp-label mb-1" style={{ fontSize: 10 }}>{k}</div>
                <div className="text-sm font-semibold text-white">{v}</div>
              </div>
            ))}
          </div>

          {/* Items */}
          {full?.items && full.items.length > 0 && (
            <div className="mb-5 glass rounded-xl overflow-auto">
              <table className="erp-table">
                <thead>
                  <tr>{["Product", "Qty", "Unit", "Rate", "GST %", "GST Amt", "Total"].map(h => <th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {full.items.map((item: any, i: number) => (
                    <tr key={i}>
                      <td className="font-semibold text-white">{item.product?.name ?? "—"}</td>
                      <td style={{ color: "var(--text-muted)" }}>{item.qty}</td>
                      <td style={{ color: "var(--text-muted)" }}>{item.unit}</td>
                      <td style={{ color: "var(--text-muted)" }}>₹{Number(item.unitPrice).toLocaleString("en-IN")}</td>
                      <td style={{ color: "var(--text-muted)" }}>{item.gstRate}%</td>
                      <td style={{ color: "var(--text-muted)" }}>₹{Number(item.gstAmount ?? 0).toLocaleString("en-IN")}</td>
                      <td className="font-bold text-white">₹{Number(item.total ?? 0).toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Financials */}
          <div className="rounded-xl p-4 mb-5" style={{ background: "var(--glass)", border: "1px solid var(--border)" }}>
            {[
              ["Subtotal", `₹${Number(data.subtotal ?? 0).toLocaleString("en-IN")}`],
              ["Tax", `₹${Number(data.taxAmount ?? 0).toLocaleString("en-IN")}`],
              ...(data.shippingCharges ? [["Shipping", `₹${Number(data.shippingCharges).toLocaleString("en-IN")}`]] : []),
              ...(data.otherCharges ? [["Other Charges", `₹${Number(data.otherCharges).toLocaleString("en-IN")}`]] : []),
              ...(data.advancePaid ? [["Advance Paid", `₹${Number(data.advancePaid).toLocaleString("en-IN")}`]] : []),
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm py-1">
                <span style={{ color: "var(--text-muted)" }}>{k}</span>
                <span className="text-white">{v}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold pt-2 border-t text-white" style={{ borderColor: "var(--border)" }}>
              <span>Grand Total</span>
              <span style={{ color: "#14c7c0" }}>₹{Number(data.total ?? 0).toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* Notes */}
          {data.notes && (
            <div className="rounded-xl p-3 mb-5 text-sm" style={{ background: "var(--glass)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
              <div className="erp-label mb-1" style={{ fontSize: 10 }}>Notes</div>
              {data.notes}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            {data.status === "DRAFT" && (
              <button className="btn-ghost flex items-center gap-1.5" onClick={() => updateStatus("CONFIRMED")} disabled={acting !== null}>
                <CheckCircle size={13} />
                {acting === "CONFIRMED" ? "Confirming…" : "Confirm Order"}
              </button>
            )}
            {(data.status === "CONFIRMED" || data.status === "PARTIAL") && (
              <button className="btn-primary flex items-center gap-1.5" onClick={() => updateStatus("RECEIVED")} disabled={acting !== null}>
                <Truck size={13} />
                {acting === "RECEIVED" ? "Updating…" : "Mark as Received"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Create Drawer ──────────────────────────────────────────── */
function CreateDrawer({ onClose, onCreated }: { onClose: () => void; onCreated: () => void; }) {
  const { success, error } = useToast();

  /* Vendor search */
  const [vendorSearch, setVendorSearch] = useState("");
  const [vendorResults, setVendorResults] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [vendorOpen, setVendorOpen] = useState(false);
  const vendorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* PO fields */
  const [poNumber] = useState(genPONumber);
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [expectedDate, setExpectedDate] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [notes, setNotes] = useState("");
  const [isInterState, setIsInterState] = useState(false);

  /* Line items */
  const [items, setItems] = useState<LineItem[]>([{ ...BLANK_ITEM }]);

  /* Charges / payment */
  const [shippingCharges, setShippingCharges] = useState("0");
  const [otherCharges, setOtherCharges] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
  const [refNumber, setRefNumber] = useState("");
  const [advancePaid, setAdvancePaid] = useState("0");

  const [saving, setSaving] = useState(false);

  /* Vendor typeahead */
  useEffect(() => {
    if (!vendorSearch) { setVendorResults([]); return; }
    if (vendorTimer.current) clearTimeout(vendorTimer.current);
    vendorTimer.current = setTimeout(async () => {
      const res = await fetch(`/api/parties?search=${encodeURIComponent(vendorSearch)}&type=VENDOR&limit=8`);
      const json = await res.json();
      if (json.success) setVendorResults(json.data.data ?? []);
      setVendorOpen(true);
    }, 300);
    return () => { if (vendorTimer.current) clearTimeout(vendorTimer.current); };
  }, [vendorSearch]);

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
      unitPrice: prod.purchasePrice != null ? String(prod.purchasePrice) : (prod.sellingPrice != null ? String(prod.sellingPrice) : it.unitPrice),
      gstRate: prod.gstRate != null ? String(prod.gstRate) : it.gstRate,
    }));
  }

  /* Totals */
  const calcs = items.map(calcItem);
  const subtotal = calcs.reduce((s, c) => s + c.taxable, 0);
  const totalTax = calcs.reduce((s, c) => s + c.gstAmt, 0);
  const shipping = Number(shippingCharges) || 0;
  const other = Number(otherCharges) || 0;
  const grandTotal = subtotal + totalTax + shipping + other;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedVendor) { error("Vendor Required", "Please select a vendor"); return; }
    if (items.some(it => !it.productId || !it.unitPrice)) {
      error("Incomplete Items", "Select a product and set unit price for all rows");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        vendorId: selectedVendor.id,
        status,
        purchaseDate,
        expectedDate: expectedDate || undefined,
        notes: notes || undefined,
        shippingCharges: shipping || undefined,
        otherCharges: other || undefined,
        paymentMethod,
        refNumber: refNumber || undefined,
        advancePaid: Number(advancePaid) || undefined,
        items: items.map(it => ({
          productId: it.productId,
          qty: Number(it.qty),
          unit: it.unit,
          unitPrice: Number(it.unitPrice),
          discount: Number(it.discount) || 0,
          gstRate: Number(it.gstRate),
        })),
      };
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        success(`${json.data.number} created`, `₹${Number(json.data.total).toLocaleString("en-IN")}`);
        onCreated(); onClose();
      } else error("Failed", json.error ?? "Unknown error");
    } catch { error("Network error", "Please try again"); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end"
      style={{ background: "rgba(0,0,0,0.8)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="h-full w-full max-w-2xl overflow-y-auto animate-in"
        style={{ background: "#0d1f3c", borderLeft: "1px solid var(--border)" }}>

        {/* Sticky header */}
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b"
          style={{ background: "#0d1f3c", borderColor: "var(--border)", zIndex: 10 }}>
          <div>
            <h2 className="text-lg font-bold text-white">New Purchase Order</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              Total: <span className="font-bold" style={{ color: "#14c7c0" }}>₹{grandTotal.toFixed(2)}</span>
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost p-2"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {/* Section 1: Vendor */}
          <section>
            <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#14c7c0", letterSpacing: "1.5px" }}>Vendor</div>
            {selectedVendor ? (
              <div className="flex items-start justify-between p-3 rounded-xl"
                style={{ background: "rgba(14,165,160,0.1)", border: "1px solid rgba(14,165,160,0.3)" }}>
                <div>
                  <div className="font-bold text-white">{selectedVendor.name}</div>
                  {selectedVendor.gstin && <div className="text-xs font-mono mt-0.5" style={{ color: "var(--text-muted)" }}>GSTIN: {selectedVendor.gstin}</div>}
                  {selectedVendor.city && <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{selectedVendor.city}{selectedVendor.state ? `, ${selectedVendor.state}` : ""}</div>}
                  {selectedVendor.phone && <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{selectedVendor.phone}</div>}
                </div>
                <button type="button" onClick={() => { setSelectedVendor(null); setVendorSearch(""); }} className="btn-ghost p-1.5"><X size={13} /></button>
              </div>
            ) : (
              <div className="relative">
                <div className="search-bar">
                  <Search size={13} style={{ color: "var(--text-muted)" }} />
                  <input
                    value={vendorSearch}
                    onChange={e => { setVendorSearch(e.target.value); setVendorOpen(true); }}
                    onFocus={() => setVendorOpen(true)}
                    onBlur={() => setTimeout(() => setVendorOpen(false), 150)}
                    placeholder="Search vendor name…"
                    autoComplete="off"
                  />
                </div>
                {vendorOpen && vendorResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 rounded-xl overflow-hidden z-20 shadow-xl"
                    style={{ background: "#142645", border: "1px solid var(--border)" }}>
                    {vendorResults.map(v => (
                      <button key={v.id} type="button"
                        className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors"
                        onMouseDown={() => { setSelectedVendor(v); setVendorOpen(false); setVendorSearch(""); }}>
                        <div className="font-semibold text-white text-sm">{v.name}</div>
                        <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                          {[v.gstin, v.city].filter(Boolean).join(" · ")}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Section 2: Purchase Details */}
          <section>
            <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#14c7c0", letterSpacing: "1.5px" }}>Purchase Details</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="erp-label">PO Number (preview)</label>
                <input value={poNumber} className="erp-input" readOnly style={{ opacity: 0.5, cursor: "not-allowed" }} />
              </div>
              <div>
                <label className="erp-label">Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)} className="erp-input" style={{ background: "#0b1e3d" }}>
                  {["DRAFT", "CONFIRMED"].map(s => <option key={s} value={s} style={{ background: "#0b1e3d" }}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="erp-label">Purchase Date</label>
                <input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} className="erp-input" required />
              </div>
              <div>
                <label className="erp-label">Expected Delivery</label>
                <input type="date" value={expectedDate} onChange={e => setExpectedDate(e.target.value)} className="erp-input" />
              </div>
              <div className="col-span-2">
                <label className="erp-label">Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} className="erp-input" rows={2} style={{ resize: "none" }} placeholder="Internal notes…" />
              </div>
            </div>
          </section>

          {/* Section 3: Line Items */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-bold uppercase tracking-widest" style={{ color: "#14c7c0", letterSpacing: "1.5px" }}>Line Items</div>
              <button type="button" onClick={addItem} className="btn-ghost" style={{ padding: "4px 10px", fontSize: "12px" }}>
                <Plus size={12} /> Add Row
              </button>
            </div>
            <div className="space-y-3">
              {items.map((item, idx) => {
                const c = calcItem(item);
                return (
                  <div key={idx} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
                    <div className="grid grid-cols-6 gap-2 mb-2">
                      <div className="col-span-4">
                        <label className="erp-label" style={{ fontSize: 10 }}>Product *</label>
                        <ProductSearch value={item.productName} onSelect={p => onProductSelect(idx, p)} />
                      </div>
                      <div>
                        <label className="erp-label" style={{ fontSize: 10 }}>Unit</label>
                        <select value={item.unit} onChange={e => updItem(idx, "unit", e.target.value)} className="erp-input" style={{ background: "#0b1e3d" }}>
                          {["pcs", "kg", "g", "litre", "box", "set", "pack", "dozen"].map(u => (
                            <option key={u} value={u} style={{ background: "#0b1e3d" }}>{u}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-end pb-0.5">
                        <button type="button" onClick={() => rmItem(idx)} disabled={items.length === 1}
                          className="btn-ghost p-2 w-full justify-center"
                          style={{ color: "#ef4444", opacity: items.length === 1 ? 0.3 : 1 }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-2 mb-2">
                      <div>
                        <label className="erp-label" style={{ fontSize: 10 }}>Qty *</label>
                        <input type="number" value={item.qty} min="0.01" step="any"
                          onChange={e => updItem(idx, "qty", e.target.value)} className="erp-input" required />
                      </div>
                      <div>
                        <label className="erp-label" style={{ fontSize: 10 }}>Unit Price *</label>
                        <input type="number" value={item.unitPrice} min="0" step="any"
                          onChange={e => updItem(idx, "unitPrice", e.target.value)} className="erp-input" placeholder="0.00" required />
                      </div>
                      <div>
                        <label className="erp-label" style={{ fontSize: 10 }}>Discount ₹</label>
                        <input type="number" value={item.discount} min="0" step="any"
                          onChange={e => updItem(idx, "discount", e.target.value)} className="erp-input" />
                      </div>
                      <div>
                        <label className="erp-label" style={{ fontSize: 10 }}>GST %</label>
                        <select value={item.gstRate} onChange={e => updItem(idx, "gstRate", e.target.value)} className="erp-input" style={{ background: "#0b1e3d" }}>
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
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Taxable: ₹{c.taxable.toFixed(2)} · GST: ₹{c.gstAmt.toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Section 4: Summary */}
          <section>
            <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#14c7c0", letterSpacing: "1.5px" }}>Summary</div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="erp-label">Shipping Charges (₹)</label>
                <input type="number" value={shippingCharges} min="0" step="any"
                  onChange={e => setShippingCharges(e.target.value)} className="erp-input" placeholder="0" />
              </div>
              <div>
                <label className="erp-label">Other Charges (₹)</label>
                <input type="number" value={otherCharges} min="0" step="any"
                  onChange={e => setOtherCharges(e.target.value)} className="erp-input" placeholder="0" />
              </div>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <input type="checkbox" id="interState" checked={isInterState} onChange={e => setIsInterState(e.target.checked)} className="accent-teal-500" />
              <label htmlFor="interState" className="text-xs cursor-pointer" style={{ color: "var(--text-muted)" }}>Inter-state purchase (IGST applies)</label>
            </div>
            <div className="rounded-xl p-4" style={{ background: "rgba(14,165,160,0.05)", border: "1px solid rgba(14,165,160,0.2)" }}>
              {[
                ["Subtotal", `₹${subtotal.toFixed(2)}`],
                [isInterState ? "IGST" : "CGST + SGST", `₹${totalTax.toFixed(2)}`],
                ...(shipping > 0 ? [["Shipping", `₹${shipping.toFixed(2)}`]] : []),
                ...(other > 0 ? [["Other Charges", `₹${other.toFixed(2)}`]] : []),
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm mb-1.5">
                  <span style={{ color: "var(--text-muted)" }}>{k}</span>
                  <span className="text-white">{v}</span>
                </div>
              ))}
              <div className="flex justify-between font-black text-lg pt-2 border-t" style={{ borderColor: "rgba(14,165,160,0.3)" }}>
                <span className="text-white">Grand Total</span>
                <span style={{ color: "#14c7c0" }}>₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </section>

          {/* Section 5: Payment */}
          <section>
            <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#14c7c0", letterSpacing: "1.5px" }}>Payment</div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="erp-label">Payment Method</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="erp-input" style={{ background: "#0b1e3d" }}>
                  {["CASH", "BANK_TRANSFER", "CHEQUE", "UPI"].map(m => (
                    <option key={m} value={m} style={{ background: "#0b1e3d" }}>{m.replace("_", " ")}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="erp-label">Reference / Cheque No.</label>
                <input value={refNumber} onChange={e => setRefNumber(e.target.value)} className="erp-input" placeholder="Ref #" />
              </div>
              <div>
                <label className="erp-label">Advance Paid (₹)</label>
                <input type="number" value={advancePaid} min="0" step="any"
                  onChange={e => setAdvancePaid(e.target.value)} className="erp-input" placeholder="0" />
              </div>
            </div>
          </section>

          {/* Submit */}
          <div className="flex gap-3 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
            <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving
                ? <span className="inline-flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating…</span>
                : <><Plus size={14} /> Create Purchase Order</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function PurchasesPage() {
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showCreate, setShowCreate] = useState(false);
  const [viewPO, setViewPO] = useState<PurchaseOrder | null>(null);
  const { success, error } = useToast();

  const fetchPOs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (search) params.set("search", search);
      const res = await fetch(`/api/purchases?${params}`);
      const json = await res.json();
      setPos(json.data?.data ?? []);
      setTotal(json.data?.pagination?.total ?? json.data?.total ?? 0);
    } finally { setLoading(false); }
  }, [search, statusFilter]);

  useEffect(() => { fetchPOs(); }, [fetchPOs]);

  async function markReceived(po: PurchaseOrder, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`Mark PO ${po.number} as Received? This will update inventory.`)) return;
    try {
      const res = await fetch(`/api/purchases/${po.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "RECEIVED" }),
      });
      const json = await res.json();
      if (json.success) { success("PO Received", "Inventory updated"); fetchPOs(); }
      else error("Failed", json.error ?? "Unknown error");
    } catch { error("Network error"); }
  }

  async function deletePO(po: PurchaseOrder, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`Delete PO ${po.number}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/purchases/${po.id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) { success("PO deleted"); fetchPOs(); }
      else error("Delete failed", json.error ?? "Unknown error");
    } catch { error("Network error"); }
  }

  /* KPI stats */
  const totalValue = pos.reduce((s, p) => s + (p.total ?? 0), 0);
  const pendingValue = pos
    .filter(p => ["DRAFT", "CONFIRMED", "PARTIAL"].includes(p.status))
    .reduce((s, p) => s + (p.total ?? 0), 0);

  return (
    <div className="module-page">
      {/* Header */}
      <div className="module-header">
        <div>
          <h1 className="module-title">Purchase Orders</h1>
          <p className="module-subtitle">{total} total · Vendor procurement management</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={fetchPOs} disabled={loading}>
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={14} /> New Purchase
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: "Total POs", value: String(total), icon: <Package size={18} style={{ color: "#14c7c0" }} /> },
          { label: "Total Value", value: `₹${(totalValue / 100000).toFixed(2)}L`, icon: <IndianRupee size={18} style={{ color: "#10b981" }} /> },
          { label: "Pending Value", value: `₹${(pendingValue / 100000).toFixed(2)}L`, icon: <Truck size={18} style={{ color: "#f59e0b" }} /> },
        ].map(k => (
          <div key={k.label} className="kpi-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{k.label}</span>
              {k.icon}
            </div>
            <div className="text-2xl font-black text-white">{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="search-bar flex-1 min-w-48">
          <Search size={13} style={{ color: "var(--text-muted)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search PO number or vendor…" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["ALL", "DRAFT", "CONFIRMED", "PARTIAL", "RECEIVED"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
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
            <tr>{["PO #", "Vendor", "Date", "Expected Delivery", "Items", "Tax", "Total", "Status", "Actions"].map(h => <th key={h}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={9} className="text-center py-8" style={{ color: "var(--text-muted)" }}>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                  Loading…
                </div>
              </td></tr>
            )}
            {!loading && pos.length === 0 && (
              <tr><td colSpan={9} className="text-center py-10" style={{ color: "var(--text-muted)" }}>
                <div className="flex flex-col items-center gap-3">
                  <Package size={36} style={{ opacity: 0.3 }} />
                  <span className="font-semibold">No purchase orders found</span>
                  <button className="btn-primary" onClick={() => setShowCreate(true)}>
                    <Plus size={13} /> Create First PO
                  </button>
                </div>
              </td></tr>
            )}
            {pos.map(po => (
              <tr key={po.id} className="cursor-pointer" onClick={() => setViewPO(po)}>
                <td className="font-bold" style={{ color: "#14c7c0" }}>{po.number}</td>
                <td className="font-semibold text-white">{po.vendor?.name ?? "—"}</td>
                <td style={{ color: "var(--text-muted)" }}>{formatDate(po.createdAt)}</td>
                <td style={{ color: "var(--text-muted)" }}>{po.expectedDate ? formatDate(po.expectedDate) : "—"}</td>
                <td style={{ color: "var(--text-muted)" }}>{po._count?.items ?? 0} items</td>
                <td style={{ color: "var(--text-muted)" }}>₹{Number(po.taxAmount ?? 0).toLocaleString("en-IN")}</td>
                <td className="font-bold text-white">₹{Number(po.total ?? 0).toLocaleString("en-IN")}</td>
                <td><span className={`badge ${STATUS_BADGE[po.status] ?? "badge-gray"}`}>{po.status}</span></td>
                <td>
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    <button className="btn-ghost p-1.5" title="View" onClick={e => { e.stopPropagation(); setViewPO(po); }}>
                      <Eye size={12} />
                    </button>
                    {(po.status === "CONFIRMED" || po.status === "PARTIAL") && (
                      <button className="btn-ghost p-1.5" title="Mark Received" onClick={e => markReceived(po, e)}
                        style={{ color: "#10b981" }}>
                        <Truck size={12} />
                      </button>
                    )}
                    {po.status === "DRAFT" && (
                      <button className="btn-ghost p-1.5" title="Delete" onClick={e => deletePO(po, e)}
                        style={{ color: "#ef4444" }}>
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {viewPO && <ViewModal po={viewPO} onClose={() => setViewPO(null)} onRefresh={fetchPOs} />}
      {showCreate && <CreateDrawer onClose={() => setShowCreate(false)} onCreated={fetchPOs} />}
    </div>
  );
}
