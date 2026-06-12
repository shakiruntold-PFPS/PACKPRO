"use client";
import { useState, useCallback, useEffect } from "react";
import { Plus, Search, Send, Eye, RefreshCw, CheckCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

const STATUS_STYLE: Record<string,string> = {
  DRAFT:"badge-gray", SENT:"badge-blue", VIEWED:"badge-purple",
  APPROVED:"badge-green", REJECTED:"badge-red", EXPIRED:"badge-orange", CONVERTED:"badge-teal"
};

function QuoteModal({ quote, onClose }: any) {
  if (!quote) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background:"rgba(0,0,0,0.85)" }}
      onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div className="w-full max-w-2xl rounded-2xl animate-in overflow-hidden"
        style={{ background:"#142645", border:"1px solid var(--border)", maxHeight:"90vh", overflowY:"auto" }}>
        <div className="p-5 border-b" style={{ borderColor:"var(--border)" }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color:"#14c7c0" }}>Quotation</div>
              <h2 className="text-xl font-black text-white">{quote.number}</h2>
              <div className="text-sm mt-1" style={{ color:"var(--muted)" }}>{quote.party?.name}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`badge ${STATUS_STYLE[quote.status]}`}>{quote.status}</span>
              <button onClick={onClose} className="btn-ghost p-1.5">✕</button>
            </div>
          </div>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[["Valid Till", quote.validTill ? formatDate(quote.validTill) : "—"], ["Created By", quote.createdBy?.name ?? "—"]].map(([k,v])=>(
              <div key={k} className="rounded-xl p-3" style={{ background:"var(--glass)", border:"1px solid var(--border)" }}>
                <div className="erp-label mb-1" style={{ fontSize:10 }}>{k}</div>
                <div className="text-sm font-semibold text-white">{v}</div>
              </div>
            ))}
          </div>
          {quote.items && quote.items.length > 0 && (
            <div className="mb-5 glass rounded-xl overflow-auto">
              <table className="erp-table">
                <thead><tr>{["Product","Qty","Rate","GST","Total"].map(h=><th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {quote.items.map((item: any, i: number) => (
                    <tr key={i}>
                      <td className="font-semibold text-white">{item.product?.name ?? "—"}</td>
                      <td style={{ color:"var(--muted)" }}>{item.qty} {item.unit}</td>
                      <td style={{ color:"var(--muted)" }}>₹{item.unitPrice}</td>
                      <td style={{ color:"var(--muted)" }}>{item.gstRate}%</td>
                      <td className="font-bold text-white">₹{(item.total??0).toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="rounded-xl p-4 mb-5" style={{ background:"var(--glass)", border:"1px solid var(--border)" }}>
            {[["Subtotal",`₹${(quote.subtotal??0).toLocaleString("en-IN")}`],["GST",`₹${(quote.taxAmount??0).toLocaleString("en-IN")}`]].map(([k,v])=>(
              <div key={k} className="flex justify-between text-sm py-1">
                <span style={{ color:"var(--muted)" }}>{k}</span><span className="text-white">{v}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold pt-2 border-t text-white" style={{ borderColor:"var(--border)" }}>
              <span>Total</span><span style={{ color:"#14c7c0" }}>₹{(quote.total??0).toLocaleString("en-IN")}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost flex-1 justify-center"><Send size={13}/> Send to Customer</button>
            {quote.status==="APPROVED" && (
              <button className="btn-primary flex-1 justify-center"><CheckCircle size={13}/> Convert to Order</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function QuotesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selected, setSelected] = useState<any>(null);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

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
    .filter((q:any) => !["REJECTED","EXPIRED"].includes(q.status))
    .reduce((s:number, q:any) => s + (q.total ?? 0), 0);

  return (
    <div className="module-page">
      <div className="module-header">
        <div>
          <h1 className="module-title">Quotations</h1>
          <p className="module-subtitle">Pipeline: ₹{(pipelineValue/100000).toFixed(1)}L · {total} quotes</p>
        </div>
        <button className="btn-ghost" onClick={fetchQuotes}>
          <RefreshCw size={13} className={loading ? "animate-spin" : ""}/> Refresh
        </button>
      </div>

      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="search-bar flex-1 min-w-48">
          <Search size={13} style={{ color:"var(--muted)" }}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search quotes…"/>
        </div>
        <div className="flex gap-2 flex-wrap">
          {["ALL","DRAFT","SENT","APPROVED","REJECTED","CONVERTED"].map(s=>(
            <button key={s} onClick={()=>setStatusFilter(s)}
              className={statusFilter===s?"btn-primary":"btn-ghost"} style={{ padding:"7px 12px", fontSize:"11px" }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl overflow-auto">
        <table className="erp-table">
          <thead>
            <tr>{["Quote #","Customer","Created By","Valid Till","Subtotal","GST","Total","Status","Actions"].map(h=><th key={h}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={9} className="text-center py-8" style={{ color:"var(--muted)" }}>Loading…</td></tr>
            )}
            {!loading && quotes.length === 0 && (
              <tr><td colSpan={9} className="text-center py-8" style={{ color:"var(--muted)" }}>No quotes found</td></tr>
            )}
            {quotes.map((q:any)=>(
              <tr key={q.id} className="cursor-pointer" onClick={()=>setSelected(q)}>
                <td className="font-bold" style={{ color:"#14c7c0" }}>{q.number}</td>
                <td className="font-semibold text-white">{q.party?.name ?? "—"}</td>
                <td style={{ color:"var(--muted)" }}>{q.createdBy?.name ?? "—"}</td>
                <td style={{ color:"var(--muted)" }}>{q.validTill ? formatDate(q.validTill) : "—"}</td>
                <td style={{ color:"var(--muted)" }}>₹{(q.subtotal??0).toLocaleString("en-IN")}</td>
                <td style={{ color:"var(--muted)" }}>₹{(q.taxAmount??0).toLocaleString("en-IN")}</td>
                <td className="font-bold text-white">₹{(q.total??0).toLocaleString("en-IN")}</td>
                <td><span className={`badge ${STATUS_STYLE[q.status]??""}`}>{q.status}</span></td>
                <td>
                  <div className="flex gap-1" onClick={e=>e.stopPropagation()}>
                    <button className="btn-ghost p-1.5" onClick={()=>setSelected(q)}><Eye size={12}/></button>
                    <button className="btn-ghost p-1.5"><Send size={12}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <QuoteModal quote={selected} onClose={()=>setSelected(null)}/>
    </div>
  );
}
