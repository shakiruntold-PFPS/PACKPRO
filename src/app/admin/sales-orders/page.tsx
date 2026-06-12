"use client";
import { useState } from "react";
import { Plus, Search, Truck, FileText } from "lucide-react";
import { formatDate } from "@/lib/utils";

const STATUS_STYLE: Record<string,string> = {
  CONFIRMED:"badge-blue", PROCESSING:"badge-amber", READY:"badge-purple",
  DISPATCHED:"badge-teal", DELIVERED:"badge-green", CANCELLED:"badge-gray"
};

const MOCK_ORDERS = [
  { id:"1", number:"SO-2506-001", party:{ name:"Cloud Bites Kitchen" }, quoteRef:"PPQ-2506-002", date:"2025-06-08", deliveryDate:"2025-06-15", total:115640, status:"PROCESSING", invoiced:false },
  { id:"2", number:"SO-2506-002", party:{ name:"The Coffee Lab" }, quoteRef:"PPQ-2506-003", date:"2025-06-07", deliveryDate:"2025-06-14", total:64900, status:"READY", invoiced:false },
  { id:"3", number:"SO-2506-003", party:{ name:"FreshFarm Delivery" }, quoteRef:"PPQ-2506-005", date:"2025-06-05", deliveryDate:"2025-06-12", total:89680, status:"DISPATCHED", invoiced:true },
  { id:"4", number:"SO-2506-004", party:{ name:"Burger Nation" }, quoteRef:"—", date:"2025-06-03", deliveryDate:"2025-06-10", total:54200, status:"DELIVERED", invoiced:true },
];

export default function SalesOrdersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filtered = MOCK_ORDERS.filter(o=>
    (statusFilter==="ALL" || o.status===statusFilter) &&
    (!search || o.number.includes(search) || o.party.name.toLowerCase().includes(search.toLowerCase()))
  );

  const activeValue = MOCK_ORDERS.filter(o=>!["DELIVERED","CANCELLED"].includes(o.status)).reduce((s,o)=>s+o.total,0);

  return (
    <div className="module-page">
      <div className="module-header">
        <div>
          <h1 className="module-title">Sales Orders</h1>
          <p className="module-subtitle">Active: ₹{(activeValue/100000).toFixed(1)}L · {MOCK_ORDERS.length} orders</p>
        </div>
        <button className="btn-primary"><Plus size={14}/> New Order</button>
      </div>

      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="search-bar flex-1 min-w-48">
          <Search size={13} style={{ color:"var(--muted)" }}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search orders…"/>
        </div>
        {["ALL","CONFIRMED","PROCESSING","READY","DISPATCHED","DELIVERED"].map(s=>(
          <button key={s} onClick={()=>setStatusFilter(s)}
            className={statusFilter===s?"btn-primary":"btn-ghost"} style={{ padding:"7px 12px", fontSize:"11px" }}>
            {s}
          </button>
        ))}
      </div>

      <div className="glass rounded-2xl overflow-auto">
        <table className="erp-table">
          <thead>
            <tr>{["Order #","Customer","Quote Ref","Order Date","Delivery Date","Total","Invoiced","Status","Actions"].map(h=><th key={h}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.map(o=>(
              <tr key={o.id}>
                <td className="font-bold" style={{ color:"#14c7c0" }}>{o.number}</td>
                <td className="font-semibold text-white">{o.party.name}</td>
                <td className="font-mono text-xs" style={{ color:"var(--muted)" }}>{o.quoteRef}</td>
                <td style={{ color:"var(--muted)" }}>{formatDate(o.date)}</td>
                <td style={{ color:"var(--muted)" }}>{formatDate(o.deliveryDate)}</td>
                <td className="font-bold text-white">₹{o.total.toLocaleString("en-IN")}</td>
                <td>
                  <span className={`badge ${o.invoiced?"badge-green":"badge-gray"}`}>
                    {o.invoiced?"Invoiced":"Pending"}
                  </span>
                </td>
                <td><span className={`badge ${STATUS_STYLE[o.status]}`}>{o.status}</span></td>
                <td>
                  <div className="flex gap-1">
                    <button className="btn-ghost p-1.5" title="Create Invoice"><FileText size={12}/></button>
                    <button className="btn-ghost p-1.5" title="Create Dispatch"><Truck size={12}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
