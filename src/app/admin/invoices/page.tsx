"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Plus, Trash2, Search, X, CheckCircle, AlertCircle,
  Eye, Printer, RefreshCw, ChevronLeft, ChevronRight, IndianRupee,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Party   { id:string; name:string; gstin?:string; city?:string; state?:string; address?:string; }
interface LineItem { description:string; hsn:string; qty:string; unit:string; unitPrice:string; discount:string; gstRate:string; isInterState:boolean; }
interface Invoice  { id:string; number:string; party:{name:string}; date:string; dueDate:string; total:number; balanceDue:number; status:string; subtotal?:number; taxAmount?:number; items?:any[]; terms?:string; notes?:string; type?:string; }

const BLANK:LineItem = { description:"",hsn:"",qty:"1",unit:"pcs",unitPrice:"",discount:"0",gstRate:"18",isInterState:false };
const STATUS_BADGE:Record<string,string> = { DRAFT:"badge-gray",SENT:"badge-blue",VIEWED:"badge-purple",PAID:"badge-green",PARTIALLY_PAID:"badge-amber",OVERDUE:"badge-red",CANCELLED:"badge-gray" };

function calcItem(item:LineItem) {
  const qty=Number(item.qty)||0,price=Number(item.unitPrice)||0,disc=Number(item.discount)||0,gst=Number(item.gstRate)||0;
  const taxable=qty*price-disc,taxAmt=(taxable*gst)/100,half=taxAmt/2;
  return { taxable, cgst:item.isInterState?0:half, sgst:item.isInterState?0:half, igst:item.isInterState?taxAmt:0, total:taxable+taxAmt };
}

export default function InvoicesPage() {
  const [invoices,setInvoices]=useState<Invoice[]>([]);
  const [total,setTotal]=useState(0);
  const [page,setPage]=useState(1);
  const [statusFilter,setStatusFilter]=useState("");
  const [listLoading,setListLoading]=useState(false);
  const [showForm,setShowForm]=useState(false);
  const [partySearch,setPartySearch]=useState("");
  const [partyResults,setPartyResults]=useState<Party[]>([]);
  const [selectedParty,setSelectedParty]=useState<Party|null>(null);
  const [partyOpen,setPartyOpen]=useState(false);
  const [invoiceType,setInvoiceType]=useState("TAX_INVOICE");
  const [date,setDate]=useState(new Date().toISOString().slice(0,10));
  const [dueDate,setDueDate]=useState("");
  const [notes,setNotes]=useState("");
  const [terms,setTerms]=useState("Payment due within 14 days. Subject to Alwar jurisdiction.");
  const [items,setItems]=useState<LineItem[]>([{...BLANK}]);
  const [saving,setSaving]=useState(false);
  const [toast,setToast]=useState<{msg:string;ok:boolean}|null>(null);
  const [viewInv,setViewInv]=useState<Invoice|null>(null);
  const PER_PAGE=15;

  const fetchInvoices=useCallback(async()=>{
    setListLoading(true);
    try {
      const qs=new URLSearchParams({page:String(page),limit:String(PER_PAGE),...(statusFilter&&{status:statusFilter})});
      const res=await fetch(`/api/invoices?${qs}`);
      const json=await res.json();
      if(json.success){setInvoices(json.data.data);setTotal(json.data.pagination.total);}
    } finally { setListLoading(false); }
  },[page,statusFilter]);

  useEffect(()=>{fetchInvoices();},[fetchInvoices]);
  useEffect(()=>{setPage(1);},[statusFilter]);

  useEffect(()=>{
    if(!partySearch){setPartyResults([]);return;}
    const t=setTimeout(async()=>{
      const res=await fetch(`/api/parties?search=${encodeURIComponent(partySearch)}&limit=8`);
      const json=await res.json();
      if(json.success)setPartyResults(json.data.data);
    },300);
    return()=>clearTimeout(t);
  },[partySearch]);

  function showToast(msg:string,ok:boolean){setToast({msg,ok});setTimeout(()=>setToast(null),4000);}
  function updItem(idx:number,k:keyof LineItem,v:any){setItems(p=>p.map((it,i)=>i===idx?{...it,[k]:v}:it));}
  function addItem(){setItems(p=>[...p,{...BLANK}]);}
  function rmItem(idx:number){setItems(p=>p.filter((_,i)=>i!==idx));}

  const calcs=items.map(calcItem);
  const subtotal=calcs.reduce((s,c)=>s+c.taxable,0);
  const totalTax=calcs.reduce((s,c)=>s+c.cgst+c.sgst+c.igst,0);
  const grandTotal=subtotal+totalTax;

  async function handleSubmit(e:React.FormEvent){
    e.preventDefault();
    if(!selectedParty){showToast("Please select a party",false);return;}
    if(!dueDate){showToast("Please set a due date",false);return;}
    if(items.some(i=>!i.description||!i.unitPrice)){showToast("Fill description and price for all rows",false);return;}
    setSaving(true);
    try {
      const payload={
        partyId:selectedParty.id,type:invoiceType,date,dueDate,notes,terms,
        items:items.map(it=>({
          description:it.description,hsn:it.hsn||undefined,qty:Number(it.qty),unit:it.unit,
          unitPrice:Number(it.unitPrice),discount:Number(it.discount),gstRate:Number(it.gstRate),isInterState:it.isInterState
        }))
      };
      const res=await fetch("/api/invoices",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      const json=await res.json();
      if(json.success){
        showToast(`Invoice ${json.data.number} created — \u20b9${Number(json.data.total).toLocaleString("en-IN")}`,true);
        setShowForm(false);setSelectedParty(null);setPartySearch("");setItems([{...BLANK}]);setDueDate("");
        fetchInvoices();
      } else { showToast(json.error||"Failed to create invoice",false); }
    } catch { showToast("Network error. Please try again.",false); }
    finally { setSaving(false); }
  }

  function printInvoice(inv:Invoice){
    const w=window.open("","_blank");if(!w)return;
    w.document.write(`<!DOCTYPE html><html><head><title>${inv.number}</title><style>
body{font-family:Arial,sans-serif;margin:0;padding:32px;color:#111;font-size:13px;}
.hdr{display:flex;justify-content:space-between;border-bottom:2px solid #0b1e3d;padding-bottom:16px;margin-bottom:20px;}
.co{font-size:20px;font-weight:900;color:#0b1e3d;}.sub{font-size:11px;color:#666;margin-top:2px;}
.inv-t{font-size:17px;font-weight:800;color:#0b1e3d;text-align:right;}
.bill{background:#f7f7f7;padding:12px;border-radius:6px;margin-bottom:18px;font-size:12px;}
table{width:100%;border-collapse:collapse;margin-bottom:16px;}
th{background:#0b1e3d;color:#fff;padding:8px;text-align:left;font-size:11px;}
td{padding:8px;border-bottom:1px solid #eee;font-size:12px;}
.tots{margin-left:auto;width:260px;font-size:13px;}
.tot-row{display:flex;justify-content:space-between;padding:3px 0;}
.grand{font-weight:700;font-size:15px;border-top:2px solid #0b1e3d;padding-top:6px;margin-top:4px;}
.footer{border-top:1px solid #ddd;margin-top:20px;padding-top:12px;font-size:11px;color:#888;}
</style></head><body>
<div class="hdr">
  <div><div class="co">PACKPRO</div><div class="sub">Food Packaging Solutions</div>
  <div class="sub">Dholidub, Narnaul-Behror Road, Alwar, Rajasthan</div>
  <div class="sub">+91 9057627625 | sales@packpro.site</div></div>
  <div><div class="inv-t">${(inv.type||"TAX INVOICE").replace(/_/g," ")}</div>
  <div style="text-align:right;font-size:13px;font-weight:600;">${inv.number}</div>
  <div style="text-align:right;font-size:12px;color:#555;">Date: ${formatDate(inv.date)}</div>
  <div style="text-align:right;font-size:12px;color:#555;">Due: ${formatDate(inv.dueDate)}</div></div>
</div>
<div class="bill"><div style="font-weight:700;font-size:10px;text-transform:uppercase;color:#888;margin-bottom:4px;">Bill To</div>
<strong>${inv.party?.name||""}</strong></div>
<table><thead><tr><th>#</th><th>Description</th><th>HSN</th><th>Qty</th><th>Rate</th><th>CGST</th><th>SGST</th><th>IGST</th><th>Total</th></tr></thead>
<tbody>${(inv.items||[]).map((it:any,i:number)=>`<tr>
<td>${i+1}</td><td>${it.description}</td><td>${it.hsn||"—"}</td><td>${it.qty}</td>
<td>&#8377;${Number(it.unitPrice).toFixed(2)}</td><td>&#8377;${Number(it.cgst).toFixed(2)}</td>
<td>&#8377;${Number(it.sgst).toFixed(2)}</td><td>&#8377;${Number(it.igst).toFixed(2)}</td>
<td><strong>&#8377;${Number(it.total).toFixed(2)}</strong></td></tr>`).join("")}</tbody></table>
<div style="display:flex;justify-content:flex-end;"><div class="tots">
<div class="tot-row"><span>Subtotal</span><span>&#8377;${Number(inv.subtotal||0).toFixed(2)}</span></div>
<div class="tot-row"><span>Tax</span><span>&#8377;${Number(inv.taxAmount||0).toFixed(2)}</span></div>
<div class="tot-row grand"><span>TOTAL</span><span>&#8377;${Number(inv.total||0).toFixed(2)}</span></div>
<div class="tot-row" style="color:${Number(inv.balanceDue)>0?"#dc2626":"#059669"};font-weight:700;">
<span>Balance Due</span><span>&#8377;${Number(inv.balanceDue||0).toFixed(2)}</span></div>
</div></div>
${inv.terms?`<div class="footer"><strong>Terms:</strong> ${inv.terms}</div>`:""}
</body></html>`);
    w.document.close();w.print();
  }

  const totalPages=Math.ceil(total/PER_PAGE);

  return (
    <div className="module-page">
      {toast&&(
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl animate-in" style={{background:toast.ok?"rgba(16,185,129,0.15)":"rgba(239,68,68,0.15)",border:`1px solid ${toast.ok?"rgba(16,185,129,0.4)":"rgba(239,68,68,0.4)"}`,color:toast.ok?"#10b981":"#ef4444",minWidth:"300px"}}>
          {toast.ok?<CheckCircle size={16} className="flex-shrink-0"/>:<AlertCircle size={16} className="flex-shrink-0"/>}
          <span className="text-sm font-semibold">{toast.msg}</span>
        </div>
      )}

      <div className="module-header">
        <div><h1 className="module-title">Invoices</h1><p className="module-subtitle">{total} total · GST Tax Invoices</p></div>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={fetchInvoices} disabled={listLoading}><RefreshCw size={13} className={listLoading?"animate-spin":""}/></button>
          <button className="btn-primary" onClick={()=>setShowForm(true)}><Plus size={14}/> New Invoice</button>
        </div>
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {["","DRAFT","SENT","PAID","PARTIALLY_PAID","OVERDUE"].map(s=>(
          <button key={s} onClick={()=>setStatusFilter(s)} className={statusFilter===s?"btn-primary":"btn-ghost"} style={{padding:"7px 12px",fontSize:"11px"}}>
            {s===""?"All":s==="PARTIALLY_PAID"?"Part-Paid":s}
          </button>
        ))}
      </div>

      <div className="glass rounded-2xl overflow-auto mb-4">
        {listLoading&&invoices.length===0?(
          <div className="empty-state"><div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"/><p className="text-sm">Loading…</p></div>
        ):invoices.length===0?(
          <div className="empty-state"><IndianRupee size={40}/><p className="text-sm mt-2 font-semibold">No invoices yet</p><button className="btn-primary mt-4" onClick={()=>setShowForm(true)}><Plus size={13}/> Create First Invoice</button></div>
        ):(
          <table className="erp-table">
            <thead><tr>{["Invoice #","Customer","Date","Due Date","Amount","Balance","Status",""].map(h=><th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {invoices.map(inv=>(
                <tr key={inv.id} className="cursor-pointer" onClick={()=>setViewInv(inv)}>
                  <td className="font-bold" style={{color:"#14c7c0"}}>{inv.number}</td>
                  <td className="font-semibold text-white">{inv.party?.name}</td>
                  <td style={{color:"var(--muted)"}}>{formatDate(inv.date)}</td>
                  <td style={{color:inv.status==="OVERDUE"?"#ef4444":"var(--muted)"}}>{formatDate(inv.dueDate)}</td>
                  <td className="font-bold text-white">₹{Number(inv.total).toLocaleString("en-IN")}</td>
                  <td style={{color:inv.balanceDue>0?"#ef4444":"#10b981",fontWeight:600}}>₹{Number(inv.balanceDue).toLocaleString("en-IN")}</td>
                  <td><span className={`badge ${STATUS_BADGE[inv.status]??"badge-gray"}`}>{inv.status}</span></td>
                  <td><div className="flex gap-1" onClick={e=>e.stopPropagation()}><button className="btn-ghost p-1.5" onClick={()=>setViewInv(inv)}><Eye size={12}/></button><button className="btn-ghost p-1.5" onClick={()=>printInvoice(inv)}><Printer size={12}/></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages>1&&(
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs" style={{color:"var(--muted)"}}>Showing {(page-1)*PER_PAGE+1}–{Math.min(page*PER_PAGE,total)} of {total}</div>
          <div className="flex gap-2">
            <button className="btn-ghost p-2" onClick={()=>setPage(p=>p-1)} disabled={page===1}><ChevronLeft size={14}/></button>
            <span className="btn-ghost px-3 py-2 text-xs pointer-events-none">{page}/{totalPages}</span>
            <button className="btn-ghost p-2" onClick={()=>setPage(p=>p+1)} disabled={page>=totalPages}><ChevronRight size={14}/></button>
          </div>
        </div>
      )}

      {/* CREATE INVOICE DRAWER */}
      {showForm&&(
        <div className="fixed inset-0 z-50 flex items-start justify-end" style={{background:"rgba(0,0,0,0.8)"}} onClick={e=>{if(e.target===e.currentTarget){setShowForm(false);}}}>
          <div className="h-full w-full max-w-2xl overflow-y-auto animate-in" style={{background:"#0d1f3c",borderLeft:"1px solid var(--border)"}}>
            <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b" style={{background:"#0d1f3c",borderColor:"var(--border)",zIndex:10}}>
              <div><h2 className="text-lg font-bold text-white">New Invoice</h2><p className="text-xs mt-0.5" style={{color:"var(--muted)"}}>Total: <span className="font-bold" style={{color:"#14c7c0"}}>₹{grandTotal.toFixed(2)}</span></p></div>
              <button onClick={()=>setShowForm(false)} className="btn-ghost p-2"><X size={16}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">

              {/* Invoice meta */}
              <section>
                <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{color:"#14c7c0",letterSpacing:"1.5px"}}>Invoice Details</div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="erp-label">Type</label>
                    <select value={invoiceType} onChange={e=>setInvoiceType(e.target.value)} className="erp-input" style={{background:"#0b1e3d"}}>
                      {["TAX_INVOICE","PROFORMA","CREDIT_NOTE","DEBIT_NOTE"].map(t=><option key={t} value={t} style={{background:"#0b1e3d"}}>{t.replace(/_/g," ")}</option>)}
                    </select>
                  </div><div/>
                  <div><label className="erp-label">Invoice Date</label><input type="date" value={date} onChange={e=>setDate(e.target.value)} className="erp-input" required/></div>
                  <div><label className="erp-label">Due Date <span style={{color:"#ef4444"}}>*</span></label><input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} className="erp-input" required/></div>
                </div>
              </section>

              {/* Party */}
              <section>
                <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{color:"#14c7c0",letterSpacing:"1.5px"}}>Bill To</div>
                {selectedParty?(
                  <div className="flex items-center justify-between p-3 rounded-xl" style={{background:"rgba(14,165,160,0.1)",border:"1px solid rgba(14,165,160,0.3)"}}>
                    <div><div className="font-bold text-white">{selectedParty.name}</div>{selectedParty.gstin&&<div className="text-xs font-mono mt-0.5" style={{color:"var(--muted)"}}>GSTIN: {selectedParty.gstin}</div>}</div>
                    <button type="button" onClick={()=>{setSelectedParty(null);setPartySearch("");}} className="btn-ghost p-1.5"><X size={13}/></button>
                  </div>
                ):(
                  <div className="relative">
                    <div className="search-bar"><Search size={13} style={{color:"var(--muted)"}}/>
                      <input value={partySearch} onChange={e=>{setPartySearch(e.target.value);setPartyOpen(true);}} onFocus={()=>setPartyOpen(true)} placeholder="Search party name…" autoComplete="off"/>
                    </div>
                    {partyOpen&&partyResults.length>0&&(
                      <div className="absolute left-0 right-0 top-full mt-1 rounded-xl overflow-hidden z-20 shadow-xl" style={{background:"#142645",border:"1px solid var(--border)"}}>
                        {partyResults.map(p=>(
                          <button key={p.id} type="button" className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors"
                            onClick={()=>{setSelectedParty(p);setPartyOpen(false);setPartySearch("");}}>
                            <div className="font-semibold text-white text-sm">{p.name}</div>
                            {p.city&&<div className="text-xs mt-0.5" style={{color:"var(--muted)"}}>{p.city}</div>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* Line items */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-bold uppercase tracking-widest" style={{color:"#14c7c0",letterSpacing:"1.5px"}}>Line Items</div>
                  <button type="button" onClick={addItem} className="btn-ghost" style={{padding:"4px 10px",fontSize:"12px"}}><Plus size={12}/> Add Row</button>
                </div>
                <div className="space-y-3">
                  {items.map((item,idx)=>{
                    const c=calcItem(item);
                    return (
                      <div key={idx} className="rounded-xl p-4" style={{background:"rgba(255,255,255,0.03)",border:"1px solid var(--border)"}}>
                        <div className="grid grid-cols-6 gap-2 mb-2">
                          <div className="col-span-3"><label className="erp-label" style={{fontSize:10}}>Description *</label><input value={item.description} onChange={e=>updItem(idx,"description",e.target.value)} className="erp-input" placeholder="Product / service" required/></div>
                          <div><label className="erp-label" style={{fontSize:10}}>HSN</label><input value={item.hsn} onChange={e=>updItem(idx,"hsn",e.target.value)} className="erp-input" placeholder="3923"/></div>
                          <div><label className="erp-label" style={{fontSize:10}}>Unit</label>
                            <select value={item.unit} onChange={e=>updItem(idx,"unit",e.target.value)} className="erp-input" style={{background:"#0b1e3d"}}>
                              {["pcs","kg","g","litre","box","set","pack","dozen"].map(u=><option key={u} value={u} style={{background:"#0b1e3d"}}>{u}</option>)}
                            </select>
                          </div>
                          <div className="flex items-end pb-0.5"><button type="button" onClick={()=>rmItem(idx)} disabled={items.length===1} className="btn-danger p-2" style={{width:"100%",justifyContent:"center",opacity:items.length===1?0.3:1}}><Trash2 size={13}/></button></div>
                        </div>
                        <div className="grid grid-cols-5 gap-2 mb-2">
                          <div><label className="erp-label" style={{fontSize:10}}>Qty *</label><input type="number" value={item.qty} min="0.01" step="any" onChange={e=>updItem(idx,"qty",e.target.value)} className="erp-input" required/></div>
                          <div><label className="erp-label" style={{fontSize:10}}>Unit Price *</label><input type="number" value={item.unitPrice} min="0" step="any" onChange={e=>updItem(idx,"unitPrice",e.target.value)} className="erp-input" placeholder="0.00" required/></div>
                          <div><label className="erp-label" style={{fontSize:10}}>Discount ₹</label><input type="number" value={item.discount} min="0" step="any" onChange={e=>updItem(idx,"discount",e.target.value)} className="erp-input"/></div>
                          <div><label className="erp-label" style={{fontSize:10}}>GST %</label>
                            <select value={item.gstRate} onChange={e=>updItem(idx,"gstRate",e.target.value)} className="erp-input" style={{background:"#0b1e3d"}}>
                              {["0","5","12","18","28"].map(r=><option key={r} value={r} style={{background:"#0b1e3d"}}>{r}%</option>)}
                            </select>
                          </div>
                          <div><label className="erp-label" style={{fontSize:10}}>Line Total</label><div className="erp-input font-bold" style={{color:"#14c7c0",cursor:"default"}}>₹{c.total.toFixed(2)}</div></div>
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={item.isInterState} onChange={e=>updItem(idx,"isInterState",e.target.checked)} className="accent-teal-500"/><span className="text-xs" style={{color:"var(--muted)"}}>Inter-state (IGST)</span></label>
                          <div className="text-xs" style={{color:"var(--muted)"}}>Taxable: ₹{c.taxable.toFixed(2)} | {item.isInterState?`IGST: ₹${c.igst.toFixed(2)}`:`CGST: ₹${c.cgst.toFixed(2)} + SGST: ₹${c.sgst.toFixed(2)}`}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Totals */}
              <div className="rounded-xl p-4" style={{background:"rgba(14,165,160,0.05)",border:"1px solid rgba(14,165,160,0.2)"}}>
                {[["Subtotal",`₹${subtotal.toFixed(2)}`],["Total GST",`₹${totalTax.toFixed(2)}`]].map(([k,v])=>(
                  <div key={k} className="flex justify-between text-sm mb-1.5"><span style={{color:"var(--muted)"}}>{k}</span><span className="text-white">{v}</span></div>
                ))}
                <div className="flex justify-between font-black text-lg pt-2 border-t" style={{borderColor:"rgba(14,165,160,0.3)"}}>
                  <span className="text-white">Grand Total</span><span style={{color:"#14c7c0"}}>₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Notes / Terms */}
              <div className="grid grid-cols-2 gap-3">
                <div><label className="erp-label">Notes</label><textarea value={notes} onChange={e=>setNotes(e.target.value)} className="erp-input" rows={3} style={{resize:"none"}} placeholder="Internal notes…"/></div>
                <div><label className="erp-label">Terms & Conditions</label><textarea value={terms} onChange={e=>setTerms(e.target.value)} className="erp-input" rows={3} style={{resize:"none"}}/></div>
              </div>

              <div className="flex gap-3 pt-2 border-t" style={{borderColor:"var(--border)"}}>
                <button type="button" onClick={()=>setShowForm(false)} className="btn-ghost flex-1 justify-center">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving?<span className="inline-flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Creating…</span>:<><Plus size={14}/> Create Invoice</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {viewInv&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:"rgba(0,0,0,0.85)"}} onClick={e=>{if(e.target===e.currentTarget)setViewInv(null);}}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden animate-in" style={{background:"#142645",border:"1px solid var(--border)"}}>
            <div className="flex items-center justify-between p-5 border-b" style={{borderColor:"var(--border)"}}>
              <div><div className="text-xs font-bold uppercase" style={{color:"#14c7c0"}}>Invoice</div><h2 className="text-xl font-black text-white">{viewInv.number}</h2></div>
              <div className="flex items-center gap-2">
                <span className={`badge ${STATUS_BADGE[viewInv.status]??"badge-gray"}`}>{viewInv.status}</span>
                <button className="btn-ghost p-1.5" onClick={()=>printInvoice(viewInv)}><Printer size={14}/></button>
                <button onClick={()=>setViewInv(null)} className="btn-ghost p-1.5"><X size={15}/></button>
              </div>
            </div>
            <div className="p-5 grid grid-cols-2 gap-3">
              {[["Customer",viewInv.party?.name],["Date",formatDate(viewInv.date)],["Due",formatDate(viewInv.dueDate)],["Total",`₹${Number(viewInv.total).toLocaleString("en-IN")}`],["Balance Due",`₹${Number(viewInv.balanceDue).toLocaleString("en-IN")}`]].map(([k,v])=>(
                <div key={k} className="rounded-xl p-3" style={{background:"var(--glass)",border:"1px solid var(--border)"}}><div className="erp-label mb-1" style={{fontSize:10}}>{k}</div><div className="text-sm font-bold text-white">{v}</div></div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
