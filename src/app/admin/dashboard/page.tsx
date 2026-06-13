"use client";
import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  TrendingUp, TrendingDown, Users, Package, FileText,
  Receipt, AlertTriangle, ShoppingCart, RefreshCw,
  Truck, DollarSign, Activity,
} from "lucide-react";

const AreaChart = dynamic(() => import("recharts").then(m => m.AreaChart), { ssr: false });
const Area = dynamic(() => import("recharts").then(m => m.Area), { ssr: false });
const BarChart = dynamic(() => import("recharts").then(m => m.BarChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then(m => m.Bar), { ssr: false });
const XAxis = dynamic(() => import("recharts").then(m => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then(m => m.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then(m => m.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then(m => m.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then(m => m.ResponsiveContainer), { ssr: false });

function fmt(n: number) {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(1)}Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)}L`;
  if (n >= 1e3) return `₹${(n / 1e3).toFixed(0)}K`;
  return `₹${n}`;
}

function KpiCard({ label, value, sub, icon: Icon, color = "#0ea5a0", trend }: any) {
  return (
    <div className="kpi-card">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{label}</p>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}18` }}>
          <Icon size={16} style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-black mb-1" style={{ color: "var(--text-primary)" }}>{value}</p>
      {sub && <p className="text-xs" style={{ color: "var(--text-muted)" }}>{sub}</p>}
      {trend !== undefined && (
        <div className="flex items-center gap-1 text-xs font-semibold mt-1.5"
          style={{ color: trend >= 0 ? "#10b981" : "#ef4444" }}>
          {trend >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          {Math.abs(trend)}% vs last month
        </div>
      )}
    </div>
  );
}

const COLORS = ["#0ea5a0", "#1b4f8a", "#f59e0b", "#10b981", "#a78bfa"];

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError("");
    try {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json.data);
      setLastUpdated(new Date());
    } catch (e: any) {
      setFetchError(e.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const kpis = data?.kpis ?? {};
  const monthlyTrend = data?.monthlyTrend ?? [];
  const topProducts = data?.topProducts ?? [];
  const recentActivities = data?.recentActivities ?? [];
  const quoteFunnel = data?.quoteFunnel ?? [];

  const now = new Date();
  const timeStr = now.toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" });

  return (
    <div className="module-page">
      <div className="module-header">
        <div>
          <h1 className="module-title">Executive Dashboard</h1>
          <p className="module-subtitle">Real-time business intelligence · {timeStr}</p>
        </div>
        <button className="btn-ghost" onClick={load}>
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {fetchError && (
        <div className="mb-6 rounded-2xl p-4 flex items-center gap-3"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
          <AlertTriangle size={18} style={{ color: "#ef4444", flexShrink: 0 }} />
          <div className="text-sm" style={{ color: "#ef4444" }}>{fetchError}</div>
        </div>
      )}

      {/* KPI Row 1 — Revenue */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <KpiCard label="Today's Revenue" value={fmt(kpis.todayRevenue ?? 0)} sub="Invoiced today" icon={DollarSign} color="#0ea5a0" />
        <KpiCard label="Month Revenue" value={fmt(kpis.monthRevenue ?? 0)} sub="Current month" icon={TrendingUp} color="#1b4f8a" />
        <KpiCard label="Year Revenue" value={fmt(kpis.yearRevenue ?? 0)} sub="FY Apr–Mar" icon={Activity} color="#a78bfa" />
        <KpiCard label="Receivables" value={fmt(kpis.outstandingReceivables ?? 0)} sub="Pending collection" icon={Receipt} color="#ef4444" />
      </div>

      {/* KPI Row 2 — Operations */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Active Leads" value={kpis.totalLeads ?? 0} sub={`${kpis.hotLeads ?? 0} urgent`} icon={Users} color="#f59e0b" />
        <KpiCard label="Open Quotes" value={kpis.openQuotes ?? 0} sub="Awaiting response" icon={FileText} color="#0ea5a0" />
        <KpiCard label="Pending Orders" value={kpis.pendingOrders ?? 0} sub="Ready/Processing" icon={ShoppingCart} color="#10b981" />
        <KpiCard label="Dispatches" value={kpis.pendingDispatches ?? 0} sub="In transit" icon={Truck} color="#1b4f8a" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Revenue Trend */}
        <div className="lg:col-span-2 glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Revenue Trend</p>
            <span className="badge badge-teal text-[10px]">Last 6 months</span>
          </div>
          {monthlyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={monthlyTrend} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad-rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5a0" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0ea5a0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: "#8ba5c8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#8ba5c8", fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={(v: number) => fmt(v)} width={55} />
                <Tooltip
                  contentStyle={{ background: "#0f2444", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, fontSize: 12 }}
                  formatter={(v: any) => [fmt(v), "Revenue"]}
                />
                <Area type="monotone" dataKey="revenue" stroke="#0ea5a0" strokeWidth={2.5} fill="url(#grad-rev)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-sm" style={{ color: "var(--text-muted)" }}>
              {loading ? "Loading chart…" : "No revenue data yet — create invoices to see trends"}
            </div>
          )}
        </div>

        {/* Quote Funnel */}
        <div className="glass rounded-2xl p-5">
          <p className="font-bold text-sm mb-4" style={{ color: "var(--text-primary)" }}>Quote Funnel</p>
          {quoteFunnel.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={quoteFunnel} margin={{ top: 0, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="status" tick={{ fill: "#8ba5c8", fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#8ba5c8", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#0f2444", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, fontSize: 12 }}
                />
                <Bar dataKey="_count" name="Quotes" fill="#1b4f8a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-sm" style={{ color: "var(--text-muted)" }}>
              {loading ? "Loading…" : "No quotes yet"}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Alerts */}
        <div className="glass rounded-2xl p-5">
          <p className="font-bold text-sm mb-4" style={{ color: "var(--text-primary)" }}>Alerts</p>
          <div className="space-y-3">
            {(kpis.lowStockCount ?? 0) > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
                <AlertTriangle size={14} style={{ color: "#f59e0b", flexShrink: 0 }} />
                <span className="text-xs" style={{ color: "#f59e0b" }}>
                  {kpis.lowStockCount} products below reorder level
                </span>
              </div>
            )}
            {(kpis.outstandingReceivables ?? 0) > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <Receipt size={14} style={{ color: "#ef4444", flexShrink: 0 }} />
                <span className="text-xs" style={{ color: "#ef4444" }}>
                  {fmt(kpis.outstandingReceivables)} in outstanding receivables
                </span>
              </div>
            )}
            {(kpis.hotLeads ?? 0) > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: "rgba(14,165,160,0.08)", border: "1px solid rgba(14,165,160,0.2)" }}>
                <Users size={14} style={{ color: "#0ea5a0", flexShrink: 0 }} />
                <span className="text-xs" style={{ color: "#0ea5a0" }}>
                  {kpis.hotLeads} urgent leads need follow-up
                </span>
              </div>
            )}
            {!kpis.lowStockCount && !kpis.outstandingReceivables && !kpis.hotLeads && (
              <p className="text-xs text-center py-4" style={{ color: "var(--text-muted)" }}>All clear — no alerts</p>
            )}
            <div className="pt-2 border-t space-y-2" style={{ borderColor: "var(--border)" }}>
              <div className="flex justify-between text-xs">
                <span style={{ color: "var(--text-muted)" }}>Employees</span>
                <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{kpis.totalEmployees ?? 0}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: "var(--text-muted)" }}>Products</span>
                <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{kpis.totalProducts ?? 0}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: "var(--text-muted)" }}>Payables</span>
                <span className="font-semibold" style={{ color: "#f59e0b" }}>{fmt(kpis.outstandingPayables ?? 0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="glass rounded-2xl p-5">
          <p className="font-bold text-sm mb-4" style={{ color: "var(--text-primary)" }}>Top Products</p>
          {topProducts.length > 0 ? (
            <div className="space-y-3">
              {topProducts.map((p: any, i: number) => {
                const maxVal = topProducts[0]?._sum?.total ?? 1;
                const pct = Math.round(((p._sum?.total ?? 0) / maxVal) * 100);
                return (
                  <div key={p.productId ?? i}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="truncate" style={{ color: "var(--text-muted)" }}>Product #{i + 1}</span>
                      <span className="font-semibold ml-2 flex-shrink-0" style={{ color: COLORS[i % 5] }}>
                        {fmt(p._sum?.total ?? 0)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: "var(--border)" }}>
                      <div className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: COLORS[i % 5] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-sm" style={{ color: "var(--text-muted)" }}>
              {loading ? "Loading…" : "No product sales data yet"}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="glass rounded-2xl p-5">
          <p className="font-bold text-sm mb-4" style={{ color: "var(--text-primary)" }}>Recent Activity</p>
          {recentActivities.length > 0 ? (
            <div className="space-y-3">
              {recentActivities.slice(0, 6).map((a: any) => (
                <div key={a.id} className="flex gap-3">
                  <div className="avatar avatar-sm flex-shrink-0">
                    {a.user?.name?.[0] ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs leading-snug" style={{ color: "var(--text-primary)" }}>
                      <span className="font-semibold">{a.user?.name ?? "System"}</span>{" "}
                      <span style={{ color: "var(--text-muted)" }}>{a.action}</span>
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {new Date(a.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-sm" style={{ color: "var(--text-muted)" }}>
              {loading ? "Loading…" : "No activity recorded yet"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
