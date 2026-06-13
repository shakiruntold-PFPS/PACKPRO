"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle, CheckCircle, Clock, TrendingUp, TrendingDown,
  Users, Package, FileText, Receipt, Truck, DollarSign,
  ShoppingCart, Bell, Zap, ChevronRight, RefreshCw, Phone,
  Star, Activity, Target, BarChart2, Circle,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Insight {
  type: "URGENT" | "WARNING" | "OPPORTUNITY" | "INFO";
  category: string;
  title: string;
  message: string;
  action: string;
  link: string;
  value?: number;
}

interface DashboardData {
  kpis: {
    todayRevenue: number; monthRevenue: number; yearRevenue: number;
    outstandingReceivables: number; openQuotes: number; pendingOrders: number;
    lowStockCount: number; totalLeads: number; followUpsToday: number;
    overdueInvoiceCount: number; overdueAmount: number; openTasks: number;
  };
  monthlyTrend: { month: string; revenue: number; invoices: number }[];
  upcomingFollowUps: { id: string; title: string; contactName: string; followUpDate: string; priority: string }[];
  pendingApprovals: { id: string; number: string; party: { name: string }; total: number; createdAt: string }[];
  recentOrders: { id: string; number: string; party: { name: string }; total: number; status: string }[];
  customerRisks: { partyId: string; partyName: string; overdueCount: number; totalOverdue: number }[];
  teamPerformance: { userId: string; name: string; quotesCount: number }[];
  revenueTarget: { projected: number; actual: number; daysElapsed: number; daysInMonth: number };
  dispatchStatus: Record<string, number>;
}

interface InsightsData {
  insights: Insight[];
  forecast: { thisMonthProjected: number; lastMonthActual: number; growthRate: number };
  quickStats: { totalLeadValue: number; conversionRate: number; avgDealSize: number };
  recommendations: string[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n: number) => `₹${(n ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const fmtFull = (n: number) => `₹${(n ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const daysAgo = (d: string) => Math.floor((Date.now() - new Date(d).getTime()) / 86400000);

function InsightBadge({ type }: { type: Insight["type"] }) {
  const map = { URGENT: "bg-red-500", WARNING: "bg-amber-500", OPPORTUNITY: "bg-emerald-500", INFO: "bg-blue-500" };
  return <span className={`inline-block w-2 h-2 rounded-full ${map[type]}`} />;
}

function KPICard({ icon: Icon, label, value, sub, color, link, urgent }: {
  icon: any; label: string; value: string; sub?: string; color: string; link?: string; urgent?: boolean;
}) {
  const router = useRouter();
  return (
    <div
      onClick={() => link && router.push(link)}
      className="glass rounded-2xl p-5 flex flex-col gap-2 cursor-pointer transition-all hover:scale-[1.01]"
      style={{ borderLeft: `3px solid ${urgent ? "#ef4444" : color}` }}
    >
      <div className="flex items-center justify-between">
        <Icon size={18} style={{ color: urgent ? "#ef4444" : color }} />
        {urgent && <span className="text-[10px] font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">URGENT</span>}
      </div>
      <div className="text-2xl font-black" style={{ color: urgent ? "#ef4444" : "var(--text-primary)" }}>{value}</div>
      <div className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>{label}</div>
      {sub && <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>{sub}</div>}
    </div>
  );
}

function InsightCard({ insight }: { insight: Insight }) {
  const router = useRouter();
  const colors = {
    URGENT: { border: "#ef4444", bg: "rgba(239,68,68,0.08)", badge: "#ef4444" },
    WARNING: { border: "#f59e0b", bg: "rgba(245,158,11,0.08)", badge: "#f59e0b" },
    OPPORTUNITY: { border: "#22c55e", bg: "rgba(34,197,94,0.08)", badge: "#22c55e" },
    INFO: { border: "#3b82f6", bg: "rgba(59,130,246,0.08)", badge: "#3b82f6" },
  };
  const c = colors[insight.type];
  return (
    <div className="rounded-xl p-4 flex gap-3" style={{ background: c.bg, borderLeft: `3px solid ${c.border}` }}>
      <InsightBadge type={insight.type} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{insight.title}</div>
        <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{insight.message}</div>
        <button onClick={() => router.push(insight.link)}
          className="mt-2 text-xs font-semibold flex items-center gap-1"
          style={{ color: c.badge }}>
          {insight.action} <ChevronRight size={11} />
        </button>
      </div>
    </div>
  );
}

// SVG Revenue Bar Chart
function RevenueChart({ data }: { data: { month: string; revenue: number }[] }) {
  const max = Math.max(...data.map(d => d.revenue), 1);
  return (
    <div className="flex items-end gap-2 h-32 w-full">
      {data.map((d, i) => {
        const pct = (d.revenue / max) * 100;
        const isLast = i === data.length - 1;
        return (
          <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
            <div className="text-[9px] font-mono" style={{ color: "var(--text-muted)" }}>
              {d.revenue > 0 ? (d.revenue >= 100000 ? `${(d.revenue/100000).toFixed(1)}L` : `${(d.revenue/1000).toFixed(0)}k`) : "—"}
            </div>
            <div className="w-full rounded-t-md transition-all"
              style={{
                height: `${Math.max(pct, 4)}%`,
                background: isLast
                  ? "linear-gradient(180deg,var(--brand),var(--brand-light))"
                  : "rgba(14,165,160,0.3)",
                minHeight: 4,
              }}
            />
            <div className="text-[9px]" style={{ color: "var(--text-muted)" }}>{d.month}</div>
          </div>
        );
      })}
    </div>
  );
}

function PriorityBadge({ p }: { p: string }) {
  const m: Record<string, string> = { URGENT: "badge-red", HIGH: "badge-amber", MEDIUM: "badge-blue", LOW: "badge-gray" };
  return <span className={`badge ${m[p] ?? "badge-gray"}`}>{p}</span>;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CommandCenter() {
  const router = useRouter();
  const { success, error } = useToast();
  const [dash, setDash] = useState<DashboardData | null>(null);
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAllInsights, setShowAllInsights] = useState(false);
  const [actioning, setActioning] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, i] = await Promise.all([
        fetch("/api/dashboard").then(r => r.json()),
        fetch("/api/ai/insights").then(r => r.json()),
      ]);
      if (d.data) setDash(d.data);
      if (i.data) setInsights(i.data);
    } catch {
      error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function approveQuote(id: string) {
    setActioning(id);
    try {
      const res = await fetch(`/api/quotes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPROVED" }),
      });
      if (!res.ok) throw new Error();
      success("Quote approved");
      load();
    } catch { error("Failed to approve quote"); }
    finally { setActioning(null); }
  }

  async function processOrder(id: string) {
    setActioning(id);
    try {
      const res = await fetch(`/api/sales-orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PROCESSING" }),
      });
      if (!res.ok) throw new Error();
      success("Order moved to processing");
      load();
    } catch { error("Failed to update order"); }
    finally { setActioning(null); }
  }

  const urgentInsights = insights?.insights.filter(i => i.type === "URGENT") ?? [];
  const kpis = dash?.kpis;

  if (loading) {
    return (
      <div className="module-page">
        <div className="module-header">
          <div><h1 className="module-title">Command Center</h1></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-5 h-28 animate-pulse" style={{ background: "var(--bg-elevated)" }} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-5 h-64 animate-pulse" style={{ background: "var(--bg-elevated)" }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="module-page">
      {/* Header */}
      <div className="module-header">
        <div>
          <h1 className="module-title">Command Center</h1>
          <p className="module-subtitle" style={{ color: "var(--text-muted)", fontSize: 13 }}>
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <button onClick={load} className="btn-ghost flex items-center gap-2">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Urgent Alert Banner */}
      {urgentInsights.length > 0 && (
        <div className="mb-5 rounded-xl p-4 flex items-center justify-between"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
          <div className="flex items-center gap-3">
            <AlertTriangle size={16} style={{ color: "#ef4444" }} />
            <span className="text-sm font-bold" style={{ color: "#ef4444" }}>
              {urgentInsights.length} item{urgentInsights.length > 1 ? "s" : ""} need immediate attention
            </span>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {urgentInsights.map(i => i.title).join(" · ")}
            </span>
          </div>
          <button onClick={() => setShowAllInsights(true)} className="btn-ghost text-xs">View All</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <KPICard icon={TrendingUp} label="Today's Revenue" value={fmt(kpis?.todayRevenue ?? 0)} color="#22c55e" link="/admin/invoices" />
        <KPICard icon={BarChart2} label="Month Revenue" value={fmt(kpis?.monthRevenue ?? 0)} color="var(--brand)" link="/admin/invoices" />
        <KPICard icon={Receipt} label="Pending Payments" value={fmt(kpis?.outstandingReceivables ?? 0)} color="#ef4444" urgent={(kpis?.outstandingReceivables ?? 0) > 100000} link="/admin/invoices" />
        <KPICard icon={FileText} label="Open Quotes" value={String(kpis?.openQuotes ?? 0)} color="#f59e0b" link="/admin/quotes" />
        <KPICard icon={Package} label="Low Stock" value={String(kpis?.lowStockCount ?? 0)} color="#ef4444" urgent={(kpis?.lowStockCount ?? 0) > 0} link="/admin/inventory" />
        <KPICard icon={ShoppingCart} label="Pending Orders" value={String(kpis?.pendingOrders ?? 0)} color="#3b82f6" link="/admin/sales-orders" />
      </div>

      {/* Recommendations from AI */}
      {insights?.recommendations && insights.recommendations.length > 0 && (
        <div className="glass rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={14} style={{ color: "var(--brand)" }} />
            <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Today&apos;s Recommended Actions</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {insights.recommendations.map((rec, i) => (
              <span key={i} className="text-xs px-3 py-1.5 rounded-full font-medium"
                style={{ background: "rgba(14,165,160,0.1)", border: "1px solid rgba(14,165,160,0.2)", color: "var(--brand)" }}>
                {i + 1}. {rec}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Main Action Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">

        {/* Today's Follow-ups */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock size={14} style={{ color: "#f59e0b" }} />
              <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Follow-ups Today</span>
            </div>
            <span className="badge badge-amber">{dash?.upcomingFollowUps?.length ?? 0}</span>
          </div>
          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
            {(!dash?.upcomingFollowUps || dash.upcomingFollowUps.length === 0) && (
              <div className="py-6 text-center">
                <CheckCircle size={24} style={{ color: "var(--brand)", margin: "0 auto 8px" }} />
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>No follow-ups due today</p>
              </div>
            )}
            {dash?.upcomingFollowUps?.map(f => (
              <div key={f.id} className="flex items-center justify-between p-2 rounded-lg"
                style={{ background: "var(--bg-elevated)" }}>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>{f.title}</div>
                  <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>{f.contactName}</div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                  <PriorityBadge p={f.priority} />
                  <button onClick={() => router.push(`/admin/crm`)}
                    className="btn-ghost p-1" title="View lead">
                    <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => router.push("/admin/crm")} className="mt-3 w-full text-xs text-center font-semibold"
            style={{ color: "var(--brand)" }}>
            View all CRM →
          </button>
        </div>

        {/* Pending Approvals */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText size={14} style={{ color: "var(--brand)" }} />
              <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Pending Approvals</span>
            </div>
            <span className="badge badge-blue">{dash?.pendingApprovals?.length ?? 0}</span>
          </div>
          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
            {(!dash?.pendingApprovals || dash.pendingApprovals.length === 0) && (
              <div className="py-6 text-center">
                <CheckCircle size={24} style={{ color: "var(--brand)", margin: "0 auto 8px" }} />
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>No quotes pending approval</p>
              </div>
            )}
            {dash?.pendingApprovals?.map(q => (
              <div key={q.id} className="p-2 rounded-lg" style={{ background: "var(--bg-elevated)" }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                      {q.number} · {q.party?.name ?? "—"}
                    </div>
                    <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                      {fmtFull(q.total)} · {daysAgo(q.createdAt)}d ago
                    </div>
                  </div>
                  <button
                    onClick={() => approveQuote(q.id)}
                    disabled={actioning === q.id}
                    className="btn-primary text-[10px] px-2 py-1">
                    {actioning === q.id ? "…" : "Approve"}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => router.push("/admin/quotes")} className="mt-3 w-full text-xs text-center font-semibold"
            style={{ color: "var(--brand)" }}>
            View all quotes →
          </button>
        </div>

        {/* Recent Orders */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShoppingCart size={14} style={{ color: "#3b82f6" }} />
              <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Recent Orders</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
            {(!dash?.recentOrders || dash.recentOrders.length === 0) && (
              <div className="py-6 text-center">
                <ShoppingCart size={24} style={{ color: "var(--text-muted)", margin: "0 auto 8px" }} />
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>No recent orders</p>
              </div>
            )}
            {dash?.recentOrders?.map(o => (
              <div key={o.id} className="p-2 rounded-lg" style={{ background: "var(--bg-elevated)" }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                      {o.number}
                    </div>
                    <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                      {o.party?.name ?? "—"} · {fmtFull(o.total)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`badge ${o.status === "CONFIRMED" ? "badge-amber" : "badge-blue"}`} style={{ fontSize: 9 }}>
                      {o.status}
                    </span>
                    {o.status === "CONFIRMED" && (
                      <button onClick={() => processOrder(o.id)} disabled={actioning === o.id}
                        className="btn-ghost text-[10px] px-1.5 py-0.5">
                        {actioning === o.id ? "…" : "Process"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => router.push("/admin/sales-orders")} className="mt-3 w-full text-xs text-center font-semibold"
            style={{ color: "var(--brand)" }}>
            View all orders →
          </button>
        </div>
      </div>

      {/* Analytics + Insights Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">

        {/* Revenue Chart */}
        <div className="glass rounded-2xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} style={{ color: "var(--brand)" }} />
              <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Revenue Trend (6 months)</span>
            </div>
            {insights?.forecast && (
              <div className="text-right">
                <div className="text-xs font-bold" style={{ color: insights.forecast.growthRate >= 0 ? "#22c55e" : "#ef4444" }}>
                  {insights.forecast.growthRate >= 0 ? "+" : ""}{insights.forecast.growthRate.toFixed(1)}% vs last month
                </div>
                <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                  Projected: {fmt(insights.forecast.thisMonthProjected)}
                </div>
              </div>
            )}
          </div>
          {dash?.monthlyTrend && <RevenueChart data={dash.monthlyTrend} />}
          {/* Quick stats */}
          {insights?.quickStats && (
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
              <div>
                <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>Lead Pipeline Value</div>
                <div className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                  {fmt(insights.quickStats.totalLeadValue)}
                </div>
              </div>
              <div>
                <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>Conversion Rate</div>
                <div className="text-sm font-bold" style={{ color: "var(--brand)" }}>
                  {insights.quickStats.conversionRate.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>Avg Deal Size</div>
                <div className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                  {fmt(insights.quickStats.avgDealSize)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* AI Insights */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap size={14} style={{ color: "var(--brand)" }} />
              <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>AI Insights</span>
            </div>
            {insights && insights.insights.length > 3 && (
              <button onClick={() => setShowAllInsights(!showAllInsights)}
                className="text-[10px]" style={{ color: "var(--brand)" }}>
                {showAllInsights ? "Show less" : `+${insights.insights.length - 3} more`}
              </button>
            )}
          </div>
          <div className="flex flex-col gap-2 overflow-y-auto max-h-72">
            {(!insights?.insights || insights.insights.length === 0) && (
              <div className="py-6 text-center">
                <CheckCircle size={28} style={{ color: "#22c55e", margin: "0 auto 8px" }} />
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>All good!</p>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>No issues detected</p>
              </div>
            )}
            {(showAllInsights ? insights?.insights : insights?.insights.slice(0, 3))?.map((ins, i) => (
              <InsightCard key={i} insight={ins} />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Customer Risks + Team Performance + Dispatch */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Customer Risks */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={14} style={{ color: "#ef4444" }} />
            <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Customer Risks</span>
          </div>
          {(!dash?.customerRisks || dash.customerRisks.length === 0) ? (
            <div className="py-4 text-center">
              <CheckCircle size={20} style={{ color: "#22c55e", margin: "0 auto 6px" }} />
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>No at-risk customers</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {dash.customerRisks.slice(0, 5).map((r, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg"
                  style={{ background: "var(--bg-elevated)" }}>
                  <div>
                    <div className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                      {r.partyName}
                    </div>
                    <div className="text-[10px]" style={{ color: "#ef4444" }}>
                      {r.overdueCount} overdue · {fmt(r.totalOverdue)}
                    </div>
                  </div>
                  <button onClick={() => router.push("/admin/invoices")}
                    className="btn-ghost p-1"><ChevronRight size={12} /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Team Performance */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users size={14} style={{ color: "#3b82f6" }} />
            <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Team Performance</span>
            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>(quotes, 30d)</span>
          </div>
          {(!dash?.teamPerformance || dash.teamPerformance.length === 0) ? (
            <div className="py-4 text-center">
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>No team data yet</p>
            </div>
          ) : (() => {
            const maxCount = Math.max(...dash.teamPerformance.map(t => t.quotesCount), 1);
            return (
              <div className="flex flex-col gap-2.5">
                {dash.teamPerformance.slice(0, 5).map((t, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs" style={{ color: "var(--text-primary)" }}>
                        {t.name}
                      </span>
                      <span className="text-xs font-bold" style={{ color: "var(--brand)" }}>
                        {t.quotesCount}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full" style={{ background: "var(--bg-elevated)" }}>
                      <div className="h-1.5 rounded-full"
                        style={{ width: `${(t.quotesCount / maxCount) * 100}%`, background: "var(--brand)" }} />
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Dispatch Status */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Truck size={14} style={{ color: "var(--brand)" }} />
            <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Dispatch Status</span>
          </div>
          {(!dash?.dispatchStatus || Object.values(dash.dispatchStatus).every(v => v === 0)) ? (
            <div className="py-4 text-center">
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>No active dispatches</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {Object.entries(dash.dispatchStatus).filter(([, count]) => count > 0).map(([status, count]) => {
                const colors: Record<string, string> = {
                  READY: "#f59e0b", DISPATCHED: "#3b82f6",
                  IN_TRANSIT: "#14c7c0", DELIVERED: "#22c55e",
                };
                return (
                  <div key={status} className="flex items-center justify-between p-2 rounded-lg"
                    style={{ background: "var(--bg-elevated)" }}>
                    <div className="flex items-center gap-2">
                      <Circle size={8} fill={colors[status] ?? "#6b7280"} color={colors[status] ?? "#6b7280"} />
                      <span className="text-xs" style={{ color: "var(--text-primary)" }}>{status}</span>
                    </div>
                    <span className="text-xs font-bold" style={{ color: colors[status] ?? "var(--text-muted)" }}>
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          <button onClick={() => router.push("/admin/dispatches")} className="mt-3 w-full text-xs text-center font-semibold"
            style={{ color: "var(--brand)" }}>
            Manage dispatches →
          </button>
        </div>
      </div>
    </div>
  );
}
