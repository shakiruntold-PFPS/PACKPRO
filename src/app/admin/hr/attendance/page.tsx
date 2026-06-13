"use client";
import { useState, useCallback, useEffect } from "react";
import { Calendar, CheckCircle, XCircle, Clock, RefreshCw, Save } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { CardSkeleton, TableSkeleton } from "@/components/ui/skeleton";

const STATUS_OPTS = ["PRESENT","ABSENT","HALF_DAY","LEAVE","HOLIDAY"] as const;
type AttStatus = typeof STATUS_OPTS[number];

const STATUS_META: Record<AttStatus, { badge: string; icon: any; label: string; short: string }> = {
  PRESENT:  { badge:"badge-green",  icon:CheckCircle, label:"Present",  short:"P"  },
  ABSENT:   { badge:"badge-red",    icon:XCircle,     label:"Absent",   short:"A"  },
  HALF_DAY: { badge:"badge-amber",  icon:Clock,       label:"Half Day", short:"½"  },
  LEAVE:    { badge:"badge-blue",   icon:Calendar,    label:"Leave",    short:"L"  },
  HOLIDAY:  { badge:"badge-purple", icon:Calendar,    label:"Holiday",  short:"H"  },
};

export default function AttendancePage() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate]         = useState(today);
  const [employees, setEmployees] = useState<any[]>([]);
  const [overrides, setOverrides] = useState<Record<string, AttStatus>>({});
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const { success, error } = useToast();

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    setOverrides({});
    try {
      const res  = await fetch(`/api/attendance?date=${date}`);
      const json = await res.json();
      setEmployees(json.data ?? []);
    } catch {
      error("Failed to load attendance");
    } finally {
      setLoading(false);
    }
  }, [date, error]);

  useEffect(() => { fetchAttendance(); }, [fetchAttendance]);

  function getStatus(emp: any): AttStatus {
    if (overrides[emp.id]) return overrides[emp.id];
    return (emp.attendances?.[0]?.status as AttStatus) ?? "ABSENT";
  }

  function markAll(status: AttStatus) {
    const updates: Record<string, AttStatus> = {};
    employees.forEach(e => { updates[e.id] = status; });
    setOverrides(updates);
  }

  async function saveAttendance() {
    setSaving(true);
    try {
      const records = employees.map(emp => ({
        employeeId: emp.id,
        date,
        status: getStatus(emp),
      }));
      const res = await fetch("/api/attendance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records }),
      });
      if (!res.ok) throw new Error();
      success("Attendance saved", `${records.length} records saved for ${date}`);
      setOverrides({});
      fetchAttendance();
    } catch {
      error("Failed to save attendance");
    } finally {
      setSaving(false);
    }
  }

  const stats = {
    present:  employees.filter(e => getStatus(e) === "PRESENT").length,
    absent:   employees.filter(e => getStatus(e) === "ABSENT").length,
    halfDay:  employees.filter(e => getStatus(e) === "HALF_DAY").length,
    leave:    employees.filter(e => getStatus(e) === "LEAVE").length,
    holiday:  employees.filter(e => getStatus(e) === "HOLIDAY").length,
  };

  const isDirty = Object.keys(overrides).length > 0;

  return (
    <div className="module-page animate-in">
      <div className="module-header">
        <div>
          <h1 className="module-title">Attendance</h1>
          <p className="module-subtitle">
            {employees.length} employees · Present: {stats.present} · Absent: {stats.absent}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="erp-input" style={{ width: "auto" }} />
          <button className="btn-ghost" onClick={fetchAttendance}>
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          {isDirty && (
            <button className="btn-primary" onClick={saveAttendance} disabled={saving}>
              {saving
                ? <span className="inline-flex items-center gap-2"><span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />Saving…</span>
                : <><Save size={13} /> Save</>}
            </button>
          )}
        </div>
      </div>

      {/* KPI row */}
      {loading ? <CardSkeleton count={5} /> : (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {[
            { label: "Present",  value: stats.present,  color: "#10b981" },
            { label: "Absent",   value: stats.absent,   color: "#ef4444" },
            { label: "Half Day", value: stats.halfDay,  color: "#f59e0b" },
            { label: "On Leave", value: stats.leave,    color: "#60a5fa" },
            { label: "Holiday",  value: stats.holiday,  color: "#a78bfa" },
          ].map(s => (
            <div key={s.label} className="kpi-card text-center py-4">
              <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs font-semibold mt-1" style={{ color: "var(--muted)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Quick mark all */}
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        <span className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Mark All:</span>
        {STATUS_OPTS.filter(s => s !== "HOLIDAY").map(s => (
          <button key={s} onClick={() => markAll(s)}
            className="btn-ghost" style={{ padding: "5px 12px", fontSize: "11px" }}>
            {STATUS_META[s].label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? <TableSkeleton rows={6} cols={5} /> : (
        <div className="glass rounded-2xl overflow-auto">
          <table className="erp-table">
            <thead>
              <tr>
                {["Employee", "Code", "Department", "Status", "Mark As"].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 && (
                <tr><td colSpan={5}>
                  <div className="empty-state">
                    <Calendar size={36} />
                    <div className="text-sm font-semibold mt-2">No employees found</div>
                    <div className="text-xs mt-1">Add employees in the HR module first</div>
                  </div>
                </td></tr>
              )}
              {employees.map(emp => {
                const status = getStatus(emp);
                const meta   = STATUS_META[status];
                const changed = !!overrides[emp.id];
                return (
                  <tr key={emp.id} style={changed ? { background: "rgba(14,165,160,0.05)" } : {}}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background: "linear-gradient(135deg,#0ea5a0,#1b4f8a)", color: "#fff" }}>
                          {emp.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                        </div>
                        <span className="font-semibold text-white text-sm">{emp.name}</span>
                      </div>
                    </td>
                    <td><span className="font-mono text-xs" style={{ color: "#14c7c0" }}>{emp.empCode}</span></td>
                    <td style={{ color: "var(--muted)", fontSize: 13 }}>{emp.department?.name ?? "—"}</td>
                    <td><span className={`badge ${meta.badge}`}>{meta.label}</span></td>
                    <td>
                      <div className="flex gap-1">
                        {STATUS_OPTS.filter(s => s !== "HOLIDAY").map(v => (
                          <button key={v}
                            onClick={() => setOverrides(o => ({ ...o, [emp.id]: v }))}
                            className={status === v ? "btn-primary" : "btn-ghost"}
                            style={{ padding: "4px 10px", fontSize: "11px" }}
                            title={STATUS_META[v].label}>
                            {STATUS_META[v].short}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
