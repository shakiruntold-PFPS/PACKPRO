"use client";
import { useState, useCallback, useEffect } from "react";
import { Search, Mail, Phone, RefreshCw, Plus } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function EmployeesPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/hr/employees?${params}`);
      const json = await res.json();
      setEmployees(json.data?.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const activeCount = employees.filter(e => e.isActive).length;
  const totalPayroll = employees.filter(e => e.isActive).reduce((s, e) => s + (e.salary ?? 0), 0);

  return (
    <div className="module-page">
      <div className="module-header">
        <div>
          <h1 className="module-title">Employees</h1>
          <p className="module-subtitle">
            {activeCount} active · Monthly payroll: ₹{(totalPayroll/1000).toFixed(0)}K
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={fetchEmployees}>
            <RefreshCw size={13} className={loading ? "animate-spin" : ""}/> Refresh
          </button>
        </div>
      </div>

      <div className="search-bar mb-5 max-w-sm">
        <Search size={13} style={{ color:"var(--muted)" }}/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search employees…"/>
      </div>

      {loading && <div className="text-center py-8" style={{ color:"var(--muted)" }}>Loading…</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.map(emp=>(
          <div key={emp.id} onClick={()=>setSelected(emp)}
            className="glass rounded-2xl p-5 cursor-pointer hover:bg-white/5 transition-all border border-white/8 hover:border-teal-500/30">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ background:"linear-gradient(135deg,#0ea5a0,#1b4f8a)", color:"#fff" }}>
                {emp.name.split(" ").map((n:string)=>n[0]).join("").slice(0,2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white truncate">{emp.name}</div>
                <div className="text-xs mt-0.5" style={{ color:"var(--muted)" }}>{emp.designation}</div>
              </div>
              <span className={`badge ${emp.isActive?"badge-green":"badge-gray"}`}>
                {emp.isActive?"Active":"Inactive"}
              </span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs" style={{ color:"var(--muted)" }}>
                <span className="font-mono text-xs" style={{ color:"#14c7c0" }}>{emp.empCode}</span>
                <span>·</span>
                <span>{emp.department?.name ?? "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-xs" style={{ color:"var(--muted)" }}>
                <Phone size={11}/>
                <span>{emp.phone ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor:"var(--border)" }}>
                <span className="text-xs" style={{ color:"var(--muted)" }}>Since {emp.joiningDate ? formatDate(emp.joiningDate) : "—"}</span>
                <span className="text-sm font-bold" style={{ color:"#14c7c0" }}>
                  ₹{((emp.salary??0)/1000).toFixed(0)}K/mo
                </span>
              </div>
            </div>
          </div>
        ))}
        {!loading && employees.length === 0 && (
          <div className="col-span-3 text-center py-12" style={{ color:"var(--muted)" }}>No employees found</div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background:"rgba(0,0,0,0.82)" }}
          onClick={e=>{ if(e.target===e.currentTarget) setSelected(null); }}>
          <div className="w-full max-w-md rounded-2xl p-6 animate-in"
            style={{ background:"#142645", border:"1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-black"
                  style={{ background:"linear-gradient(135deg,#0ea5a0,#1b4f8a)", color:"#fff" }}>
                  {selected.name.split(" ").map((n:string)=>n[0]).join("").slice(0,2)}
                </div>
                <div>
                  <div className="font-bold text-white text-lg">{selected.name}</div>
                  <div className="text-sm" style={{ color:"var(--muted)" }}>{selected.designation}</div>
                </div>
              </div>
              <button onClick={()=>setSelected(null)} className="btn-ghost p-1.5 text-xs">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                ["Employee Code", selected.empCode],
                ["Department", selected.department?.name ?? "—"],
                ["Phone", selected.phone ?? "—"],
                ["Email", selected.email ?? "—"],
                ["Salary", `₹${(selected.salary??0).toLocaleString("en-IN")}/mo`],
                ["Joined", selected.joiningDate ? formatDate(selected.joiningDate) : "—"],
              ].map(([k,v])=>(
                <div key={k} className="rounded-lg p-3" style={{ background:"var(--glass)", border:"1px solid var(--border)" }}>
                  <div className="erp-label mb-1" style={{ fontSize:10 }}>{k}</div>
                  <div className="text-sm font-semibold text-white">{v}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              {selected.phone && (
                <a href={`tel:${selected.phone}`} className="btn-ghost flex-1 justify-center">
                  <Phone size={13}/> Call
                </a>
              )}
              {selected.email && (
                <a href={`mailto:${selected.email}`} className="btn-primary flex-1 justify-center">
                  <Mail size={13}/> Email
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
