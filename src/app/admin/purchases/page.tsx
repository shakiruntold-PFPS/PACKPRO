"use client";
import { useState, useCallback, useEffect } from "react";
import { Search, RefreshCw } from "lucide-react";
import { formatDate } from "@/lib/utils";

const STATUS_STYLE: Record<string,string> = {
  DRAFT:"badge-gray", SENT:"badge-blue", CONFIRMED:"badge-teal",
  PARTIAL:"badge-amber", RECEIVED:"badge-green", CANCELLED:"badge-red"
};

export default function PurchasesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (search) params.set("search", search);
      const res = await fetch(`/api/purchases?${params}`);
      const json = await res.json();
      setOrders(json.data?.data ?? []);
      setTotal(json.data?.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const totalActive = orders
    .filter((p:any) => !["RECEIVED","CANCELLED"].includes(p.status))
    .reduce((s:number, p:any) => s + (p.total ?? 0), 0);

  return (
    <div className="module-page">
      <div className="module-header">
        <div>
          <h1 className="module-title">Purchase Orders</h1>
          <p className="module-subtitle">Active: ₹{(totalActive/100000).toFixed(1)}L · {total} orders</p>
        </div>
        <button className="btn-ghost" onClick={fetchOrders}>
          <RefreshCw size={13} className={loading ? "animate-spin" : ""}/> Refresh
        </button>
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
            {loading && (
              <tr><td colSpan={8} className="text-center py-8" style={{ color:"var(--muted)" }}>Loading…</td></tr>
            )}
            {!loading && orders.length === 0 && (
              <tr><td colSpan={8} className="text-center py-8" style={{ color:"var(--muted)" }}>No purchase orders found</td></tr>
            )}
            {orders.map((po:any)=>(
              <tr key={po.id}>
                <td className="font-bold" style={{ color:"#14c7c0" }}>{po.number}</td>
                <td className="font-semibold text-white">{po.vendor?.name ?? "—"}</td>
                <td style={{ color:"var(--muted)" }}>{formatDate(po.createdAt)}</td>
                <td style={{ color:"var(--muted)" }}>{po.expectedDate ? formatDate(po.expectedDate) : "—"}</td>
                <td style={{ color:"var(--muted)" }}>{po._count?.items ?? 0} items</td>
                <td style={{ color:"var(--muted)" }}>₹{(po.taxAmount??0).toLocaleString("en-IN")}</td>
                <td className="font-bold text-white">₹{(po.total??0).toLocaleString("en-IN")}</td>
                <td><span className={`badge ${STATUS_STYLE[po.status]??""}`}>{po.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
