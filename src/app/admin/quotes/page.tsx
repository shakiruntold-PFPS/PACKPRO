"use client";
import { useState } from "react";
import { Plus, Search, Send, Eye, FileText, CheckCircle, XCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

const STATUS_STYLE: Record<string,string> = {
  DRAFT:"badge-gray", SENT:"badge-blue", VIEWED:"badge-purple",
  APPROVED:"badge-green", REJECTED:"badge-red", EXPIRED:"badge-orange", CONVERTED:"badge-teal"
};

const MOCK_QUOTES = [
  { id:"1", number:"PPQ-2506-001", party:{ name:"Spice Route Restaurant", phone:"+91 98765 43210" }, createdBy:"Rahul S.", status:"SENT", validTill:"2025-06-22", subtotal:38500, taxAmount:6930, total:45430, items:[ { product:"Paper Cups 8oz", qty:500, unit:"pcs", unitPrice:65, gstRate:18, total:38350 }, { product:"Meal Box Large", qty:100, unit:"pcs", unitPrice:45, gstRate:12, total:5040 } ] },
  { id:"2", number:"PPQ-2506-002", party:{ name:"Cloud Bites Kitchen", phone:"+91 87654 32109" }, createdBy:"Rahul S.", status:"APPROVED", validTill:"2025-06-25", subtotal:98000, taxAmount:17640, total:115640, items:[] },
  { id:"3", number:"PPQ-2506-003", party:{ name:"The Coffee Lab", phone:"+91 76543 21098" }, createdBy:"Sneha G.", status:"DRAFT", validTill:"2025-06-28", subtotal:55000, taxAmount:9900, total:64900, items:[] },
  { id:"4", number:"PPQ-2506-004", party:{ name:"Sweet Temptations", phone:"+91 65432 10987" }, createdBy:"Rahul S.", status:"REJECTED", validTill:"2025-06-15", subtotal:22000, taxAmount:3960, total:25960, items:[] },
  { id:"5", number:"PPQ-2506-005", party:{ name:"FreshFarm Delivery", phone:"+91 54321 09876" }, createdBy:"Sneha G.", status:"CONVERTED", validTill:"2025-06-30", subtotal:76000, taxAmount:13680, total:89680, items:[] },
];

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
              <div className="text-sm mt-1" style={{ color:"var(--muted)" }}>{quote.party.name}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`badge ${STATUS_STYLE[quote.status]}`}>{quote.status}</span>
              <button onClick={onClose} className="btn-ghost p-1.5">✕</button>
            </div>
          </div>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[["Valid Till",formatDate(quote.validTill)],["Created By",quote.createdBy],["Phone",quote.party.phone]].map(([k,v])=>(
              <div key={k} className="rounded-xl p-3" style={{ background:"var(--glass)", border:"1px solid var(--border)" }}>
                <div className="erp-label mb-1" style={{ fontSize:10 }}>{k}</div>
                <div className="text-sm font-semibold text-white">{v}</div>
              </div>
            ))}
          </div>
          {quote.items.length > 0 && (
            <div className="mb-5 glass rounded-xl overflow-auto">
              <table className="erp-table">
                <thead><tr>{["Product","Qty","Rate","GST","Total"].map(h=><th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {quote.items.map((item: any, i: number) => (
                    <tr key={i}>
                      <td className="font-semibold text-white">{item.product}</td>
                      <td style={{ color:"var(--muted)" }}>{item.qty} {item.unit}</td>
                      <td style={{ color:"var(--muted)" }}>₹{item.unitPrice}</td>
                      <td style={{ color:"var(--muted)" }}>{item.gstRate}%</td>
                      <td className="font-bold text-white">₹{item.total.toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="rounded-xl p-4 mb-5" style={{ background:"var(--glass)", border:"1px solid var(--border)" }}>
            {[["Subtotal",`₹${quote.subtotal.toLocaleString("en-IN")}`],["GST",`₹${quote.taxAmount.toLocaleString("en-IN")}`]].map(([k,v])=>(
              <div key={k} className="flex justify-between text-sm py-1">
                <span style={{ color:"var(--muted)" }}>{k}</span><span className="text-white">{v}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold pt-2 border-t text-white" style={{ borderColor:"var(--border)" }}>
              <span>Total</span><span style={{ color:"#14c7c0" }}>₹{quote.total.toLocaleString("en-IN")}</span>
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

  const filtered = MOCK_QUOTES.filter(q=>
    (statusFilter==="ALL" || q.status===statusFilter) &&
    (!search || q.number.includes(search) || q.party.name.toLowerCase().includes(search.toLowerCase()))
  );

  const pipelineValue = MOCK_QUOTES.filter(q=>!["REJECTED","EXPIRED"].includes(q.status)).reduce((s,q)=>s+q.total,0);

  return (
    <div className="module-page">
      <div className="module-header">
        <div>
          <h1 className="module-title">Quotations</h1>
          <p className="module-subtitle">Pipeline: ₹{(pipelineValue/100000).toFixed(1)}L · {MOCK_QUOTES.length} quotes</p>
        </div>
        <button className="btn-primary"><Plus size={14}/> New Quote</button>
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
            {filtered.map(q=>(
              <tr key={q.id} className="cursor-pointer" onClick={()=>setSelected(q)}>
                <td className="font-bold" style={{ color:"#14c7c0" }}>{q.number}</td>
                <td className="font-semibold text-white">{q.party.name}</td>
                <td style={{ color:"var(--muted)" }}>{q.createdBy}</td>
                <td style={{ color:"var(--muted)" }}>{formatDate(q.validTill)}</td>
                <td style={{ color:"var(--muted)" }}>₹{q.subtotal.toLocaleString("en-IN")}</td>
                <td style={{ color:"var(--muted)" }}>₹{q.taxAmount.toLocaleString("en-IN")}</td>
                <td className="font-bold text-white">₹{q.total.toLocaleString("en-IN")}</td>
                <td><span className={`badge ${STATUS_STYLE[q.status]}`}>{q.status}</span></td>
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
