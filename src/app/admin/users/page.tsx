"use client";
import React, { useEffect, useState, useCallback } from "react";
import {
  Users, Plus, X, ShieldCheck, Loader2,
  ToggleLeft, ToggleRight, ChevronDown,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type UserRole = "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "SALES" | "ACCOUNTS" | "WAREHOUSE" | "PURCHASE" | "HR" | "CUSTOMER" | "VENDOR";

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  avatar: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_BADGE: Record<string, string> = {
  SUPER_ADMIN: "badge-purple",
  ADMIN:       "badge-purple",
  MANAGER:     "badge-blue",
  SALES:       "badge-blue",
  ACCOUNTS:    "badge-amber",
  WAREHOUSE:   "badge-gray",
  PURCHASE:    "badge-gray",
  HR:          "badge-gray",
  STAFF:       "badge-gray",
  CUSTOMER:    "badge-gray",
  VENDOR:      "badge-gray",
};

const ADDABLE_ROLES: UserRole[] = ["ADMIN", "SALES", "ACCOUNTS", "WAREHOUSE", "PURCHASE", "HR", "MANAGER"];

// ─── Add User Modal ───────────────────────────────────────────────────────────

interface AddUserModalProps {
  onClose: () => void;
  onCreated: (user: UserRecord) => void;
}

function AddUserModal({ onClose, onCreated }: AddUserModalProps) {
  const { success, error } = useToast();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "SALES" as UserRole });
  const [saving, setSaving] = useState(false);

  const set = (k: string) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      error("Validation Error", "Name, email and password are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to create user");
      success("User Created", `${form.name} has been added successfully`);
      onCreated(json.data);
    } catch (e: unknown) {
      error("Error", e instanceof Error ? e.message : "Could not create user");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
      <div className="glass rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} style={{ color: "#0ea5a0" }} />
            <h2 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>Add New User</h2>
          </div>
          <button onClick={onClose} className="btn-ghost p-1" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="erp-label">Full Name *</label>
            <input className="erp-input" placeholder="John Doe" value={form.name}
              onChange={e => set("name")(e.target.value)} required />
          </div>
          <div>
            <label className="erp-label">Email *</label>
            <input className="erp-input" type="email" placeholder="john@company.com" value={form.email}
              onChange={e => set("email")(e.target.value)} required />
          </div>
          <div>
            <label className="erp-label">Password *</label>
            <input className="erp-input" type="password" placeholder="Min 8 characters" value={form.password}
              onChange={e => set("password")(e.target.value)} required minLength={8} />
          </div>
          <div>
            <label className="erp-label">Role *</label>
            <div className="relative">
              <select className="erp-input appearance-none pr-8" value={form.role}
                onChange={e => set("role")(e.target.value)}>
                {ADDABLE_ROLES.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "var(--text-muted)" }} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              {saving ? "Creating…" : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Role Dropdown ────────────────────────────────────────────────────────────

interface RoleDropdownProps {
  userId: string;
  currentRole: UserRole;
  onUpdated: (role: UserRole) => void;
}

function RoleDropdown({ userId, currentRole, onUpdated }: RoleDropdownProps) {
  const { success, error } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function changeRole(role: UserRole) {
    if (role === currentRole) { setOpen(false); return; }
    setSaving(true);
    setOpen(false);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to update role");
      success("Role Updated", `Role changed to ${role}`);
      onUpdated(role);
    } catch (e: unknown) {
      error("Error", e instanceof Error ? e.message : "Could not update role");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(o => !o)}
        disabled={saving}
        className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-all"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
        {saving ? <Loader2 size={11} className="animate-spin" /> : null}
        Edit Role
        <ChevronDown size={11} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-40 rounded-xl overflow-hidden shadow-2xl min-w-[130px]"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            {ADDABLE_ROLES.map(r => (
              <button key={r} onClick={() => changeRole(r)}
                className="w-full text-left text-xs px-3 py-2 transition-colors hover:bg-white/5 flex items-center justify-between gap-2"
                style={{ color: r === currentRole ? "#0ea5a0" : "var(--text-primary)" }}>
                {r}
                {r === currentRole && <span style={{ color: "#0ea5a0" }}>✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const { success, error, warning } = useToast();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = useCallback(async (q = "") => {
    setLoading(true);
    setFetchError("");
    try {
      const url = q ? `/api/users?search=${encodeURIComponent(q)}&limit=50` : "/api/users?limit=50";
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setUsers(json.data?.data ?? json.data ?? []);
    } catch (e: unknown) {
      setFetchError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => load(search), 300);
    return () => clearTimeout(t);
  }, [search, load]);

  async function toggleActive(user: UserRecord) {
    if (togglingId) return;
    const action = user.isActive ? "deactivate" : "activate";
    setTogglingId(user.id);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `Failed to ${action}`);
      setUsers(us => us.map(u => u.id === user.id ? { ...u, isActive: !u.isActive } : u));
      success(user.isActive ? "User Deactivated" : "User Activated",
        `${user.name} has been ${action}d`);
    } catch (e: unknown) {
      error("Error", e instanceof Error ? e.message : `Could not ${action} user`);
    } finally {
      setTogglingId(null);
    }
  }

  function handleCreated(newUser: UserRecord) {
    setUsers(us => [newUser, ...us]);
    setShowAdd(false);
  }

  function handleRoleUpdated(userId: string, role: UserRole) {
    setUsers(us => us.map(u => u.id === userId ? { ...u, role } : u));
  }

  const activeCount = users.filter(u => u.isActive).length;

  return (
    <div className="module-page">
      <div className="module-header">
        <div>
          <h1 className="module-title">User Management</h1>
          <p className="module-subtitle">
            {users.length} users · {activeCount} active
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={14} />
          Add User
        </button>
      </div>

      {/* Search */}
      <div className="mb-5">
        <input
          className="erp-input max-w-sm"
          placeholder="Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Error */}
      {fetchError && (
        <div className="mb-5 rounded-2xl p-4 text-sm"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444" }}>
          {fetchError}
        </div>
      )}

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.02)" }}>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "var(--text-muted)" }}>User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "var(--text-muted)" }}>Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "var(--text-muted)" }}>Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "var(--text-muted)" }}>Last Login</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "var(--text-muted)" }}>Created</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "var(--text-muted)" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                    <Loader2 size={18} className="animate-spin inline mr-2" />Loading users…
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                    <Users size={32} className="mx-auto mb-2 opacity-30" />
                    {search ? "No users match your search" : "No users yet"}
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user.id}
                    style={{ borderBottom: "1px solid var(--border)" }}
                    className="transition-colors hover:bg-white/[0.02]">
                    {/* User */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="avatar avatar-sm flex-shrink-0"
                          style={{ opacity: user.isActive ? 1 : 0.5 }}>
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            (user.name?.[0] ?? "?").toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-xs" style={{ color: user.isActive ? "var(--text-primary)" : "var(--text-muted)" }}>
                            {user.name}
                          </p>
                          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role badge */}
                    <td className="px-4 py-3">
                      <span className={`badge ${ROLE_BADGE[user.role] ?? "badge-gray"} text-[10px]`}>
                        {user.role}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={`badge text-[10px] ${user.isActive ? "badge-teal" : "badge-gray"}`}>
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* Last Login */}
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>
                      {user.lastLogin ? formatDate(user.lastLogin) : "Never"}
                    </td>

                    {/* Created */}
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>
                      {formatDate(user.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <RoleDropdown
                          userId={user.id}
                          currentRole={user.role}
                          onUpdated={role => handleRoleUpdated(user.id, role)}
                        />
                        <button
                          onClick={() => toggleActive(user)}
                          disabled={togglingId === user.id}
                          title={user.isActive ? "Deactivate user" : "Activate user"}
                          className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-all"
                          style={{
                            background: user.isActive ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.08)",
                            border: `1px solid ${user.isActive ? "rgba(239,68,68,0.25)" : "rgba(16,185,129,0.25)"}`,
                            color: user.isActive ? "#ef4444" : "#10b981",
                          }}>
                          {togglingId === user.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : user.isActive ? (
                            <ToggleRight size={12} />
                          ) : (
                            <ToggleLeft size={12} />
                          )}
                          {user.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && (
        <AddUserModal onClose={() => setShowAdd(false)} onCreated={handleCreated} />
      )}
    </div>
  );
}
