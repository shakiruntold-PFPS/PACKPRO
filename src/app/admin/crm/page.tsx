"use client";
import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Phone, ArrowRight, RefreshCw, X, CheckCircle, AlertCircle } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";

const STATUSES = [
  { key: "NEW",         label: "New",         color: "#60a5fa" },
  { key: "CONTACTED",   label: "Contacted",   color: "#a78bfa" },
  { key: "QUALIFIED",   label: "Qualified",   color: "#f59e0b" },
  { key: "PROPOSAL",    label: "Proposal",    color: "#fb923c" },
  { key: "NEGOTIATION", label: "Negotiation", color: "#14c7c0" },
  { key: "WON",         label: "Won",         color: "#10b981" },
  { key: "LOST",        label: "Lost",        color: "#ef4444" },
];

const SOURCES = ["WEBSITE","WHATSAPP","REFERRAL","GOOGLE","INSTAGRAM","FACEBOOK","COLD_CALL","EXHIBITION","OTHER"];
const PRIORITIES = ["LOW","MEDIUM","HIGH","URGENT"];

const BLANK = { title:"", company:"", contactName:"", phone:"", email:"", source:"WEBSITE", priority:"MEDIUM", value:"", notes:"" };

function Toast({ msg, ok, onDismiss }: any) {
  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl animate-in"
      style={{ background: ok ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", border: `1px solid ${ok ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.4)"}`, color: ok ? "#10b981" : "#ef4444", minWidth: "280px" }}>
      {ok ? <CheckCircle size={16} className="flex-shrink-0" /> : <AlertCircle size={16} className="flex-shrink-0" />}
      <span className="text-sm font-semibold flex-1">{msg}</span>
      <button onClick={onDismiss}><X size={14} /></button>
    </div>
  );
}

function LeadCard({ lead, onClick }: any) {
  const status = STATUSES.find(s => s.key === lead.status);
  return (
    <div onClick={() => onClick(lead)}
      className="glass rounded-xl p-4 cursor-pointer hover:bg-white/5 transition-all mb-2 border border-white/8 hover:border-teal-500/30">
      <div className="font-semibold text-sm text-white leading-tight mb-1 line-clamp-2">{lead.title}</div>
      <div className="text-xs mb-2" style={{ color: "var(--muted)" }}>{lead.company || lead.contactName}</div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold" style={{ color: "#14c7c0" }}>
          {lead.value ? `₹${(lead.value / 1000).toFixed(0)}K` : "—"}
        </span>
        <span className="text-xs" style={{ color: "var(--muted)" }}>{lead.source}</span>
      </div>
      {lead.phone && (
        <div className="mt-2 flex items-center gap-1">
          <a href={`tel:${lead.phone}`} onClick={e => e.stopPropagation()}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-md hover:bg-white/5"
            style={{ color: "var(--muted)" }}>
            <Phone size={10} /> Call
          </a>
          <a href={`https://wa.me/${lead.phone?.replace(/\D/g,"")}`}
            target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
            className="text-xs px-2 py-1 rounded-md" style={{ color: "#4ade80" }}>
            WhatsApp
          </a>
        </div>
      )}
    </div>
  );
}

function LeadModal({ lead, onClose, onStatusChange }: any) {
  if (!lead) return null;
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
          {[["Contact",lead.contactName],["Phone",lead.phone],["Source",lead.source],["Value",lead.value?`₹${(lead.value/1000).toFixed(0)}K`:"—"],["Priority",lead.priority],["Created",formatDate(lead.createdAt)]].map(([k,v]) => (
            <div key={k} className="rounded-lg p-3" style={{ background:"var(--glass)", border:"1px solid var(--border)" }}>
              <div className="text-xs font-bold uppercase mb-1" style={{ color:"var(--muted)" }}>{k}</div>
              <div className="text-sm font-semibold text-white">{v||"—"}</div>
            </div>
          ))}
        </div>
        <div className="mb-4">
          <label className="erp-label">Move to Stage</label>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map(s => (
              <button key={s.key} onClick={() => onStatusChange(lead.id, s.key)}
                className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                style={{ background: lead.status === s.key ? `${s.color}22` : "var(--glass)", border: `1px solid ${lead.status === s.key ? s.color+"55" : "var(--border)"}`, color: lead.status === s.key ? s.color : "var(--muted)" }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          {lead.phone && (
            <a href={`https://wa.me/${lead.phone?.replace(/\D/g,"")}`} target="_blank" rel="noreferrer"
              className="btn-ghost flex-1 justify-center" style={{ color:"#4ade80", borderColor:"#4ade8033" }}>
              WhatsApp
            </a>
          )}
          <button className="btn-primary flex-1 justify-center">
            <ArrowRight size={13} /> Convert to Quote
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CRMPage() {
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
  const [toast, setToast]           = useState<{msg:string;ok:boolean}|null>(null);

  const showToast = (msg:string, ok:boolean) => { setToast({msg,ok}); setTimeout(()=>setToast(null),4000); };

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ limit:"100", ...(search&&{search}), ...(statusFilter&&{status:statusFilter}) });
      const res = await fetch(`/api/leads?${qs}`);
      const json = await res.json();
      if (json.success) { setLeads(json.data.data); setTotal(json.data.pagination.total); }
    } catch { showToast("Failed to load leads", false); }
    finally { setLoading(false); }
  }, [search, statusFilter]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, value: form.value ? Number(form.value) : undefined };
      const res = await fetch("/api/leads", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload) });
      const json = await res.json();
      if (json.success) { showToast(`Lead "${json.data.title}" created`, true); setForm(BLANK); setAddOpen(false); fetchLeads(); }
      else showToast(json.error||"Failed to create lead", false);
    } catch { showToast("Network error", false); }
    finally { setSaving(false); }
  }

  async function handleStatusChange(id: string, status: string) {
    setLeads(ls => ls.map(l => l.id === id ? { ...l, status } : l));
    setSelectedLead((prev:any) => prev?.id === id ? { ...prev, status } : prev);
    try {
      await fetch(`/api/leads/${id}`, { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify({status}) });
    } catch {}
  }

  const setField = (k: string) => (v: string) => setForm(f => ({...f,[k]:v}));

  const totalValue = leads.reduce((s,l) => s+(l.value??0),0);
  const wonValue   = leads.filter(l=>l.status==="WON").reduce((s,l) => s+(l.value??0),0);

  return (
    <div className="module-page">
      {toast && <Toast msg={toast.msg} ok={toast.ok} onDismiss={()=>setToast(null)}/>}

      <div className="module-header">
        <div>
          <h1 className="module-title">CRM — Lead Pipeline</h1>
          <p className="module-subtitle">
            {total} leads · Pipeline: ₹{(totalValue/100000).toFixed(1)}L · Won: ₹{(wonValue/1000).toFixed(0)}K
            {loading && <span className="ml-2 text-xs opacity-60">Loading…</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost" onClick={fetchLeads} disabled={loading}><RefreshCw size={13} className={loading?"animate-spin":""}/></button>
          {["kanban","table"].map(v=>(
            <button key={v} onClick={()=>setView(v as any)} className={view===v?"btn-primary":"btn-ghost"} style={{padding:"7px 14px",fontSize:"12px"}}>
              {v==="kanban"?"Pipeline":"Table"}
            </button>
          ))}
          <button className="btn-primary" onClick={()=>setAddOpen(true)}><Plus size={14}/> Add Lead</button>
        </div>
      </div>

      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="search-bar flex-1 min-w-48">
          <Search size={13} style={{color:"var(--muted)"}}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search leads, companies…"/>
          {search && <button onClick={()=>setSearch("")} style={{color:"var(--muted)"}}><X size={13}/></button>}
        </div>
        {["","NEW","QUALIFIED","PROPOSAL","WON","LOST"].map(s=>(
          <button key={s} onClick={()=>setStatusFilter(s)} className={statusFilter===s?"btn-primary":"btn-ghost"} style={{padding:"7px 12px",fontSize:"11px"}}>
            {s||"All"}
          </button>
        ))}
      </div>

      {/* Kanban View */}
      {view==="kanban" && (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {STATUSES.slice(0,5).map(s=>{
            const col = leads.filter(l=>l.status===s.key);
            const colVal = col.reduce((sum,l)=>sum+(l.value??0),0);
            return (
              <div key={s.key} className="flex-shrink-0 w-64">
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{background:s.color}}/>
                    <span className="text-xs font-bold" style={{color:s.color}}>{s.label}</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{background:`${s.color}22`,color:s.color}}>{col.length}</span>
                </div>
                <div className="text-xs mb-2 px-1" style={{color:"var(--muted)"}}>₹{(colVal/1000).toFixed(0)}K</div>
                <div>
                  {col.map(l=><LeadCard key={l.id} lead={l} onClick={setSelectedLead}/>)}
                  {col.length===0 && <div className="text-center py-8 text-xs rounded-xl" style={{color:"var(--muted)",border:"1px dashed var(--border)"}}>No leads</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {view==="table" && (
        <div className="glass rounded-2xl overflow-auto">
          <table className="erp-table">
            <thead><tr>{["Company","Contact","Inquiry","Value","Status","Source","Created"].map(h=><th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {leads.map(l=>{
                const s=STATUSES.find(x=>x.key===l.status);
                return (
                  <tr key={l.id} className="cursor-pointer" onClick={()=>setSelectedLead(l)}>
                    <td className="font-semibold text-white">{l.company||"—"}</td>
                    <td style={{color:"var(--muted)"}}>{l.contactName||"—"}</td>
                    <td style={{color:"var(--muted)",maxWidth:200}}><div className="truncate">{l.title}</div></td>
                    <td className="font-semibold" style={{color:"#14c7c0"}}>{l.value?`₹${(l.value/1000).toFixed(0)}K`:"—"}</td>
                    <td><span className="badge" style={{background:`${s?.color}22`,color:s?.color}}>{s?.label}</span></td>
                    <td style={{color:"var(--muted)"}}>{l.source}</td>
                    <td style={{color:"var(--muted)"}}>{formatDate(l.createdAt)}</td>
                  </tr>
                );
              })}
              {leads.length===0 && !loading && (
                <tr><td colSpan={7} className="text-center py-8" style={{color:"var(--muted)"}}>No leads found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <LeadModal lead={selectedLead} onClose={()=>setSelectedLead(null)} onStatusChange={handleStatusChange}/>

      {/* Add Lead Drawer */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-end" style={{background:"rgba(0,0,0,0.82)"}}
          onClick={e=>{if(e.target===e.currentTarget)setAddOpen(false);}}>
          <div className="h-full w-full max-w-lg overflow-y-auto animate-in" style={{background:"#0d1f3c",borderLeft:"1px solid var(--border)"}}>
            <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b" style={{background:"#0d1f3c",borderColor:"var(--border)",zIndex:10}}>
              <div><h2 className="text-lg font-bold text-white">Add Lead</h2><p className="text-xs mt-0.5" style={{color:"var(--muted)"}}>Saved to database</p></div>
              <button onClick={()=>setAddOpen(false)} className="btn-ghost p-2"><X size={16}/></button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div>
                <label className="erp-label">Lead Title <span style={{color:"#ef4444"}}>*</span></label>
                <input value={form.title} onChange={e=>setField("title")(e.target.value)} className="erp-input" placeholder="500 Paper Cups + Meal Boxes" required/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="erp-label">Company</label>
                  <input value={form.company} onChange={e=>setField("company")(e.target.value)} className="erp-input" placeholder="Spice Route Restaurant"/>
                </div>
                <div>
                  <label className="erp-label">Contact Name</label>
                  <input value={form.contactName} onChange={e=>setField("contactName")(e.target.value)} className="erp-input" placeholder="Rahul Sharma"/>
                </div>
                <div>
                  <label className="erp-label">Phone</label>
                  <input value={form.phone} onChange={e=>setField("phone")(e.target.value)} className="erp-input" type="tel" placeholder="+91 98765 43210"/>
                </div>
                <div>
                  <label className="erp-label">Email</label>
                  <input value={form.email} onChange={e=>setField("email")(e.target.value)} className="erp-input" type="email" placeholder="orders@customer.com"/>
                </div>
                <div>
                  <label className="erp-label">Estimated Value (₹)</label>
                  <input value={form.value} onChange={e=>setField("value")(e.target.value)} className="erp-input" type="number" placeholder="45000"/>
                </div>
                <div>
                  <label className="erp-label">Source</label>
                  <select value={form.source} onChange={e=>setField("source")(e.target.value)} className="erp-input" style={{background:"#0b1e3d"}}>
                    {SOURCES.map(s=><option key={s} value={s} style={{background:"#0b1e3d"}}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="erp-label">Priority</label>
                  <select value={form.priority} onChange={e=>setField("priority")(e.target.value)} className="erp-input" style={{background:"#0b1e3d"}}>
                    {PRIORITIES.map(p=><option key={p} value={p} style={{background:"#0b1e3d"}}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="erp-label">Notes</label>
                <textarea value={form.notes} onChange={e=>setField("notes")(e.target.value)} className="erp-input" rows={3} style={{resize:"none"}} placeholder="Any additional details…"/>
              </div>
              <div className="flex gap-3 pt-2 border-t" style={{borderColor:"var(--border)"}}>
                <button type="button" onClick={()=>setAddOpen(false)} className="btn-ghost flex-1 justify-center">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving?<span className="inline-flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Saving…</span>:<><Plus size={14}/>Save Lead</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
