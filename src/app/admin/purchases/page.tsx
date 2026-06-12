"use client";
import { useState } from "react";
import { Plus, Search, Package } from "lucide-react";
import { formatDate } from "@/lib/utils";

const STATUS_STYLE: Record<string,string> = {
  DRAFT:"badge-gray", SENT:"badge-blue", CONFIRMED:"badge-teal",
  PARTIAL:"badge-amber", RECEIVED:"badge-green", CANCELLED:"badge-red"
};

const MOCK_POS = [
  { id:"1", number:"PO-2506-001", vendor:{ name:"Raj Paper Mills" }, date:"2025-06-05", expectedDate:"2025-06-12", total:185000, taxAmount:33300, status:"CONFIRMED", items:3 },
  { id:"2", number:"PO-2506-002", vendor:{ name:"PET Solutions Pvt Ltd" }, date:"2025-06-03", expectedDate:"2025-06-10", total:96000, taxAmount:17280, status:"PARTIAL", items:2 },
  { id:"3", number:"PO-2506-003", vendor:{ name:"EcoWrap Industries" }, date:"2025-05-28", expectedDate:"2025-06-05", total:54000, taxAmount:6480, status:"RECEIVED", items:4 },
  { id:"4", number:"PO-2506-004", vendor:{ name:"Kraft Box Makers" }, date:"2025-06-08", expectedDate:"2025-06-18", total:42000, taxAmount:5040, status:"DRAFT", items:2 },
];

export default function PurchasesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filtered = MOCK_POS.filter(p=>
    (statusFilter==="ALL" || p.status===statusFilter) &&
    (!search || p.number.includes(search) || p.vendor.name.toLowerCase().includes(search.toLowerCase()))
  );

  const totalActive = MOCK_POS.filter(p=>!["RECEIVED","CANCELLED"].includes(p.status)).reduce((s,p)=>s+p.total,0);

  return (
    <div className="module-page">
      <div className="module-header">
        <div>
          <h1 className="module-title">Purchase Orders</h1>
          <p className="module-subtitle">Active: ₹{(totalActive/100000).toFixed(1)}L · {MOCK_POS.length} orders</p>
        </div>
        <button className="btn-primary"><Plus size={14}/> New PO</button>
      </div>

      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="search-bar flex-1 min-w-48">
          <Search size={13} style={{ color:"var(--muted)" }}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search purchase orders…"/>
        </div>
        {["ALL","DRAFT","CONFIRMED","PARTIAL","RECEIVED"].map(s=>(
          <button key={s} onClick={()=>setStatusFilter(s)}
            className={statusFilter===s?"btn-primary":"btn-ghost"} style={{ padding:"7px 12px", fontSize:"11px" }}>
            {s}
          </button>
        ))}
      </div>

      <div className="glass rounded-2xl overflow-auto">
        <table className="erp-table">
          <thead>
            <tr>{["PO #","Vendor","Date","Expected","Items","Tax","Total","Status"].map(h=><th key={h}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.map(po=>(
              <tr key={po.id}>
                <td className="font-bold" style={{ color:"#14c7c0" }}>{po.number}</td>
                <td className="font-semibold text-white">{po.vendor.name}</td>
                <td style={{ color:"var(--muted)" }}>{formatDate(po.date)}</td>
                <td style={{ color:"var(--muted)" }}>{formatDate(po.expectedDate)}</td>
                <td style={{ color:"var(--muted)" }}>{po.items} items</td>
                <td style={{ color:"var(--muted)" }}>₹{po.taxAmount.toLocaleString("en-IN")}</td>
                <td className="font-bold text-white">₹{po.total.toLocaleString("en-IN")}</td>
                <td><span className={`badge ${STATUS_STYLE[po.status]}`}>{po.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
