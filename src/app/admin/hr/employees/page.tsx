"use client";
import { useState, useCallback, useEffect } from "react";
import { Search, Mail, Phone, RefreshCw, Plus, X, Save, UserSquare } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

const BLANK = {
  empCode: "", name: "", email: "", phone: "", designation: "",
  departmentId: "", joiningDate: "", salary: "",
};

export default function EmployeesPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const { success, error } = useToast();

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

  useEffect(() => {
    fetchEmployees();
    fetch("/api/hr/employees/departments").then(r => r.json()).then(j => {
      if (j.success) setDepartments(j.data ?? []);
    }).catch(() => {});
  }, [fetchEmployees]);

  const activeCount = employees.filter(e => e.isActive).length;
  const totalPayroll = employees.filter(e => e.isActive).reduce((s, e) => s + (e.salary ?? 0), 0);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/hr/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          salary: form.salary ? Number(form.salary) : undefined,
          departmentId: form.departmentId || undefined,
          joiningDate: form.joiningDate || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      success("Employee added", `${form.name} has been added`);
      setShowAdd(false);
      setForm(BLANK);
      fetchEmployees();
    } catch (err_: any) {
      error("Failed to add employee", err_.message);
    } finally {
      setSaving(false);
    }
  }

  function fld(k: keyof typeof BLANK, v: string) {
    setForm(f => ({ ...f, [k]: v }));
  }

  return (
    <div className="module-page">
      <div className="module-header">
        <div>
          <h1 className="module-title">Employees</h1>
          <p className="module-subtitle">
            {activeCount} active · Monthly payroll: ₹{(totalPayroll / 1000).toFixed(0)}K
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={fetchEmployees}>
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button className="btn-primary" onClick={() => setShowAdd(true)}>
            <Plus size={13} /> Add Employee
          </button>
        </div>
      </div>

      <div className="search-bar mb-5 max-w-sm">
        <Search size={13} style={{ color: "var(--text-muted)" }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employees…" />
      </div>

      {loading && <div className="text-center py-8" style={{ color: "var(--text-muted)" }}>Loading…</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.map(emp => (
          <div key={emp.id} onClick={() => setSelected(emp)}
            className="glass rounded-2xl p-5 cursor-pointer hover:bg-white/5 transition-all border border-white/8 hover:border-teal-500/30">
            <div className="flex items-start gap-3 mb-4">
              <div className="avatar avatar-md flex-shrink-0">
                {emp.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate" style={{ color: "var(--text-primary)" }}>{emp.name}</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{emp.designation ?? "—"}</div>
              </div>
              <span className={`badge ${emp.isActive ? "badge-green" : "badge-gray"}`}>
                {emp.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                <span className="font-mono text-xs" style={{ color: "var(--brand-light)" }}>{emp.empCode}</span>
                <span>·</span>
                <span>{emp.department?.name ?? "—"}</span>
              </div>
              {emp.phone && (
                <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                  <Phone size={11} /><span>{emp.phone}</span>
                </div>
              )}
              <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Since {emp.joiningDate ? formatDate(emp.joiningDate) : "—"}
                </span>
                <span className="text-sm font-bold" style={{ color: "var(--brand-light)" }}>
                  ₹{((emp.salary ?? 0) / 1000).toFixed(0)}K/mo
                </span>
              </div>
            </div>
          </div>
        ))}
        {!loading && employees.length === 0 && (
          <div className="col-span-3 empty-state py-16">
            <UserSquare size={40} />
            <div className="text-sm mt-3 font-semibold">No employees found</div>
            <div className="text-xs mt-1">Add your first employee to get started</div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.82)" }}
          onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div className="w-full max-w-md rounded-2xl p-6 animate-in"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="avatar avatar-lg">
                  {selected.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <div className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>{selected.name}</div>
                  <div className="text-sm" style={{ color: "var(--text-muted)" }}>{selected.designation}</div>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="btn-ghost p-1.5"><X size={15} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                ["Employee Code", selected.empCode],
                ["Department", selected.department?.name ?? "—"],
                ["Phone", selected.phone ?? "—"],
                ["Email", selected.email ?? "—"],
                ["Monthly Salary", `₹${(selected.salary ?? 0).toLocaleString("en-IN")}`],
                ["Joined", selected.joiningDate ? formatDate(selected.joiningDate) : "—"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl p-3" style={{ background: "var(--bg-input)", border: "1px solid var(--border)" }}>
                  <div className="erp-label mb-1" style={{ fontSize: 10 }}>{k}</div>
                  <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{v}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              {selected.phone && (
                <a href={`tel:${selected.phone}`} className="btn-ghost flex-1 justify-center">
                  <Phone size={13} /> Call
                </a>
              )}
              {selected.email && (
                <a href={`mailto:${selected.email}`} className="btn-primary flex-1 justify-center">
                  <Mail size={13} /> Email
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)" }}
          onClick={e => { if (e.target === e.currentTarget) setShowAdd(false); }}>
          <div className="w-full max-w-lg rounded-2xl animate-in overflow-hidden"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", maxHeight: "90vh", overflowY: "auto" }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "var(--border)" }}>
              <h2 className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>Add Employee</h2>
              <button onClick={() => setShowAdd(false)} className="btn-ghost p-1.5"><X size={15} /></button>
            </div>
            <form onSubmit={handleAdd} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="erp-label">Employee Code *</label>
                  <input required value={form.empCode} onChange={e => fld("empCode", e.target.value)}
                    className="erp-input" placeholder="EMP-001" />
                </div>
                <div>
                  <label className="erp-label">Full Name *</label>
                  <input required value={form.name} onChange={e => fld("name", e.target.value)}
                    className="erp-input" placeholder="Rahul Kumar" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="erp-label">Designation</label>
                  <input value={form.designation} onChange={e => fld("designation", e.target.value)}
                    className="erp-input" placeholder="Sales Executive" />
                </div>
                <div>
                  <label className="erp-label">Department</label>
                  <select value={form.departmentId} onChange={e => fld("departmentId", e.target.value)}
                    className="erp-input">
                    <option value="">Select department</option>
                    {departments.map((d: any) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="erp-label">Phone</label>
                  <input value={form.phone} onChange={e => fld("phone", e.target.value)}
                    className="erp-input" placeholder="+91 98765 43210" />
                </div>
                <div>
                  <label className="erp-label">Email</label>
                  <input type="email" value={form.email} onChange={e => fld("email", e.target.value)}
                    className="erp-input" placeholder="name@company.com" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="erp-label">Monthly Salary (₹)</label>
                  <input type="number" value={form.salary} onChange={e => fld("salary", e.target.value)}
                    className="erp-input" placeholder="25000" />
                </div>
                <div>
                  <label className="erp-label">Joining Date</label>
                  <input type="date" value={form.joiningDate} onChange={e => fld("joiningDate", e.target.value)}
                    className="erp-input" />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="btn-ghost flex-1 justify-center">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? <><span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> Saving…</> : <><Save size={13} /> Add Employee</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
