"use client";
import React, { useEffect, useState, useCallback } from "react";
import {
  Zap, Plus, X, Play, Pause, Trash2, Edit2,
  Loader2, ChevronDown, CheckCircle, Clock,
  AlertCircle, Settings,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";

// ─── Types ────────────────────────────────────────────────────────────────────

type TriggerType =
  | "LEAD_CREATED"
  | "QUOTE_SENT"
  | "INVOICE_OVERDUE"
  | "LOW_STOCK"
  | "ORDER_CONFIRMED"
  | "PAYMENT_RECEIVED"
  | "FOLLOW_UP_DUE";

type ActionType =
  | "SEND_NOTIFICATION"
  | "CREATE_TASK"
  | "SEND_EMAIL"
  | "UPDATE_STATUS";

interface ActionItem {
  type: ActionType;
  params: Record<string, any>;
}

interface AutomationRule {
  id: string;
  name: string;
  description: string | null;
  trigger: TriggerType;
  conditions: any;
  actions: ActionItem[];
  isActive: boolean;
  lastRunAt: string | null;
  runCount: number;
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TRIGGER_LABELS: Record<TriggerType, string> = {
  LEAD_CREATED:    "Lead Created",
  QUOTE_SENT:      "Quote Sent",
  INVOICE_OVERDUE: "Invoice Overdue",
  LOW_STOCK:       "Low Stock",
  ORDER_CONFIRMED: "Order Confirmed",
  PAYMENT_RECEIVED:"Payment Received",
  FOLLOW_UP_DUE:   "Follow-up Due",
};

const ACTION_LABELS: Record<ActionType, string> = {
  SEND_NOTIFICATION: "Send Notification",
  CREATE_TASK:       "Create Task",
  SEND_EMAIL:        "Send Email",
  UPDATE_STATUS:     "Update Status",
};

const TRIGGERS: TriggerType[] = [
  "LEAD_CREATED","QUOTE_SENT","INVOICE_OVERDUE","LOW_STOCK",
  "ORDER_CONFIRMED","PAYMENT_RECEIVED","FOLLOW_UP_DUE",
];

const ACTION_TYPES: ActionType[] = [
  "SEND_NOTIFICATION","CREATE_TASK","SEND_EMAIL","UPDATE_STATUS",
];

// ─── Action Params Editor ──────────────────────────────────────────────────

interface ActionParamsEditorProps {
  action: ActionItem;
  onChange: (updated: ActionItem) => void;
}

function ActionParamsEditor({ action, onChange }: ActionParamsEditorProps) {
  const set = (key: string, value: any) =>
    onChange({ ...action, params: { ...action.params, [key]: value } });

  const inputStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    padding: "6px 10px",
    color: "var(--text-primary)",
    fontSize: 13,
    width: "100%",
    outline: "none",
  };

  switch (action.type) {
    case "SEND_NOTIFICATION":
      return (
        <div className="space-y-2 mt-2">
          <input style={inputStyle} placeholder="Notification title"
            value={action.params.title ?? ""} onChange={e => set("title", e.target.value)} />
          <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 60 }}
            placeholder="Notification message"
            value={action.params.message ?? ""} onChange={e => set("message", e.target.value)} />
          <input style={inputStyle} placeholder="Link (optional, e.g. /admin/leads)"
            value={action.params.link ?? ""} onChange={e => set("link", e.target.value)} />
        </div>
      );
    case "CREATE_TASK":
      return (
        <div className="space-y-2 mt-2">
          <input style={inputStyle} placeholder="Task title"
            value={action.params.title ?? ""} onChange={e => set("title", e.target.value)} />
          <input style={inputStyle} type="number" placeholder="Due in days (e.g. 3)"
            value={action.params.dueInDays ?? ""} onChange={e => set("dueInDays", Number(e.target.value))} />
        </div>
      );
    case "SEND_EMAIL":
      return (
        <div className="space-y-2 mt-2">
          <input style={inputStyle} placeholder="Email subject"
            value={action.params.subject ?? ""} onChange={e => set("subject", e.target.value)} />
          <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 80 }}
            placeholder="Email body (HTML allowed)"
            value={action.params.body ?? ""} onChange={e => set("body", e.target.value)} />
        </div>
      );
    case "UPDATE_STATUS":
      return (
        <div className="mt-2">
          <input style={inputStyle} placeholder="New status (e.g. QUALIFIED, SENT, PAID)"
            value={action.params.status ?? ""} onChange={e => set("status", e.target.value)} />
        </div>
      );
    default:
      return null;
  }
}

// ─── Rule Modal ───────────────────────────────────────────────────────────────

interface RuleModalProps {
  initial?: AutomationRule | null;
  onClose: () => void;
  onSaved: (rule: AutomationRule) => void;
}

const blankAction = (): ActionItem => ({ type: "SEND_NOTIFICATION", params: {} });

function RuleModal({ initial, onClose, onSaved }: RuleModalProps) {
  const { success, error } = useToast();
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [trigger, setTrigger] = useState<TriggerType>(initial?.trigger ?? "LEAD_CREATED");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [actions, setActions] = useState<ActionItem[]>(
    initial?.actions?.length ? initial.actions : [blankAction()]
  );
  const [saving, setSaving] = useState(false);

  const isEdit = !!initial;

  function updateAction(i: number, updated: ActionItem) {
    setActions(prev => prev.map((a, idx) => idx === i ? updated : a));
  }

  function addAction() {
    setActions(prev => [...prev, blankAction()]);
  }

  function removeAction(i: number) {
    setActions(prev => prev.filter((_, idx) => idx !== i));
  }

  function changeActionType(i: number, type: ActionType) {
    setActions(prev => prev.map((a, idx) => idx === i ? { type, params: {} } : a));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { error("Validation", "Name is required"); return; }
    if (actions.length === 0) { error("Validation", "Add at least one action"); return; }
    setSaving(true);
    try {
      const url = isEdit ? `/api/automation/${initial!.id}` : "/api/automation";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, trigger, isActive, actions }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to save rule");
      success(isEdit ? "Rule Updated" : "Rule Created", name);
      onSaved(json.data);
    } catch (e: unknown) {
      error("Error", e instanceof Error ? e.message : "Could not save rule");
    } finally {
      setSaving(false);
    }
  }

  const selectStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    padding: "8px 10px",
    color: "var(--text-primary)",
    fontSize: 13,
    width: "100%",
    outline: "none",
    appearance: "none" as any,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
      <div className="glass rounded-2xl p-6 w-full max-w-lg shadow-2xl my-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Zap size={18} style={{ color: "#0ea5a0" }} />
            <h2 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>
              {isEdit ? "Edit Rule" : "New Automation Rule"}
            </h2>
          </div>
          <button onClick={onClose} className="btn-ghost p-1" aria-label="Close"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="erp-label">Name *</label>
            <input className="erp-input" placeholder="e.g. Welcome notification on new lead"
              value={name} onChange={e => setName(e.target.value)} required />
          </div>

          {/* Description */}
          <div>
            <label className="erp-label">Description</label>
            <textarea className="erp-input" style={{ resize: "vertical", minHeight: 56 }}
              placeholder="What does this rule do? (optional)"
              value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          {/* Trigger */}
          <div>
            <label className="erp-label">Trigger *</label>
            <div className="relative">
              <select style={selectStyle} value={trigger}
                onChange={e => setTrigger(e.target.value as TriggerType)}>
                {TRIGGERS.map(t => (
                  <option key={t} value={t}>{TRIGGER_LABELS[t]}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "var(--text-muted)" }} />
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setIsActive(v => !v)}
              style={{ color: isActive ? "#0ea5a0" : "var(--text-muted)" }}>
              {isActive ? <CheckCircle size={20} /> : <Pause size={20} />}
            </button>
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {isActive ? "Active — will run automatically" : "Inactive — disabled"}
            </span>
          </div>

          {/* Actions */}
          <div>
            <label className="erp-label">Actions</label>
            <div className="space-y-3">
              {actions.map((action, i) => (
                <div key={i} className="rounded-xl p-3"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <select style={{ ...selectStyle, width: "100%" }}
                        value={action.type}
                        onChange={e => changeActionType(i, e.target.value as ActionType)}>
                        {ACTION_TYPES.map(t => (
                          <option key={t} value={t}>{ACTION_LABELS[t]}</option>
                        ))}
                      </select>
                      <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: "var(--text-muted)" }} />
                    </div>
                    {actions.length > 1 && (
                      <button type="button" onClick={() => removeAction(i)}
                        className="btn-ghost p-1 shrink-0" title="Remove action">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <ActionParamsEditor action={action} onChange={updated => updateAction(i, updated)} />
                </div>
              ))}
            </div>
            <button type="button" onClick={addAction}
              className="btn-ghost mt-2 text-sm flex items-center gap-1">
              <Plus size={13} /> Add Action
            </button>
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving
                ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
                : <><Zap size={14} /> {isEdit ? "Update Rule" : "Create Rule"}</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AutomationPage() {
  const { success, error } = useToast();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/automation");
      const json = await res.json();
      if (json.success) setRules(json.data ?? []);
    } catch {
      error("Error", "Could not load automation rules");
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  async function runNow(rule: AutomationRule) {
    setRunningId(rule.id);
    try {
      const res = await fetch(`/api/automation/${rule.id}/run`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to run rule");
      success("Rule Executed", `"${rule.name}" ran — ${json.data?.actionsExecuted ?? 0} action(s) executed`);
      fetchRules();
    } catch (e: unknown) {
      error("Run Failed", e instanceof Error ? e.message : "Could not run rule");
    } finally {
      setRunningId(null);
    }
  }

  async function deleteRule(rule: AutomationRule) {
    if (!confirm(`Delete rule "${rule.name}"? This cannot be undone.`)) return;
    setDeletingId(rule.id);
    try {
      const res = await fetch(`/api/automation/${rule.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to delete rule");
      success("Deleted", `"${rule.name}" removed`);
      setRules(prev => prev.filter(r => r.id !== rule.id));
    } catch (e: unknown) {
      error("Error", e instanceof Error ? e.message : "Could not delete rule");
    } finally {
      setDeletingId(null);
    }
  }

  function handleSaved(rule: AutomationRule) {
    setRules(prev => {
      const idx = prev.findIndex(r => r.id === rule.id);
      if (idx >= 0) return prev.map(r => r.id === rule.id ? rule : r);
      return [rule, ...prev];
    });
    setShowModal(false);
    setEditingRule(null);
  }

  // KPI derived values
  const totalRules   = rules.length;
  const activeRules  = rules.filter(r => r.isActive).length;
  const totalRuns    = rules.reduce((s, r) => s + r.runCount, 0);
  const lastRunAt    = rules
    .filter(r => r.lastRunAt)
    .sort((a, b) => new Date(b.lastRunAt!).getTime() - new Date(a.lastRunAt!).getTime())[0]?.lastRunAt ?? null;

  function formatLastRun(dt: string | null) {
    if (!dt) return "Never";
    const d = new Date(dt);
    return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  }

  function triggerBadgeColor(trigger: TriggerType) {
    const map: Record<TriggerType, string> = {
      LEAD_CREATED:    "#0ea5a0",
      QUOTE_SENT:      "#6366f1",
      INVOICE_OVERDUE: "#ef4444",
      LOW_STOCK:       "#f59e0b",
      ORDER_CONFIRMED: "#10b981",
      PAYMENT_RECEIVED:"#22c55e",
      FOLLOW_UP_DUE:   "#8b5cf6",
    };
    return map[trigger] ?? "#64748b";
  }

  const SAMPLE_RULES: Partial<AutomationRule>[] = [
    {
      name: "Welcome notification on new lead",
      trigger: "LEAD_CREATED",
      actions: [{ type: "SEND_NOTIFICATION", params: { title: "New Lead Assigned", message: "A new lead has been created and assigned to you." } }],
      isActive: true,
    },
    {
      name: "Create follow-up task when quote is sent",
      trigger: "QUOTE_SENT",
      actions: [{ type: "CREATE_TASK", params: { title: "Follow up on sent quote", dueInDays: 3 } }],
      isActive: true,
    },
    {
      name: "Alert team when stock is low",
      trigger: "LOW_STOCK",
      actions: [{ type: "SEND_NOTIFICATION", params: { title: "Low Stock Alert", message: "A product has dropped below reorder level." } }],
      isActive: true,
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap size={22} style={{ color: "#0ea5a0" }} />
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              Automation Engine
            </h1>
          </div>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Configure workflow rules that run automatically when business events occur
          </p>
        </div>
        <button className="btn-primary flex items-center gap-2"
          onClick={() => { setEditingRule(null); setShowModal(true); }}>
          <Plus size={15} /> New Rule
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Rules",   value: totalRules,  icon: <Settings size={18} />,     color: "#6366f1" },
          { label: "Active Rules",  value: activeRules, icon: <CheckCircle size={18} />,  color: "#0ea5a0" },
          { label: "Total Runs",    value: totalRuns,   icon: <Zap size={18} />,           color: "#f59e0b" },
          { label: "Last Run",      value: formatLastRun(lastRunAt), icon: <Clock size={18} />, color: "#8b5cf6" },
        ].map(kpi => (
          <div key={kpi.label} className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2" style={{ color: kpi.color }}>
              {kpi.icon}
              <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{kpi.label}</span>
            </div>
            <div className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Rules Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
          <h2 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
            Automation Rules
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin" style={{ color: "var(--text-muted)" }} />
          </div>
        ) : rules.length === 0 ? (
          <div className="p-8 text-center">
            <Zap size={40} className="mx-auto mb-3 opacity-30" style={{ color: "var(--text-muted)" }} />
            <p className="font-medium mb-1" style={{ color: "var(--text-secondary)" }}>No automation rules yet</p>
            <p className="text-xs mb-5" style={{ color: "var(--text-muted)" }}>
              Create rules to automate repetitive tasks. Here are some examples to get started:
            </p>
            <div className="grid md:grid-cols-3 gap-3 max-w-2xl mx-auto text-left mb-4">
              {SAMPLE_RULES.map((r, i) => (
                <div key={i} className="rounded-xl p-3"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
                  <div className="text-xs font-medium mb-1" style={{ color: "var(--text-primary)" }}>{r.name}</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Trigger: {TRIGGER_LABELS[r.trigger as TriggerType]}
                  </div>
                </div>
              ))}
            </div>
            <button className="btn-primary mx-auto flex items-center gap-2"
              onClick={() => { setEditingRule(null); setShowModal(true); }}>
              <Plus size={14} /> Create First Rule
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="erp-table w-full">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Trigger</th>
                  <th>Actions</th>
                  <th>Status</th>
                  <th>Runs</th>
                  <th>Last Run</th>
                  <th>Operations</th>
                </tr>
              </thead>
              <tbody>
                {rules.map(rule => (
                  <tr key={rule.id}>
                    <td>
                      <div className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>
                        {rule.name}
                      </div>
                      {rule.description && (
                        <div className="text-xs mt-0.5 truncate max-w-xs" style={{ color: "var(--text-muted)" }}>
                          {rule.description}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="text-xs font-medium px-2 py-1 rounded-full"
                        style={{
                          background: triggerBadgeColor(rule.trigger) + "22",
                          color: triggerBadgeColor(rule.trigger),
                        }}>
                        {TRIGGER_LABELS[rule.trigger] ?? rule.trigger}
                      </span>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {rule.actions.map((a, i) => (
                          <span key={i} className="text-xs px-1.5 py-0.5 rounded"
                            style={{ background: "rgba(255,255,255,0.07)", color: "var(--text-muted)" }}>
                            {ACTION_LABELS[a.type] ?? a.type}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      {rule.isActive ? (
                        <span className="badge badge-green flex items-center gap-1 w-fit">
                          <CheckCircle size={11} /> Active
                        </span>
                      ) : (
                        <span className="badge badge-gray flex items-center gap-1 w-fit">
                          <Pause size={11} /> Inactive
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                        {rule.runCount.toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {formatLastRun(rule.lastRunAt)}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        {/* Run Now */}
                        <button
                          className="btn-ghost p-1.5 rounded-lg"
                          title="Run Now"
                          disabled={runningId === rule.id}
                          onClick={() => runNow(rule)}>
                          {runningId === rule.id
                            ? <Loader2 size={13} className="animate-spin" />
                            : <Play size={13} style={{ color: "#0ea5a0" }} />
                          }
                        </button>
                        {/* Edit */}
                        <button
                          className="btn-ghost p-1.5 rounded-lg"
                          title="Edit"
                          onClick={() => { setEditingRule(rule); setShowModal(true); }}>
                          <Edit2 size={13} style={{ color: "var(--text-muted)" }} />
                        </button>
                        {/* Delete */}
                        <button
                          className="btn-ghost p-1.5 rounded-lg"
                          title="Delete"
                          disabled={deletingId === rule.id}
                          onClick={() => deleteRule(rule)}>
                          {deletingId === rule.id
                            ? <Loader2 size={13} className="animate-spin" />
                            : <Trash2 size={13} style={{ color: "#ef4444" }} />
                          }
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info banner */}
      <div className="rounded-xl p-4 flex items-start gap-3"
        style={{ background: "rgba(14,165,160,0.07)", border: "1px solid rgba(14,165,160,0.2)" }}>
        <AlertCircle size={16} style={{ color: "#0ea5a0", flexShrink: 0, marginTop: 2 }} />
        <div>
          <p className="text-xs font-medium" style={{ color: "#0ea5a0" }}>About Automation Rules</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Rules run automatically when the triggering event occurs in the system. Use
            "Run Now" to test a rule with sample data before it runs in production.
            All actions are non-blocking — a failure in one action does not affect others.
          </p>
        </div>
      </div>

      {/* Modals */}
      {showModal && (
        <RuleModal
          initial={editingRule}
          onClose={() => { setShowModal(false); setEditingRule(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
