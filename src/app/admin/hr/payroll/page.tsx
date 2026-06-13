"use client";
import { useState, useCallback, useEffect } from "react";
import { Play, Download, RefreshCw, CheckCircle, DollarSign } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { TableSkeleton, CardSkeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const STATUS_STYLE: Record<string,string> = {
  DRAFT:"badge-gray", PROCESSED:"badge-blue", PAID:"badge-green", CANCELLED:"badge-red"
};

export default function PayrollPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear]   = useState(now.getFullYear());
  const [payroll, setPayroll]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(false);
  const [processing, setProcessing] = useState(false);
  const { success, error, info } = useToast();

  const fetchPayroll = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/hr/payroll?month=${month+1}&year=${year}&limit=100`);
      const json = await res.json();
      setPayroll(json.data?.data ?? []);
    } catch { error("Failed to load payroll"); }
    finally { setLoading(false); }
  }, [month, year, error]);

  useEffect(() => { fetchPayroll(); }, [fetchPayroll]);

  async function runPayroll() {
    setProcessing(true);
    try {
      const res  = await fetch("/api/hr/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: month + 1, year }),
      });
      const json = await res.json();
      if (!res.ok) { error(json.error || "Failed to run payroll"); return; }
      success("Payroll processed", `${json.data?.created ?? 0} records generated`);
      fetchPayroll();
    } catch { error("Failed to process payroll"); }
    finally { setProcessing(false); }
  }

  async function markPaid(id: string) {
    const res  = await fetch("/api/hr/payroll", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "PAID", paidOn: new Date().toISOString() }),
    });
    if (res.ok) {
      setPayroll(p => p.map(r => r.id === id ? { ...r, status: "PAID" } : r));
      success("Marked as paid");
    } else { error("Failed to update"); }
  }

  const totalGross     = payroll.reduce((s, p) => s + (p.grossSalary ?? 0), 0);
  const totalNet       = payroll.reduce((s, p) => s + (p.netSalary ?? 0), 0);
  const totalDeductions= payroll.reduce((s, p) => s + (p.totalDeductions ?? 0), 0);
  const paidCount      = payroll.filter(p => p.status === "PAID").length;

  return (
    <div className="module-page animate-in">
      <div className="module-header">
        <div>
          <h1 className="module-title">Payroll</h1>
          <p className="module-subtitle">{MONTHS[month]} {year} · {payroll.length} employees · Paid: {paidCount}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select value={month} onChange={e => setMonth(Number(e.target.value))} className="erp-input" style={{ width:"auto" }}>
            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))} className="erp-input" style={{ width:"auto" }}>
            {[2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="btn-ghost" onClick={fetchPayroll}>
            <RefreshCw size={13} className={loading?"animate-spin":""}/>
          </button>
          <button className="btn-primary" onClick={runPayroll} disabled={processing}>
            {processing
              ? <span className="inline-flex items-center gap-2"><span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"/>Processing…</span>
              : <><Play size={13}/> Run Payroll</>}
          </button>
        </div>
      </div>

      {/* Summary cards */}
      {loading ? <CardSkeleton count={4}/> : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label:"Gross Payroll",   value:formatCurrency(totalGross),      color:"#14c7c0" },
            { label:"Total Deductions",value:formatCurrency(totalDeductions),  color:"#ef4444" },
            { label:"Net Payroll",     value:formatCurrency(totalNet),         color:"#10b981" },
            { label:"Employees Paid",  value:`${paidCount} / ${payroll.length}`, color:"#f59e0b" },
          ].map(s=>(
            <div key={s.label} className="kpi-card">
              <div className="text-xs font-semibold uppercase mb-2" style={{color:"var(--muted)"}}>{s.label}</div>
              <div className="text-xl font-black" style={{color:s.color}}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {loading ? <TableSkeleton rows={5} cols={8}/> : (
        <div className="glass rounded-2xl overflow-auto">
          <table className="erp-table">
            <thead>
              <tr>{["Employee","Code","Basic","HRA","Allowances","Deductions","Net","Status","Action"].map(h=><th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {payroll.length === 0 && (
                <tr><td colSpan={9}>
                  <div className="empty-state">
                    <DollarSign size={36}/>
                    <div className="text-sm font-semibold mt-2">No payroll records for this month</div>
                    <div className="text-xs mt-1">Click "Run Payroll" to generate from employees</div>
                  </div>
                </td></tr>
              )}
              {payroll.map((p:any) => (
                <tr key={p.id}>
                  <td className="font-semibold text-white">{p.employee?.name ?? "—"}</td>
                  <td><span className="font-mono text-xs" style={{color:"#14c7c0"}}>{p.employee?.empCode ?? "—"}</span></td>
                  <td style={{color:"var(--muted)",fontSize:13}}>{formatCurrency(p.basicSalary??0)}</td>
                  <td style={{color:"var(--muted)",fontSize:13}}>{formatCurrency(p.hra??0)}</td>
                  <td style={{color:"var(--muted)",fontSize:13}}>{formatCurrency(p.allowances??0)}</td>
                  <td style={{color:"#ef4444",fontSize:13}}>{formatCurrency(p.totalDeductions??0)}</td>
                  <td className="font-bold text-white">{formatCurrency(p.netSalary??0)}</td>
                  <td><span className={`badge ${STATUS_STYLE[p.status]??""}`}>{p.status}</span></td>
                  <td>
                    {p.status !== "PAID" && (
                      <button onClick={()=>markPaid(p.id)} className="btn-ghost" style={{padding:"4px 10px",fontSize:"11px"}}>
                        <CheckCircle size={11}/> Mark Paid
                      </button>
                    )}
                    {p.status === "PAID" && (
                      <span className="text-xs" style={{color:"var(--muted)"}}>
                        {p.paidOn ? formatDate(p.paidOn) : "Paid"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
