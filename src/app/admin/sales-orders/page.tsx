"use client";
import { useState, useCallback, useEffect } from "react";
import { Plus, Search, Truck, FileText, RefreshCw } from "lucide-react";
import { formatDate } from "@/lib/utils";

const STATUS_STYLE: Record<string,string> = {
  CONFIRMED:"badge-blue", PROCESSING:"badge-amber", READY:"badge-purple",
  DISPATCHED:"badge-teal", DELIVERED:"badge-green", CANCELLED:"badge-gray"
};

export default function SalesOrdersPage() {
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
      const res = await fetch(`/api/sales-orders?${params}`);
      const json = await res.json();
      setOrders(json.data?.data ?? []);
      setTotal(json.data?.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const activeValue = orders
    .filter(o => !["DELIVERED","CANCELLED"].includes(o.status))
    .reduce((s: number, o: any) => s + (o.total ?? 0), 0);

  return (
    <div className="module-page">
      <div className="module-header">
        <div>
          <h1 className="module-title">Sales Orders</h1>
          <p className="module-subtitle">Active: ₹{(activeValue/100000).toFixed(1)}L · {total} orders</p>
        </div>
        <button className="btn-ghost" onClick={fetchOrders}>
          <RefreshCw size={13} className={loading ? "animate-spin" : ""}/> Refresh
        </button>
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
            <tr>{["Order #","Customer","Quote Ref","Order Date","Delivery Date","Total","Status","Actions"].map(h=><th key={h}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={8} className="text-center py-8" style={{ color:"var(--muted)" }}>Loading…</td></tr>
            )}
            {!loading && orders.length === 0 && (
              <tr><td colSpan={8} className="text-center py-8" style={{ color:"var(--muted)" }}>No sales orders found</td></tr>
            )}
            {orders.map((o:any)=>(
              <tr key={o.id}>
                <td className="font-bold" style={{ color:"#14c7c0" }}>{o.number}</td>
                <td className="font-semibold text-white">{o.party?.name ?? "—"}</td>
                <td className="font-mono text-xs" style={{ color:"var(--muted)" }}>{o.quote?.number ?? "—"}</td>
                <td style={{ color:"var(--muted)" }}>{formatDate(o.createdAt)}</td>
                <td style={{ color:"var(--muted)" }}>{o.deliveryDate ? formatDate(o.deliveryDate) : "—"}</td>
                <td className="font-bold text-white">₹{(o.total??0).toLocaleString("en-IN")}</td>
                <td><span className={`badge ${STATUS_STYLE[o.status]??""}`}>{o.status}</span></td>
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
