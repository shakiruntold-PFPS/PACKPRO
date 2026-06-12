"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Plus, Search, X, CheckCircle, AlertCircle, Building2,
  Phone, Mail, MapPin, RefreshCw, ChevronLeft, ChevronRight,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Party {
  id: string;
  type: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  gstin?: string;
  createdAt: string;
}

interface FormState {
  type: string;
  name: string;
  contactPerson: string;
  phone: string;
  altPhone: string;
  email: string;
  gstin: string;
  pan: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  creditLimit: string;
  creditDays: string;
  notes: string;
}

const BLANK: FormState = {
  type: "CUSTOMER", name: "", contactPerson: "", phone: "", altPhone: "",
  email: "", gstin: "", pan: "", address: "", city: "", state: "",
  pincode: "", creditLimit: "", creditDays: "", notes: "",
};

const PARTY_TYPES = ["CUSTOMER", "VENDOR", "SUPPLIER", "DEALER", "DISTRIBUTOR", "TRANSPORTER"];
const STATES = ["Rajasthan","Delhi","Haryana","Maharashtra","Gujarat","Uttar Pradesh","Madhya Pradesh","Karnataka","Tamil Nadu","West Bengal","Telangana","Punjab","Bihar","Odisha","Jharkhand","Other"];
const TYPE_COLOR: Record<string,string> = {
  CUSTOMER:"badge-green", VENDOR:"badge-blue", SUPPLIER:"badge-amber",
  DEALER:"badge-teal", DISTRIBUTOR:"badge-purple", TRANSPORTER:"badge-gray",
};

// ─── Field helper ──────────────────────────────────────────────────────────────
function Field({ label, value, onChange, type = "text", required = false, placeholder = "", half = false }: any) {
  return (
    <div className={half ? "col-span-1" : "col-span-2 md:col-span-1"}>
      <label className="erp-label">{label}{required && <span style={{ color: "#ef4444" }}> *</span>}</label>
      <input
        type={type} value={value} placeholder={placeholder} required={required}
        onChange={(e) => onChange(e.target.value)}
        className="erp-input"
      />
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function PartiesPage() {
  const [parties, setParties]   = useState<Party[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading]   = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState<FormState>(BLANK);
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState<{ msg: string; ok: boolean } | null>(null);

  const PER_PAGE = 15;

  // ─── Fetch list ─────────────────────────────────────────────
  const fetchParties = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        page: String(page),
        limit: String(PER_PAGE),
        ...(search && { search }),
        ...(typeFilter && { type: typeFilter }),
      });
      const res  = await fetch(`/api/parties?${qs}`);
      const json = await res.json();
      if (json.success) {
        setParties(json.data.data);
        setTotal(json.data.pagination.total);
      }
    } catch {
      showToast("Failed to load parties", false);
    } finally {
      setLoading(false);
    }
  }, [page, search, typeFilter]);

  useEffect(() => { fetchParties(); }, [fetchParties]);

  // Debounce search
  useEffect(() => { setPage(1); }, [search, typeFilter]);

  // ─── Toast helper ─────────────────────────────────────────────
  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  // ─── Form field setter ─────────────────────────────────────────
  const setField = (k: keyof FormState) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  // ─── Submit ────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload: any = {
      ...form,
      creditLimit: form.creditLimit ? Number(form.creditLimit) : undefined,
      creditDays:  form.creditDays  ? Number(form.creditDays)  : undefined,
    };
    // Remove empty strings → undefined so Prisma doesn't complain
    Object.keys(payload).forEach((k) => { if (payload[k] === "") delete payload[k]; });

    try {
      const res  = await fetch("/api/parties", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const json = await res.json();

      if (json.success) {
        showToast(`Party "${json.data.name}" created successfully`, true);
        setForm(BLANK);
        setShowForm(false);
        setPage(1);
        fetchParties();
      } else {
        showToast(json.error || "Failed to create party", false);
      }
    } catch {
      showToast("Network error. Please try again.", false);
    } finally {
      setSaving(false);
    }
  }

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div className="module-page">

      {/* ── Toast ─────────────────────────────────────────────── */}
      {toast && (
        <div
          className="fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl animate-in"
          style={{
            background: toast.ok ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
            border: `1px solid ${toast.ok ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.4)"}`,
            color: toast.ok ? "#10b981" : "#ef4444",
            minWidth: "280px",
          }}
        >
          {toast.ok ? <CheckCircle size={16} className="flex-shrink-0" /> : <AlertCircle size={16} className="flex-shrink-0" />}
          <span className="text-sm font-semibold">{toast.msg}</span>
        </div>
      )}

      {/* ── Header ────────────────────────────────────────────── */}
      <div className="module-header">
        <div>
          <h1 className="module-title">Parties</h1>
          <p className="module-subtitle">{total} total · Customers, Vendors, Suppliers</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost" onClick={fetchParties} disabled={loading}>
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={14} /> Add Party
          </button>
        </div>
      </div>

      {/* ── Filters ───────────────────────────────────────────── */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="search-bar flex-1 min-w-48">
          <Search size={13} style={{ color: "var(--muted)" }} />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, GSTIN, city…"
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ color: "var(--muted)" }}>
              <X size={13} />
            </button>
          )}
        </div>
        <select
          value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
          className="erp-input" style={{ width: "auto", background: "#0b1e3d" }}
        >
          <option value="" style={{ background: "#0b1e3d" }}>All Types</option>
          {PARTY_TYPES.map((t) => (
            <option key={t} value={t} style={{ background: "#0b1e3d" }}>{t}</option>
          ))}
        </select>
      </div>

      {/* ── Table ─────────────────────────────────────────────── */}
      <div className="glass rounded-2xl overflow-auto mb-4">
        {loading && parties.length === 0 ? (
          <div className="empty-state">
            <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Loading parties…</p>
          </div>
        ) : parties.length === 0 ? (
          <div className="empty-state">
            <Building2 size={40} />
            <p className="text-sm mt-2 font-semibold">No parties found</p>
            <p className="text-xs mt-1">Add your first customer or vendor to get started</p>
            <button className="btn-primary mt-4" onClick={() => setShowForm(true)}>
              <Plus size={13} /> Add Party
            </button>
          </div>
        ) : (
          <table className="erp-table">
            <thead>
              <tr>
                {["Name", "Type", "Contact", "Phone", "GSTIN", "City / State", "Added"].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {parties.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="font-semibold text-white">{p.name}</div>
                    {p.contactPerson && (
                      <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{p.contactPerson}</div>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${TYPE_COLOR[p.type] ?? "badge-gray"}`}>{p.type}</span>
                  </td>
                  <td style={{ color: "var(--muted)" }}>{p.contactPerson || "—"}</td>
                  <td>
                    {p.phone ? (
                      <a href={`tel:${p.phone}`} className="flex items-center gap-1 text-xs"
                        style={{ color: "#14c7c0" }}>
                        <Phone size={11} /> {p.phone}
                      </a>
                    ) : "—"}
                  </td>
                  <td className="font-mono text-xs" style={{ color: "var(--muted)" }}>
                    {p.gstin || "—"}
                  </td>
                  <td style={{ color: "var(--muted)", fontSize: 12 }}>
                    {[p.city, p.state].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td style={{ color: "var(--muted)", fontSize: 12 }}>
                    {new Date(p.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Pagination ────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-xs" style={{ color: "var(--muted)" }}>
            Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, total)} of {total}
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost p-2" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>
              <ChevronLeft size={14} />
            </button>
            <span className="btn-ghost px-3 py-2 text-xs pointer-events-none">
              {page} / {totalPages}
            </span>
            <button className="btn-ghost p-2" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Create Party Drawer/Modal ──────────────────────────── */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-end"
          style={{ background: "rgba(0,0,0,0.75)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}
        >
          <div
            className="h-full w-full max-w-xl overflow-y-auto animate-in"
            style={{ background: "#0d1f3c", borderLeft: "1px solid var(--border)" }}
          >
            {/* Drawer header */}
            <div
              className="sticky top-0 flex items-center justify-between px-6 py-4 border-b"
              style={{ background: "#0d1f3c", borderColor: "var(--border)", zIndex: 10 }}
            >
              <div>
                <h2 className="text-lg font-bold text-white">Add New Party</h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                  Customer, Vendor, Supplier or Distributor
                </p>
              </div>
              <button onClick={() => setShowForm(false)} className="btn-ghost p-2">
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">

              {/* Party Type */}
              <div>
                <label className="erp-label">Party Type <span style={{ color: "#ef4444" }}>*</span></label>
                <div className="flex gap-2 flex-wrap mt-1">
                  {PARTY_TYPES.map((t) => (
                    <button
                      key={t} type="button"
                      onClick={() => setField("type")(t)}
                      className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                      style={{
                        background: form.type === t ? "rgba(14,165,160,0.2)" : "var(--glass)",
                        border: `1px solid ${form.type === t ? "#0ea5a0" : "var(--border)"}`,
                        color: form.type === t ? "#14c7c0" : "var(--muted)",
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Basic Info */}
              <section>
                <div className="text-xs font-bold uppercase tracking-widest mb-3"
                  style={{ color: "#14c7c0", letterSpacing: "1.5px" }}>
                  Basic Information
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Field label="Company / Party Name" value={form.name} onChange={setField("name")} required placeholder="Spice Route Restaurant" />
                  </div>
                  <Field label="Contact Person" value={form.contactPerson} onChange={setField("contactPerson")} placeholder="Rahul Sharma" />
                  <Field label="Phone" value={form.phone} onChange={setField("phone")} type="tel" placeholder="+91 98765 43210" />
                  <Field label="Alternate Phone" value={form.altPhone} onChange={setField("altPhone")} type="tel" />
                  <Field label="Email" value={form.email} onChange={setField("email")} type="email" placeholder="orders@customer.com" />
                </div>
              </section>

              {/* GST / Tax */}
              <section>
                <div className="text-xs font-bold uppercase tracking-widest mb-3"
                  style={{ color: "#14c7c0", letterSpacing: "1.5px" }}>
                  GST & Tax Details
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="GSTIN" value={form.gstin} onChange={setField("gstin")} placeholder="08AABCS1234A1Z5" />
                  <Field label="PAN" value={form.pan} onChange={setField("pan")} placeholder="AABCS1234A" />
                </div>
              </section>

              {/* Address */}
              <section>
                <div className="text-xs font-bold uppercase tracking-widest mb-3"
                  style={{ color: "#14c7c0", letterSpacing: "1.5px" }}>
                  Address
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="erp-label">Street Address</label>
                    <textarea
                      value={form.address} onChange={(e) => setField("address")(e.target.value)}
                      className="erp-input" rows={2}
                      placeholder="Shop No. 5, Main Market…"
                      style={{ resize: "none" }}
                    />
                  </div>
                  <Field label="City" value={form.city} onChange={setField("city")} placeholder="Jaipur" />
                  <div>
                    <label className="erp-label">State</label>
                    <select
                      value={form.state} onChange={(e) => setField("state")(e.target.value)}
                      className="erp-input" style={{ background: "#0b1e3d" }}
                    >
                      <option value="" style={{ background: "#0b1e3d" }}>Select state</option>
                      {STATES.map((s) => (
                        <option key={s} value={s} style={{ background: "#0b1e3d" }}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <Field label="Pincode" value={form.pincode} onChange={setField("pincode")} placeholder="302001" />
                </div>
              </section>

              {/* Credit Terms */}
              <section>
                <div className="text-xs font-bold uppercase tracking-widest mb-3"
                  style={{ color: "#14c7c0", letterSpacing: "1.5px" }}>
                  Credit Terms
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Credit Limit (₹)" value={form.creditLimit} onChange={setField("creditLimit")} type="number" placeholder="50000" />
                  <Field label="Credit Days" value={form.creditDays} onChange={setField("creditDays")} type="number" placeholder="30" />
                </div>
              </section>

              {/* Notes */}
              <section>
                <label className="erp-label">Notes</label>
                <textarea
                  value={form.notes} onChange={(e) => setField("notes")(e.target.value)}
                  className="erp-input" rows={3}
                  placeholder="Any internal notes about this party…"
                  style={{ resize: "none" }}
                />
              </section>

              {/* Actions */}
              <div className="flex gap-3 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
                <button
                  type="button" onClick={() => { setShowForm(false); setForm(BLANK); }}
                  className="btn-ghost flex-1 justify-center"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={saving}
                  className="btn-primary flex-1 justify-center"
                >
                  {saving ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving…
                    </span>
                  ) : (
                    <><Plus size={14} /> Save Party</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
