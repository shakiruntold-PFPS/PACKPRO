"use client";
import { useState } from "react";
import { Play, Download, CheckCircle } from "lucide-react";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const MOCK_PAYROLL = [
  { id: "1", emp: { empCode: "PP-001", name: "Rahul Sharma", department: "Sales" }, basic: 45000, hra: 18000, allowances: 2000, pf: 5400, esi: 0, tds: 1800, gross: 65000, net: 57800, status: "PAID" },
  { id: "2", emp: { empCode: "PP-002", name: "Priya Verma", department: "Accounts" }, basic: 32000, hra: 12800, allowances: 1500, pf: 3840, esi: 240, tds: 0, gross: 46300, net: 42220, status: "PAID" },
  { id: "3", emp: { empCode: "PP-003", name: "Amit Singh", department: "Operations" }, basic: 28000, hra: 11200, allowances: 1000, pf: 3360, esi: 210, tds: 0, gross: 40200, net: 36630, status: "DRAFT" },
  { id: "4", emp: { empCode: "PP-004", name: "Sneha Gupta", department: "Sales" }, basic: 30000, hra: 12000, allowances: 1500, pf: 3600, esi: 225, tds: 0, gross: 43500, net: 39675, status: "DRAFT" },
];

export default function PayrollPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [payroll, setPayroll] = useState(MOCK_PAYROLL);
  const [processing, setProcessing] = useState(false);

  const totalGross = payroll.reduce((s, p) => s + p.gross, 0);
  const totalNet = payroll.reduce((s, p) => s + p.net, 0);
  const totalDeductions = payroll.reduce((s, p) => s + p.pf + p.esi + p.tds, 0);

  function processPayroll() {
    setProcessing(true);
    setTimeout(() => {
      setPayroll(p => p.map(r => ({ ...r, status: "PROCESSED" })));
      setProcessing(false);
    }, 1500);
  }

  function markAsPaid(id: string) {
    setPayroll(p => p.map(r => r.id === id ? { ...r, status: "PAID" } : r));
  }

  return (
    <div className="module-page">
      <div className="module-header">
        <div>
          <h1 className="module-title">Payroll</h1>
          <p className="module-subtitle">{MONTHS[month]} {year} · {payroll.length} employees</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={month} onChange={e => setMonth(Number(e.target.value))}
            className="erp-input" style={{ width: "auto", background: "#0b1e3d" }}>
            {MONTHS.map((m, i) => <option key={m} value={i} style={{ background: "#0b1e3d" }}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))}
            className="erp-input" style={{ width: "auto", background: "#0b1e3d" }}>
            {[2024, 2025, 2026].map(y => <option key={y} value={y} style={{ background: "#0b1e3d" }}>{y}</option>)}
          </select>
          <button className="btn-primary" onClick={processPayroll} disabled={processing}>
            <Play size={13} className={processing ? "animate-spin" : ""} />
            {processing ? "Processing…" : "Process Payroll"}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Gross", value: `₹${(totalGross / 1000).toFixed(1)}K`, color: "#0ea5a0" },
          { label: "Total Deductions", value: `₹${(totalDeductions / 1000).toFixed(1)}K`, color: "#ef4444" },
          { label: "Net Payable", value: `₹${(totalNet / 1000).toFixed(1)}K`, color: "#10b981" },
          { label: "Employees", value: payroll.length, color: "#f59e0b" },
        ].map(s => (
          <div key={s.label} className="kpi-card">
            <div className="text-xs font-semibold uppercase mb-2" style={{ color: "var(--muted)" }}>{s.label}</div>
            <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl overflow-auto">
        <table className="erp-table">
          <thead>
            <tr>
              {["Employee", "Dept", "Basic", "HRA", "Gross", "PF", "ESI", "TDS", "Net Pay", "Status", "Action"].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {payroll.map(p => (
              <tr key={p.id}>
                <td>
                  <div className="font-semibold text-white">{p.emp.name}</div>
                  <div className="text-xs font-mono mt-0.5" style={{ color: "#14c7c0" }}>{p.emp.empCode}</div>
                </td>
                <td style={{ color: "var(--muted)" }}>{p.emp.department}</td>
                <td className="text-white">₹{p.basic.toLocaleString("en-IN")}</td>
                <td style={{ color: "var(--muted)" }}>₹{p.hra.toLocaleString("en-IN")}</td>
                <td className="font-semibold text-white">₹{p.gross.toLocaleString("en-IN")}</td>
                <td style={{ color: "#ef4444" }}>₹{p.pf.toLocaleString("en-IN")}</td>
                <td style={{ color: "#ef4444" }}>₹{p.esi.toLocaleString("en-IN")}</td>
                <td style={{ color: "#ef4444" }}>₹{p.tds.toLocaleString("en-IN")}</td>
                <td className="font-bold" style={{ color: "#10b981" }}>₹{p.net.toLocaleString("en-IN")}</td>
                <td>
                  <span className={`badge ${p.status === "PAID" ? "badge-green" : p.status === "PROCESSED" ? "badge-teal" : "badge-gray"}`}>
                    {p.status}
                  </span>
                </td>
                <td>
                  {p.status !== "PAID" && (
                    <button onClick={() => markAsPaid(p.id)} className="btn-ghost p-1.5 text-xs">
                      <CheckCircle size={12} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end mt-4">
        <button className="btn-ghost">
          <Download size={13} /> Export Payroll Sheet
        </button>
      </div>
    </div>
  );
}
