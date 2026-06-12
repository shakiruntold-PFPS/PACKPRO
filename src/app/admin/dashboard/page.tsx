"use client";
import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  TrendingUp, TrendingDown, Users, Package, FileText,
  Receipt, AlertTriangle, DollarSign, ShoppingCart, RefreshCw
} from "lucide-react";
import { formatDate } from "@/lib/utils";

const AreaChart    = dynamic(() => import("recharts").then(m => m.AreaChart),    { ssr: false });
const Area         = dynamic(() => import("recharts").then(m => m.Area),         { ssr: false });
const BarChart     = dynamic(() => import("recharts").then(m => m.BarChart),     { ssr: false });
const Bar          = dynamic(() => import("recharts").then(m => m.Bar),          { ssr: false });
const XAxis        = dynamic(() => import("recharts").then(m => m.XAxis),        { ssr: false });
const YAxis        = dynamic(() => import("recharts").then(m => m.YAxis),        { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then(m => m.CartesianGrid), { ssr: false });
const Tooltip      = dynamic(() => import("recharts").then(m => m.Tooltip),      { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then(m => m.ResponsiveContainer), { ssr: false });

function KPI({ label, value, sub, icon: Icon, color = "#0ea5a0", trend }: any) {
  return (
    <div className="kpi-card">
      <div className="flex items-start justify-between mb-3">
        <div className="text-xs font-semibold uppercase tracking-wide" style={{ color:"var(--muted)" }}>{label}</div>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background:`${color}20` }}>
          <Icon size={15} style={{ color }}/>
        </div>
      </div>
      <div className="text-2xl font-black text-white mb-1">{value}</div>
      {sub && <div className="text-xs" style={{ color:"var(--muted)" }}>{sub}</div>}
      {trend !== undefined && (
        <div className="text-xs font-semibold mt-1 flex items-center gap-1"
          style={{ color:trend>=0?"#10b981":"#ef4444" }}>
          {trend>=0 ? <TrendingUp size={11}/> : <TrendingDown size={11}/>}
          {Math.abs(trend)}% vs last month
        </div>
      )}
    </div>
  );
}

const CHART_COLORS = ["#0ea5a0","#1b4f8a","#f59e0b","#10b981","#ef4444"];

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json.data);
      setLastUpdated(new Date());
    } catch (e: any) {
      setError(e.message ?? "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const kpi = data?.kpi ?? {};
  const recentActivity = data?.recentActivity ?? [];
  const topProducts = data?.topProducts ?? [];
  const revenueTrend = data?.revenueTrend ?? [];

  return (
    <div className="module-page">
      <div className="module-header">
        <div>
          <h1 className="module-title">Executive Dashboard</h1>
          <p className="module-subtitle">PACKPRO Food Packaging Solutions · FY 2025–26</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs" style={{ color:"var(--muted)" }}>
            Updated {formatDate(lastUpdated.toISOString())}
          </div>
          <button className="btn-ghost" onClick={fetchDashboard}>
            <RefreshCw size={13} className={loading?"animate-spin":""}/>
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl mb-5 text-sm"
          style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", color:"#ef4444" }}>
          {error} — Check that DATABASE_URL and NEXTAUTH_SECRET are set in your deployment environment.
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPI label="Monthly Revenue" value={`₹${((kpi.monthlyRevenue??0)/100000).toFixed(1)}L`} sub="Current month invoices" icon={TrendingUp} color="#0ea5a0"/>
        <KPI label="Active Leads" value={kpi.activeLeads??0} sub="In pipeline" icon={Users} color="#f59e0b"/>
        <KPI label="Open Quotes" value={kpi.openQuotes??0} sub="Pending approval" icon={FileText} color="#1b4f8a"/>
        <KPI label="Outstanding" value={`₹${((kpi.outstanding??0)/100000).toFixed(1)}L`} sub="Receivables pending" icon={Receipt} color="#ef4444"/>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPI label="Pending Orders" value={kpi.pendingOrders??0} sub="Ready to dispatch" icon={ShoppingCart} color="#a78bfa"/>
        <KPI label="Low Stock Alerts" value={kpi.lowStock??0} sub="Below reorder level" icon={AlertTriangle} color="#f59e0b"/>
        <KPI label="Active Employees" value={kpi.activeEmployees??0} sub="On payroll" icon={Users} color="#10b981"/>
        <KPI label="Total Products" value={kpi.totalProducts??0} sub="In catalog" icon={Package} color="#0ea5a0"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="font-bold text-white text-sm">Revenue Trend</div>
            <span className="badge badge-teal">Last 6 months</span>
          </div>
          {revenueTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={revenueTrend}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5a0" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0ea5a0" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
                <XAxis dataKey="month" tick={{ fill:"#8ba5c8", fontSize:11 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill:"#8ba5c8", fontSize:11 }} axisLine={false} tickLine={false}
                  tickFormatter={(v:number) => `₹${(v/100000).toFixed(1)}L`}/>
                <Tooltip
                  contentStyle={{ background:"#142645", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, fontSize:12 }}
                  formatter={(v:any) => [`₹${(v/1000).toFixed(0)}K`, "Revenue"]}
                />
                <Area type="monotone" dataKey="revenue" stroke="#0ea5a0" strokeWidth={2} fill="url(#rev)"/>
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-sm" style={{ color:"var(--muted)" }}>
              {loading ? "Loading chart…" : "No revenue data yet — create invoices to see trends"}
            </div>
          )}
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="font-bold text-white text-sm mb-4">Top Products</div>
          {topProducts.length > 0 ? topProducts.map((p:any, i:number) => (
            <div key={p.name} className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color:"var(--muted)" }}>{p.name}</span>
                <span className="font-semibold" style={{ color:"#14c7c0" }}>{p.pct}%</span>
              </div>
              <div className="h-1.5 rounded-full" style={{ background:"var(--border)" }}>
                <div className="h-full rounded-full transition-all"
                  style={{ width:`${p.pct}%`, background:`linear-gradient(90deg, ${CHART_COLORS[i%5]}, ${CHART_COLORS[i%5]}88)` }}/>
              </div>
            </div>
          )) : (
            <div className="flex items-center justify-center h-32 text-sm" style={{ color:"var(--muted)" }}>
              {loading ? "Loading…" : "No product data yet"}
            </div>
          )}
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <div className="font-bold text-white text-sm mb-4">Recent Activity</div>
        {recentActivity.length > 0 ? (
          <div className="space-y-3">
            {recentActivity.map((a:any) => (
              <div key={a.id} className="flex gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background:"linear-gradient(135deg,#0ea5a0,#1b4f8a)", color:"#fff" }}>
                  {(a.user?.[0] ?? "?")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-white leading-tight">
                    <span className="font-semibold">{a.user}</span>{" "}
                    <span style={{ color:"var(--muted)" }}>{a.action}</span>
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color:"var(--muted)" }}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-sm" style={{ color:"var(--muted)" }}>
            {loading ? "Loading…" : "No recent activity recorded yet"}
          </div>
        )}
      </div>
    </div>
  );
}
