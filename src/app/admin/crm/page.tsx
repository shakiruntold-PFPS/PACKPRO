"use client";
import { useState, useEffect } from "react";
import { Plus, Search, Phone, Mail, Filter, MoreVertical, ArrowRight } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";

const STATUSES = [
  { key: "NEW", label: "New", color: "#60a5fa" },
  { key: "CONTACTED", label: "Contacted", color: "#a78bfa" },
  { key: "QUALIFIED", label: "Qualified", color: "#f59e0b" },
  { key: "PROPOSAL", label: "Proposal", color: "#fb923c" },
  { key: "NEGOTIATION", label: "Negotiation", color: "#14c7c0" },
  { key: "WON", label: "Won", color: "#10b981" },
  { key: "LOST", label: "Lost", color: "#ef4444" },
];

const MOCK_LEADS = [
  { id: "1", title: "500 Paper Cups + Meal Boxes", company: "Spice Route Restaurant", contactName: "Amit Sharma", phone: "+91 98765 43210", status: "QUALIFIED", priority: "HIGH", value: 45000, source: "WEBSITE", createdAt: "2025-06-08" },
  { id: "2", title: "Bulk Kraft Bowls 2000 pcs/month", company: "Cloud Bites Kitchen", contactName: "Priya Verma", phone: "+91 87654 32109", status: "PROPOSAL", priority: "URGENT", value: 120000, source: "WHATSAPP", createdAt: "2025-06-07" },
  { id: "3", title: "Custom Sweet Boxes with Logo", company: "Sweet Temptations", contactName: "Rahul Gupta", phone: "+91 76543 21098", status: "NEW", priority: "MEDIUM", value: 28000, source: "REFERRAL", createdAt: "2025-06-06" },
  { id: "4", title: "Ripple Cups 8oz & 12oz — 3000 pcs", company: "The Coffee Lab", contactName: "Sneha Joshi", phone: "+91 65432 10987", status: "NEGOTIATION", priority: "HIGH", value: 67500, source: "WEBSITE", createdAt: "2025-06-05" },
  { id: "5", title: "PET Containers + Custom Labels", company: "FreshFarm Delivery", contactName: "Vikram Singh", phone: "+91 54321 09876", status: "CONTACTED", priority: "MEDIUM", value: 92000, source: "GOOGLE", createdAt: "2025-06-03" },
  { id: "6", title: "Monthly Burger Boxes Supply", company: "Burger Nation", contactName: "Karan Mehta", phone: "+91 43210 98765", status: "WON", priority: "HIGH", value: 54000, source: "REFERRAL", createdAt: "2025-06-01" },
];

function LeadCard({ lead, onClick }: any) {
  const status = STATUSES.find(s => s.key === lead.status);
  return (
    <div onClick={() => onClick(lead)}
      className="glass rounded-xl p-4 cursor-pointer hover:bg-white/5 transition-all mb-2 border border-white/8 hover:border-teal-500/30">
      <div className="font-semibold text-sm text-white leading-tight mb-1 line-clamp-2">{lead.title}</div>
      <div className="text-xs mb-2" style={{ color: "var(--muted)" }}>{lead.company}</div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold" style={{ color: "#14c7c0" }}>
          ₹{(lead.value / 1000).toFixed(0)}K
        </span>
        <span className="text-xs" style={{ color: "var(--muted)" }}>{lead.source}</span>
      </div>
      <div className="mt-2 flex items-center gap-1">
        <a href={`tel:${lead.phone}`} onClick={e => e.stopPropagation()}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded-md hover:bg-white/5"
          style={{ color: "var(--muted)" }}>
          <Phone size={10} /> Call
        </a>
        <a href={`https://wa.me/${lead.phone?.replace(/\D/g, "")}`}
          target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded-md"
          style={{ color: "#4ade80" }}>
          WhatsApp
        </a>
      </div>
    </div>
  );
}

function LeadModal({ lead, onClose, onStatusChange }: any) {
  if (!lead) return null;
  const status = STATUSES.find(s => s.key === lead.status);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-xl rounded-2xl p-6 animate-in"
        style={{ background: "#142645", border: "1px solid var(--border)" }}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: "#14c7c0" }}>Lead Detail</div>
            <h2 className="text-lg font-bold text-white">{lead.title}</h2>
            <div className="text-sm mt-1" style={{ color: "var(--muted)" }}>{lead.company}</div>
          </div>
          <button onClick={onClose} className="btn-ghost p-2 text-xs">✕</button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            ["Contact", lead.contactName],
            ["Phone", lead.phone],
            ["Source", lead.source],
            ["Value", `₹${(lead.value / 1000).toFixed(0)}K`],
            ["Priority", lead.priority],
            ["Created", formatDate(lead.createdAt)],
          ].map(([k, v]) => (
            <div key={k} className="rounded-lg p-3" style={{ background: "var(--glass)", border: "1px solid var(--border)" }}>
              <div className="text-xs font-bold uppercase mb-1" style={{ color: "var(--muted)" }}>{k}</div>
              <div className="text-sm font-semibold text-white">{v || "—"}</div>
            </div>
          ))}
        </div>

        <div className="mb-4">
          <label className="erp-label">Move to Stage</label>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map(s => (
              <button key={s.key}
                onClick={() => onStatusChange(lead.id, s.key)}
                className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                style={{
                  background: lead.status === s.key ? `${s.color}22` : "var(--glass)",
                  border: `1px solid ${lead.status === s.key ? s.color + "55" : "var(--border)"}`,
                  color: lead.status === s.key ? s.color : "var(--muted)",
                }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <a href={`https://wa.me/${lead.phone?.replace(/\D/g, "")}`}
            target="_blank" rel="noreferrer"
            className="btn-ghost flex-1 justify-center" style={{ color: "#4ade80", borderColor: "#4ade8033" }}>
            WhatsApp
          </a>
          <button className="btn-primary flex-1 justify-center">
            <ArrowRight size={13} /> Convert to Quote
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CRMPage() {
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [search, setSearch] = useState("");
  const [leads, setLeads] = useState(MOCK_LEADS);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [addOpen, setAddOpen] = useState(false);

  const filtered = leads.filter(l =>
    !search || l.title.toLowerCase().includes(search.toLowerCase()) ||
    l.company.toLowerCase().includes(search.toLowerCase())
  );

  function handleStatusChange(id: string, status: string) {
    setLeads(ls => ls.map(l => l.id === id ? { ...l, status } : l));
    setSelectedLead((prev: any) => prev?.id === id ? { ...prev, status } : prev);
  }

  const totalValue = leads.reduce((s, l) => s + (l.value ?? 0), 0);
  const wonValue = leads.filter(l => l.status === "WON").reduce((s, l) => s + (l.value ?? 0), 0);

  return (
    <div className="module-page">
      <div className="module-header">
        <div>
          <h1 className="module-title">CRM — Lead Pipeline</h1>
          <p className="module-subtitle">
            {leads.length} leads · Pipeline: ₹{(totalValue / 100000).toFixed(1)}L · Won: ₹{(wonValue / 1000).toFixed(0)}K
          </p>
        </div>
        <div className="flex items-center gap-2">
          {["kanban", "table"].map(v => (
            <button key={v} onClick={() => setView(v as any)}
              className={view === v ? "btn-primary" : "btn-ghost"}
              style={{ padding: "7px 14px", fontSize: "12px" }}>
              {v === "kanban" ? "Pipeline" : "Table"}
            </button>
          ))}
          <button className="btn-primary" onClick={() => setAddOpen(true)}>
            <Plus size={14} /> Add Lead
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="search-bar mb-5 max-w-sm">
        <Search size={13} style={{ color: "var(--muted)" }} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search leads, companies…" />
      </div>

      {/* Kanban View */}
      {view === "kanban" && (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {STATUSES.slice(0, 5).map(s => {
            const col = filtered.filter(l => l.status === s.key);
            const colVal = col.reduce((sum, l) => sum + (l.value ?? 0), 0);
            return (
              <div key={s.key} className="flex-shrink-0 w-64">
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                    <span className="text-xs font-bold" style={{ color: s.color }}>{s.label}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                      style={{ background: `${s.color}22`, color: s.color }}>{col.length}</span>
                  </div>
                </div>
                <div className="text-xs mb-2 px-1" style={{ color: "var(--muted)" }}>
                  ₹{(colVal / 1000).toFixed(0)}K
                </div>
                <div>
                  {col.map(l => <LeadCard key={l.id} lead={l} onClick={setSelectedLead} />)}
                  {col.length === 0 && (
                    <div className="text-center py-8 text-xs rounded-xl"
                      style={{ color: "var(--muted)", border: "1px dashed var(--border)" }}>
                      No leads
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {view === "table" && (
        <div className="glass rounded-2xl overflow-auto">
          <table className="erp-table">
            <thead>
              <tr>
                {["Company", "Contact", "Inquiry", "Value", "Status", "Source", "Created"].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => {
                const s = STATUSES.find(x => x.key === l.status);
                return (
                  <tr key={l.id} className="cursor-pointer" onClick={() => setSelectedLead(l)}>
                    <td className="font-semibold text-white">{l.company}</td>
                    <td style={{ color: "var(--muted)" }}>{l.contactName}</td>
                    <td style={{ color: "var(--muted)", maxWidth: 200 }}>
                      <div className="truncate">{l.title}</div>
                    </td>
                    <td className="font-semibold" style={{ color: "#14c7c0" }}>
                      ₹{(l.value / 1000).toFixed(0)}K
                    </td>
                    <td>
                      <span className="badge" style={{ background: `${s?.color}22`, color: s?.color }}>
                        {s?.label}
                      </span>
                    </td>
                    <td style={{ color: "var(--muted)" }}>{l.source}</td>
                    <td style={{ color: "var(--muted)" }}>{formatDate(l.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <LeadModal lead={selectedLead} onClose={() => setSelectedLead(null)} onStatusChange={handleStatusChange} />
    </div>
  );
}
