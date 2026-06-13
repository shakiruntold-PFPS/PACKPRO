"use client";
import { useState, useCallback, useEffect } from "react";
import { Plus, Search, Truck, FileText, RefreshCw, X, Save, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

const STATUS_STYLE: Record<string, string> = {
  CONFIRMED: "badge-blue", PROCESSING: "badge-amber", READY: "badge-purple",
  DISPATCHED: "badge-teal", DELIVERED: "badge-green", CANCELLED: "badge-gray",
};

const SOURCES = ["WEBSITE", "WHATSAPP", "REFERRAL", "GOOGLE", "INSTAGRAM", "DIRECT", "OTHER"];

const BLANK = {
  partyId: "", partySearch: "", deliveryDate: "", notes: "",
  shippingAddress: "", paymentTerms: "NET_30",
};

export default function SalesOrdersPage() {
  const router = useRouter();
  const { success, error } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [partySuggestions, setPartySuggestions] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [statusMenuId, setStatusMenuId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (search) params.set("search", search);
      const res = await fetch(`/api/sales-orders?${params}`);
      const json = await res.json();
      setOrders(json.data?.data ?? []);
      setTotal(json.data?.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  async function searchParties(q: string) {
    setForm(f => ({ ...f, partySearch: q, partyId: "" }));
    if (q.length < 2) { setPartySuggestions([]); return; }
    const res = await fetch(`/api/parties?search=${encodeURIComponent(q)}&limit=6`);
    const json = await res.json();
    setPartySuggestions(json.data?.data ?? []);
  }

  function selectParty(p: any) {
    setForm(f => ({ ...f, partyId: p.id, partySearch: p.name }));
    setPartySuggestions([]);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.partyId) { error("Please select a customer"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/sales-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partyId: form.partyId,
          deliveryDate: form.deliveryDate || undefined,
          notes: form.notes || undefined,
          shippingAddress: form.shippingAddress || undefined,
          paymentTerms: form.paymentTerms,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      success("Order created", json.data?.number ?? "");
      setShowCreate(false);
      setForm(BLANK);
      fetchOrders();
    } catch (err_: any) {
      error("Failed to create order", err_.message);
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    setStatusMenuId(null);
    try {
      const res = await fetch(`/api/sales-orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed");
      setOrders(os => os.map(o => o.id === id ? { ...o, status } : o));
      success("Status updated", status);
    } catch {
      error("Failed to update status");
    }
  }

  async function createInvoice(order: any) {
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partyId: order.partyId ?? order.party?.id,
          salesOrderId: order.id,
          dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
          items: (order.items ?? []).map((it: any) => ({
            productId: it.productId,
            description: it.product?.name ?? it.description,
            qty: it.qty,
            unit: it.unit ?? "pcs",
            unitPrice: it.unitPrice,
            discount: it.discount ?? 0,
            gstRate: it.gstRate ?? 18,
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      success("Invoice created", json.data?.number ?? "");
      router.push("/admin/invoices");
    } catch (err_: any) {
      error("Failed to create invoice", err_.message);
    }
  }

  const activeValue = orders
    .filter(o => !["DELIVERED", "CANCELLED"].includes(o.status))
    .reduce((s: number, o: any) => s + (o.total ?? 0), 0);

  const NEXT_STATUSES: Record<string, string[]> = {
    CONFIRMED: ["PROCESSING", "CANCELLED"],
    PROCESSING: ["READY", "CANCELLED"],
    READY: ["DISPATCHED"],
    DISPATCHED: ["DELIVERED"],
  };

  return (
    <div className="module-page" onClick={() => setStatusMenuId(null)}>
      <div className="module-header">
        <div>
          <h1 className="module-title">Sales Orders</h1>
          <p className="module-subtitle">Active: ₹{(activeValue / 100000).toFixed(1)}L · {total} orders</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={fetchOrders}>
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={13} /> New Order
          </button>
        </div>
      </div>

      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="search-bar flex-1 min-w-48">
          <Search size={13} style={{ color: "var(--text-muted)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders…" />
        </div>
        {["ALL", "CONFIRMED", "PROCESSING", "READY", "DISPATCHED", "DELIVERED"].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={statusFilter === s ? "btn-primary" : "btn-ghost"} style={{ padding: "7px 12px", fontSize: "11px" }}>
            {s}
          </button>
        ))}
      </div>

      <div className="glass rounded-2xl overflow-auto">
        <table className="erp-table">
          <thead>
            <tr>{["Order #", "Customer", "Quote Ref", "Order Date", "Delivery Date", "Total", "Status", "Actions"].map(h => <th key={h}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={8} className="text-center py-8" style={{ color: "var(--text-muted)" }}>Loading…</td></tr>
            )}
            {!loading && orders.length === 0 && (
              <tr><td colSpan={8} className="text-center py-8" style={{ color: "var(--text-muted)" }}>No sales orders found</td></tr>
            )}
            {orders.map((o: any) => (
              <tr key={o.id}>
                <td className="font-bold" style={{ color: "var(--brand-light)" }}>{o.number}</td>
                <td className="font-semibold" style={{ color: "var(--text-primary)" }}>{o.party?.name ?? "—"}</td>
                <td className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>{o.quote?.number ?? "—"}</td>
                <td style={{ color: "var(--text-muted)" }}>{formatDate(o.createdAt)}</td>
                <td style={{ color: "var(--text-muted)" }}>{o.deliveryDate ? formatDate(o.deliveryDate) : "—"}</td>
                <td className="font-bold" style={{ color: "var(--text-primary)" }}>₹{(o.total ?? 0).toLocaleString("en-IN")}</td>
                <td>
                  <div className="relative" onClick={e => e.stopPropagation()}>
                    <button
                      className={`badge ${STATUS_STYLE[o.status] ?? ""} cursor-pointer flex items-center gap-1`}
                      onClick={() => setStatusMenuId(statusMenuId === o.id ? null : o.id)}>
                      {o.status}
                      {NEXT_STATUSES[o.status] && <ChevronDown size={10} />}
                    </button>
                    {statusMenuId === o.id && NEXT_STATUSES[o.status] && (
                      <div className="absolute left-0 top-7 z-20 rounded-xl shadow-xl overflow-hidden"
                        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", minWidth: 140 }}>
                        {NEXT_STATUSES[o.status].map(ns => (
                          <button key={ns} onClick={() => updateStatus(o.id, ns)}
                            className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-white/5 transition-colors"
                            style={{ color: ns === "CANCELLED" ? "#ef4444" : "var(--text-primary)" }}>
                            → {ns}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <div className="flex gap-1">
                    <button className="btn-ghost p-1.5" title="Create Invoice" onClick={() => createInvoice(o)}>
                      <FileText size={12} />
                    </button>
                    <button className="btn-ghost p-1.5" title="Create Dispatch"
                      onClick={() => router.push(`/admin/dispatches?orderId=${o.id}`)}>
                      <Truck size={12} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Order Drawer */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-start justify-end" style={{ background: "rgba(0,0,0,0.82)" }}
          onClick={e => { if (e.target === e.currentTarget) setShowCreate(false); }}>
          <div className="h-full w-full max-w-lg overflow-y-auto" style={{ background: "var(--bg-surface)", borderLeft: "1px solid var(--border)" }}>
            <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b" style={{ background: "var(--bg-surface)", borderColor: "var(--border)", zIndex: 10 }}>
              <div>
                <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>New Sales Order</h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Creates a confirmed order</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="btn-ghost p-2"><X size={16} /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {/* Customer */}
              <div className="relative">
                <label className="erp-label">Customer *</label>
                <input value={form.partySearch}
                  onChange={e => searchParties(e.target.value)}
                  className="erp-input" placeholder="Search customer name…" required />
                {partySuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 z-20 rounded-xl shadow-xl overflow-hidden mt-1"
                    style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                    {partySuggestions.map((p: any) => (
                      <button key={p.id} type="button" onClick={() => selectParty(p)}
                        className="w-full text-left px-4 py-2.5 hover:bg-white/5 transition-colors">
                        <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{p.name}</div>
                        <div className="text-xs" style={{ color: "var(--text-muted)" }}>{p.city} · {p.type}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Delivery Date */}
              <div>
                <label className="erp-label">Expected Delivery Date</label>
                <input type="date" value={form.deliveryDate}
                  onChange={e => setForm(f => ({ ...f, deliveryDate: e.target.value }))}
                  className="erp-input" />
              </div>

              {/* Payment Terms */}
              <div>
                <label className="erp-label">Payment Terms</label>
                <select value={form.paymentTerms}
                  onChange={e => setForm(f => ({ ...f, paymentTerms: e.target.value }))}
                  className="erp-input">
                  <option value="IMMEDIATE">Immediate</option>
                  <option value="NET_15">Net 15</option>
                  <option value="NET_30">Net 30</option>
                  <option value="NET_45">Net 45</option>
                  <option value="NET_60">Net 60</option>
                  <option value="ADVANCE">Advance</option>
                </select>
              </div>

              {/* Shipping Address */}
              <div>
                <label className="erp-label">Shipping Address</label>
                <textarea value={form.shippingAddress}
                  onChange={e => setForm(f => ({ ...f, shippingAddress: e.target.value }))}
                  className="erp-input" rows={2} style={{ resize: "none" }}
                  placeholder="Delivery address (leave blank to use customer address)" />
              </div>

              {/* Notes */}
              <div>
                <label className="erp-label">Notes</label>
                <textarea value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="erp-input" rows={2} style={{ resize: "none" }}
                  placeholder="Internal notes, special instructions…" />
              </div>

              <div className="flex gap-3 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
                <button type="button" onClick={() => setShowCreate(false)} className="btn-ghost flex-1 justify-center">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving
                    ? <><span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
                    : <><Save size={13} />Create Order</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
