"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Search, Phone, ArrowRight, RefreshCw, X, MessageCircle, Mail, FileText, Calendar, Clock, Users, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

const STATUSES = [
  { key: "NEW",         label: "New",         color: "#60a5fa" },
  { key: "CONTACTED",   label: "Contacted",   color: "#a78bfa" },
  { key: "QUALIFIED",   label: "Qualified",   color: "#f59e0b" },
  { key: "PROPOSAL",    label: "Proposal",    color: "#fb923c" },
  { key: "NEGOTIATION", label: "Negotiation", color: "#14c7c0" },
  { key: "WON",         label: "Won",         color: "#10b981" },
  { key: "LOST",        label: "Lost",        color: "#ef4444" },
];

const ACTIVITY_TYPES = [
  { key: "NOTE",       label: "Note",      icon: FileText,       color: "#94a3b8" },
  { key: "CALL",       label: "Call",      icon: Phone,          color: "#60a5fa" },
  { key: "EMAIL",      label: "Email",     icon: Mail,           color: "#a78bfa" },
  { key: "WHATSAPP",   label: "WhatsApp",  icon: MessageCircle,  color: "#4ade80" },
  { key: "MEETING",    label: "Meeting",   icon: Users,          color: "#fb923c" },
  { key: "FOLLOW_UP",  label: "Follow-up", icon: Clock,          color: "#f59e0b" },
];

const SOURCES = ["WEBSITE","WHATSAPP","REFERRAL","GOOGLE","INSTAGRAM","FACEBOOK","COLD_CALL","EXHIBITION","OTHER"];
const PRIORITIES = ["LOW","MEDIUM","HIGH","URGENT"];

const BLANK = { title:"", company:"", contactName:"", phone:"", email:"", source:"WEBSITE", priority:"MEDIUM", value:"", notes:"" };

function LeadCard({ lead, onClick, active }: any) {
  const status = STATUSES.find(s => s.key === lead.status);
  return (
    <div onClick={() => onClick(lead)}
      className="rounded-xl p-4 cursor-pointer transition-all mb-2"
      style={{
        background: active ? "rgba(14,165,160,0.1)" : "rgba(255,255,255,0.03)",
        border: active ? "1px solid rgba(14,165,160,0.4)" : "1px solid rgba(255,255,255,0.08)",
      }}>
      <div className="font-semibold text-sm leading-tight mb-1 line-clamp-2" style={{ color: "var(--text-primary)" }}>{lead.title}</div>
      <div className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>{lead.company || lead.contactName || "—"}</div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold" style={{ color: "var(--brand-light)" }}>
          {lead.value ? `₹${(lead.value / 1000).toFixed(0)}K` : "—"}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: `${status?.color}22`, color: status?.color }}>
          {status?.label}
        </span>
      </div>
    </div>
  );
}

function LeadDetailPanel({ lead: initialLead, onClose, onStatusChange }: any) {
  const router = useRouter();
  const { success, error } = useToast();
  const [lead, setLead] = useState(initialLead);
  const [activities, setActivities] = useState<any[]>([]);
  const [loadingActs, setLoadingActs] = useState(false);
  const [actType, setActType] = useState("NOTE");
  const [actSubject, setActSubject] = useState("");
  const [actNotes, setActNotes] = useState("");
  const [logging, setLogging] = useState(false);

  useEffect(() => {
    setLead(initialLead);
    if (initialLead?.id) {
      setLoadingActs(true);
      fetch(`/api/activities?leadId=${initialLead.id}`)
        .then(r => r.json())
        .then(j => setActivities(j.data ?? []))
        .catch(() => {})
        .finally(() => setLoadingActs(false));
    }
  }, [initialLead?.id]);

  async function handleStatusChange(newStatus: string) {
    setLead((prev: any) => ({ ...prev, status: newStatus }));
    onStatusChange(lead.id, newStatus);
  }

  async function logActivity(e: React.FormEvent) {
    e.preventDefault();
    if (!actSubject.trim()) { error("Subject required"); return; }
    setLogging(true);
    try {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: actType, subject: actSubject, notes: actNotes, leadId: lead.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setActivities(prev => [json.data, ...prev]);
      setActSubject("");
      setActNotes("");
      success("Activity logged");
    } catch (err_: any) {
      error("Failed to log activity", err_.message);
    } finally {
      setLogging(false);
    }
  }

  const status = STATUSES.find(s => s.key === lead.status);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end" style={{ background: "rgba(0,0,0,0.75)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="h-full w-full max-w-xl overflow-y-auto" style={{ background: "var(--bg-surface)", borderLeft: "1px solid var(--border)" }}>
        {/* Header */}
        <div className="sticky top-0 z-10 px-6 py-4 border-b flex items-start justify-between" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
          <div className="flex-1 min-w-0 pr-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: `${status?.color}22`, color: status?.color }}>{status?.label}</span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>{lead.source}</span>
            </div>
            <h2 className="font-bold text-base leading-tight" style={{ color: "var(--text-primary)" }}>{lead.title}</h2>
            <div className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>{lead.company}</div>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={15} /></button>
        </div>

        <div className="p-6 space-y-6">
          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-2">
            {[
              ["Contact", lead.contactName],
              ["Value", lead.value ? `₹${(lead.value/1000).toFixed(0)}K` : "—"],
              ["Phone", lead.phone],
              ["Email", lead.email],
              ["Priority", lead.priority],
              ["Created", formatDate(lead.createdAt)],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg p-3" style={{ background: "var(--bg-input)", border: "1px solid var(--border)" }}>
                <div className="text-xs mb-1" style={{ color: "var(--text-muted)", fontSize: 10 }}>{k}</div>
                <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{v || "—"}</div>
              </div>
            ))}
          </div>

          {/* Pipeline Stage */}
          <div>
            <div className="erp-label mb-2">Pipeline Stage</div>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map(s => (
                <button key={s.key} onClick={() => handleStatusChange(s.key)}
                  className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                  style={{
                    background: lead.status === s.key ? `${s.color}22` : "var(--bg-input)",
                    border: `1px solid ${lead.status === s.key ? s.color + "66" : "var(--border)"}`,
                    color: lead.status === s.key ? s.color : "var(--text-muted)",
                  }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Log Activity */}
          <div className="rounded-xl p-4" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
            <div className="erp-label mb-3">Log Activity</div>
            <div className="flex flex-wrap gap-2 mb-3">
              {ACTIVITY_TYPES.map(t => {
                const Icon = t.icon;
                return (
                  <button key={t.key} onClick={() => setActType(t.key)}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                    style={{
                      background: actType === t.key ? `${t.color}22` : "var(--bg-input)",
                      border: `1px solid ${actType === t.key ? t.color + "55" : "var(--border)"}`,
                      color: actType === t.key ? t.color : "var(--text-muted)",
                    }}>
                    <Icon size={11} />{t.label}
                  </button>
                );
              })}
            </div>
            <form onSubmit={logActivity} className="space-y-2">
              <input value={actSubject} onChange={e => setActSubject(e.target.value)}
                className="erp-input" placeholder="Subject / summary…" required />
              <textarea value={actNotes} onChange={e => setActNotes(e.target.value)}
                className="erp-input" rows={2} style={{ resize: "none" }} placeholder="Additional notes (optional)" />
              <button type="submit" disabled={logging} className="btn-primary w-full justify-center text-sm">
                {logging
                  ? <><span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />Logging…</>
                  : "Log Activity"}
              </button>
            </form>
          </div>

          {/* Activity Timeline */}
          <div>
            <div className="erp-label mb-3">Activity History</div>
            {loadingActs && <div className="text-xs text-center py-4" style={{ color: "var(--text-muted)" }}>Loading…</div>}
            {!loadingActs && activities.length === 0 && (
              <div className="text-xs text-center py-6 rounded-xl" style={{ color: "var(--text-muted)", border: "1px dashed var(--border)" }}>
                No activities yet — log the first interaction above
              </div>
            )}
            <div className="space-y-3">
              {activities.map((act: any) => {
                const at = ACTIVITY_TYPES.find(t => t.key === act.type) ?? ACTIVITY_TYPES[0];
                const Icon = at.icon;
                return (
                  <div key={act.id} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: `${at.color}22`, border: `1px solid ${at.color}44` }}>
                      <Icon size={12} style={{ color: at.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{act.subject}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: `${at.color}22`, color: at.color }}>{at.label}</span>
                      </div>
                      {act.notes && <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{act.notes}</div>}
                      <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                        {act.user?.name ?? "You"} · {formatDate(act.createdAt)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-2 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
            {lead.phone && (
              <a href={`https://wa.me/${lead.phone?.replace(/\D/g, "")}`}
                target="_blank" rel="noreferrer"
                className="btn-ghost flex-1 justify-center text-sm"
                style={{ color: "#4ade80", borderColor: "#4ade8033" }}>
                <MessageCircle size={13} /> WhatsApp
              </a>
            )}
            <button className="btn-primary flex-1 justify-center text-sm"
              onClick={() => router.push(`/admin/quotes?newLead=${lead.id}&company=${encodeURIComponent(lead.company ?? "")}&contact=${encodeURIComponent(lead.contactName ?? "")}`)}>
              <ArrowRight size={13} /> Create Quote
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CRMPage() {
  const { success, error } = useToast();
  const [leads, setLeads]           = useState<any[]>([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(false);
  const [view, setView]             = useState<"kanban"|"table">("kanban");
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [addOpen, setAddOpen]       = useState(false);
  const [form, setForm]             = useState(BLANK);
  const [saving, setSaving]         = useState(false);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ limit: "100", ...(search && { search }), ...(statusFilter && { status: statusFilter }) });
      const res = await fetch(`/api/leads?${qs}`);
      const json = await res.json();
      if (json.success) { setLeads(json.data.data); setTotal(json.data.pagination.total); }
    } catch {
      error("Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, value: form.value ? Number(form.value) : undefined };
      const res = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (json.success) {
        success("Lead created", json.data.title);
        setForm(BLANK);
        setAddOpen(false);
        fetchLeads();
      } else {
        error("Failed", json.error ?? "Unknown error");
      }
    } catch {
      error("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(id: string, status: string) {
    setLeads(ls => ls.map(l => l.id === id ? { ...l, status } : l));
    try {
      await fetch(`/api/leads/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    } catch {}
  }

  const setField = (k: string) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const totalValue = leads.reduce((s, l) => s + (l.value ?? 0), 0);
  const wonValue   = leads.filter(l => l.status === "WON").reduce((s, l) => s + (l.value ?? 0), 0);

  return (
    <div className="module-page">
      <div className="module-header">
        <div>
          <h1 className="module-title">CRM — Lead Pipeline</h1>
          <p className="module-subtitle">
            {total} leads · Pipeline: ₹{(totalValue / 100000).toFixed(1)}L · Won: ₹{(wonValue / 1000).toFixed(0)}K
            {loading && <span className="ml-2 text-xs opacity-60">Loading…</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost" onClick={fetchLeads} disabled={loading}><RefreshCw size={13} className={loading ? "animate-spin" : ""} /></button>
          {(["kanban", "table"] as const).map(v => (
            <button key={v} onClick={() => setView(v)} className={view === v ? "btn-primary" : "btn-ghost"} style={{ padding: "7px 14px", fontSize: "12px" }}>
              {v === "kanban" ? "Pipeline" : "Table"}
            </button>
          ))}
          <button className="btn-primary" onClick={() => setAddOpen(true)}><Plus size={14} /> Add Lead</button>
        </div>
      </div>

      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="search-bar flex-1 min-w-48">
          <Search size={13} style={{ color: "var(--text-muted)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads, companies…" />
          {search && <button onClick={() => setSearch("")} style={{ color: "var(--text-muted)" }}><X size={13} /></button>}
        </div>
        {(["", "NEW", "QUALIFIED", "PROPOSAL", "WON", "LOST"] as const).map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className={statusFilter === s ? "btn-primary" : "btn-ghost"} style={{ padding: "7px 12px", fontSize: "11px" }}>
            {s || "All"}
          </button>
        ))}
      </div>

      {/* Kanban */}
      {view === "kanban" && (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {STATUSES.slice(0, 5).map(s => {
            const col = leads.filter(l => l.status === s.key);
            const colVal = col.reduce((sum, l) => sum + (l.value ?? 0), 0);
            return (
              <div key={s.key} className="flex-shrink-0 w-60">
                <div className="flex items-center justify-between mb-2 px-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                    <span className="text-xs font-bold" style={{ color: s.color }}>{s.label}</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: `${s.color}22`, color: s.color }}>{col.length}</span>
                </div>
                <div className="text-xs mb-2 px-1" style={{ color: "var(--text-muted)" }}>₹{(colVal / 1000).toFixed(0)}K</div>
                {col.map(l => <LeadCard key={l.id} lead={l} onClick={setSelectedLead} active={selectedLead?.id === l.id} />)}
                {col.length === 0 && <div className="text-center py-8 text-xs rounded-xl" style={{ color: "var(--text-muted)", border: "1px dashed var(--border)" }}>No leads</div>}
              </div>
            );
          })}
        </div>
      )}

      {/* Table */}
      {view === "table" && (
        <div className="glass rounded-2xl overflow-auto">
          <table className="erp-table">
            <thead><tr>{["Company", "Contact", "Inquiry", "Value", "Status", "Source", "Created"].map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {leads.map(l => {
                const s = STATUSES.find(x => x.key === l.status);
                return (
                  <tr key={l.id} className="cursor-pointer" onClick={() => setSelectedLead(l)}>
                    <td className="font-semibold" style={{ color: "var(--text-primary)" }}>{l.company || "—"}</td>
                    <td style={{ color: "var(--text-muted)" }}>{l.contactName || "—"}</td>
                    <td style={{ color: "var(--text-muted)", maxWidth: 200 }}><div className="truncate">{l.title}</div></td>
                    <td className="font-semibold" style={{ color: "var(--brand-light)" }}>{l.value ? `₹${(l.value / 1000).toFixed(0)}K` : "—"}</td>
                    <td><span className="badge" style={{ background: `${s?.color}22`, color: s?.color }}>{s?.label}</span></td>
                    <td style={{ color: "var(--text-muted)" }}>{l.source}</td>
                    <td style={{ color: "var(--text-muted)" }}>{formatDate(l.createdAt)}</td>
                  </tr>
                );
              })}
              {leads.length === 0 && !loading && (
                <tr><td colSpan={7} className="text-center py-8" style={{ color: "var(--text-muted)" }}>No leads found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedLead && (
        <LeadDetailPanel
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Add Lead Drawer */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-end" style={{ background: "rgba(0,0,0,0.82)" }}
          onClick={e => { if (e.target === e.currentTarget) setAddOpen(false); }}>
          <div className="h-full w-full max-w-lg overflow-y-auto" style={{ background: "var(--bg-surface)", borderLeft: "1px solid var(--border)" }}>
            <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b" style={{ background: "var(--bg-surface)", borderColor: "var(--border)", zIndex: 10 }}>
              <div>
                <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Add Lead</h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Saved to database</p>
              </div>
              <button onClick={() => setAddOpen(false)} className="btn-ghost p-2"><X size={16} /></button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div>
                <label className="erp-label">Lead Title *</label>
                <input value={form.title} onChange={e => setField("title")(e.target.value)} className="erp-input" placeholder="500 Paper Cups + Meal Boxes" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="erp-label">Company</label>
                  <input value={form.company} onChange={e => setField("company")(e.target.value)} className="erp-input" placeholder="Spice Route Restaurant" />
                </div>
                <div>
                  <label className="erp-label">Contact Name</label>
                  <input value={form.contactName} onChange={e => setField("contactName")(e.target.value)} className="erp-input" placeholder="Rahul Sharma" />
                </div>
                <div>
                  <label className="erp-label">Phone</label>
                  <input value={form.phone} onChange={e => setField("phone")(e.target.value)} className="erp-input" type="tel" placeholder="+91 98765 43210" />
                </div>
                <div>
                  <label className="erp-label">Email</label>
                  <input value={form.email} onChange={e => setField("email")(e.target.value)} className="erp-input" type="email" placeholder="orders@customer.com" />
                </div>
                <div>
                  <label className="erp-label">Estimated Value (₹)</label>
                  <input value={form.value} onChange={e => setField("value")(e.target.value)} className="erp-input" type="number" placeholder="45000" />
                </div>
                <div>
                  <label className="erp-label">Source</label>
                  <select value={form.source} onChange={e => setField("source")(e.target.value)} className="erp-input">
                    {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="erp-label">Priority</label>
                  <select value={form.priority} onChange={e => setField("priority")(e.target.value)} className="erp-input">
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="erp-label">Notes</label>
                <textarea value={form.notes} onChange={e => setField("notes")(e.target.value)} className="erp-input" rows={3} style={{ resize: "none" }} placeholder="Any additional details…" />
              </div>
              <div className="flex gap-3 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
                <button type="button" onClick={() => setAddOpen(false)} className="btn-ghost flex-1 justify-center">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
                    : <><Plus size={14} />Save Lead</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
