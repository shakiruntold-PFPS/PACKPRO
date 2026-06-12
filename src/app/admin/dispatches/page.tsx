"use client";
import { useState } from "react";
import { Plus, Search, Truck } from "lucide-react";
import { formatDate } from "@/lib/utils";

const STATUS_STYLE: Record<string,string> = {
  READY:"badge-purple", DISPATCHED:"badge-blue", IN_TRANSIT:"badge-amber",
  DELIVERED:"badge-green", FAILED:"badge-red"
};

const MOCK_DISPATCHES = [
  { id:"1", number:"DSP-2506-001", order:"SO-2506-003", customer:"FreshFarm Delivery", date:"2025-06-07", transporter:"Mahindra Logistics", vehicle:"RJ-14-CA-1234", lr:"LR-2024-89123", status:"IN_TRANSIT" },
  { id:"2", number:"DSP-2506-002", order:"SO-2506-004", customer:"Burger Nation", date:"2025-06-05", transporter:"Own Vehicle", vehicle:"RJ-02-GA-5678", lr:"—", status:"DELIVERED" },
  { id:"3", number:"DSP-2506-003", order:"SO-2506-002", customer:"The Coffee Lab", date:"2025-06-09", transporter:"—", vehicle:"—", lr:"—", status:"READY" },
];

export default function DispatchesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filtered = MOCK_DISPATCHES.filter(d=>
    (statusFilter==="ALL" || d.status===statusFilter) &&
    (!search || d.number.includes(search) || d.customer.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="module-page">
      <div className="module-header">
        <div>
          <h1 className="module-title">Dispatches</h1>
          <p className="module-subtitle">{MOCK_DISPATCHES.filter(d=>d.status==="IN_TRANSIT").length} in transit · {MOCK_DISPATCHES.length} total</p>
        </div>
        <button className="btn-primary"><Plus size={14}/> New Dispatch</button>
      </div>

      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="search-bar flex-1 min-w-48">
          <Search size={13} style={{ color:"var(--muted)" }}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search dispatches…"/>
        </div>
        {["ALL","READY","DISPATCHED","IN_TRANSIT","DELIVERED"].map(s=>(
          <button key={s} onClick={()=>setStatusFilter(s)}
            className={statusFilter===s?"btn-primary":"btn-ghost"} style={{ padding:"7px 12px", fontSize:"11px" }}>
            {s==="IN_TRANSIT"?"In Transit":s}
          </button>
        ))}
      </div>

      <div className="glass rounded-2xl overflow-auto">
        <table className="erp-table">
          <thead>
            <tr>{["Dispatch #","Sales Order","Customer","Date","Transporter","Vehicle No.","LR No.","Status"].map(h=><th key={h}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.map(d=>(
              <tr key={d.id}>
                <td className="font-bold" style={{ color:"#14c7c0" }}>{d.number}</td>
                <td className="font-mono text-xs" style={{ color:"var(--muted)" }}>{d.order}</td>
                <td className="font-semibold text-white">{d.customer}</td>
                <td style={{ color:"var(--muted)" }}>{formatDate(d.date)}</td>
                <td style={{ color:"var(--muted)" }}>{d.transporter}</td>
                <td style={{ color:"var(--muted)" }}>{d.vehicle}</td>
                <td style={{ color:"var(--muted)" }}>{d.lr}</td>
                <td><span className={`badge ${STATUS_STYLE[d.status]}`}>{d.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
