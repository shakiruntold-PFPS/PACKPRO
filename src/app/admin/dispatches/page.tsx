"use client";
import { useState, useCallback, useEffect } from "react";
import { Search, RefreshCw } from "lucide-react";
import { formatDate } from "@/lib/utils";

const STATUS_STYLE: Record<string,string> = {
  READY:"badge-purple", DISPATCHED:"badge-blue", IN_TRANSIT:"badge-amber",
  DELIVERED:"badge-green", FAILED:"badge-red"
};

export default function DispatchesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dispatches, setDispatches] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchDispatches = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (search) params.set("search", search);
      const res = await fetch(`/api/dispatches?${params}`);
      const json = await res.json();
      setDispatches(json.data?.data ?? []);
      setTotal(json.data?.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { fetchDispatches(); }, [fetchDispatches]);

  const inTransit = dispatches.filter((d:any) => d.status === "IN_TRANSIT").length;

  return (
    <div className="module-page">
      <div className="module-header">
        <div>
          <h1 className="module-title">Dispatches</h1>
          <p className="module-subtitle">{inTransit} in transit · {total} total</p>
        </div>
        <button className="btn-ghost" onClick={fetchDispatches}>
          <RefreshCw size={13} className={loading ? "animate-spin" : ""}/> Refresh
        </button>
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
            {loading && (
              <tr><td colSpan={8} className="text-center py-8" style={{ color:"var(--muted)" }}>Loading…</td></tr>
            )}
            {!loading && dispatches.length === 0 && (
              <tr><td colSpan={8} className="text-center py-8" style={{ color:"var(--muted)" }}>No dispatches found</td></tr>
            )}
            {dispatches.map((d:any)=>(
              <tr key={d.id}>
                <td className="font-bold" style={{ color:"#14c7c0" }}>{d.number}</td>
                <td className="font-mono text-xs" style={{ color:"var(--muted)" }}>{d.salesOrder?.number ?? "—"}</td>
                <td className="font-semibold text-white">{d.salesOrder?.party?.name ?? "—"}</td>
                <td style={{ color:"var(--muted)" }}>{formatDate(d.createdAt)}</td>
                <td style={{ color:"var(--muted)" }}>{d.transporter ?? "—"}</td>
                <td style={{ color:"var(--muted)" }}>{d.vehicleNo ?? "—"}</td>
                <td style={{ color:"var(--muted)" }}>{d.lrNumber ?? "—"}</td>
                <td><span className={`badge ${STATUS_STYLE[d.status]??""}`}>{d.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
