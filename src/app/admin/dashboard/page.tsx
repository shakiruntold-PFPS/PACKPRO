"use client";
import { useEffect, useState } from "react";
import {
  TrendingUp, TrendingDown, Users, Package, FileText,
  Receipt, Truck, AlertTriangle, DollarSign, ArrowUpRight,
  RefreshCw, ShoppingCart, Warehouse
} from "lucide-react";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

function KPI({ label, value, sub, icon: Icon, color = "#0ea5a0", trend }: any) {
  return (
    <div className="kpi-card">
      <div className="flex items-start justify-between mb-3">
        <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>{label}</div>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}20` }}>
          <Icon size={15} style={{ color }} />
        </div>
      </div>
      <div className="text-2xl font-black text-white mb-1">{value}</div>
      {sub && <div className="text-xs" style={{ color: "var(--muted)" }}>{sub}</div>}
      {trend && (
        <div className={`text-xs font-semibold mt-1 flex items-center gap-1`}
          style={{ color: trend > 0 ? "#10b981" : "#ef4444" }}>
          {trend > 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {Math.abs(trend)}% vs last month
        </div>
      )}
    </div>
  );
}

const CHART_COLORS = ["#0ea5a0", "#1b4f8a", "#f59e0b", "#10b981", "#ef4444"];

const MOCK_TREND = [
  { month: "Jan", revenue: 820000, orders: 14 },
  { month: "Feb", revenue: 940000, orders: 18 },
  { month: "Mar", revenue: 780000, orders: 12 },
  { month: "Apr", revenue: 1120000, orders: 22 },
  { month: "May", revenue: 1350000, orders: 28 },
  { month: "Jun", revenue: 1240000, orders: 24 },
];

const MOCK_FUNNEL = [
  { status: "New", count: 18, value: 540000 },
  { status: "Qualified", count: 12, value: 380000 },
  { status: "Proposal", count: 8, value: 290000 },
  { status: "Won", count: 5, value: 195000 },
];

const MOCK_TOP_PRODUCTS = [
  { name: "Paper Cups 8oz", revenue: 320000, pct: 34 },
  { name: "Kraft Bowls 500ml", revenue: 248000, pct: 26 },
  { name: "PET Cold Cups", revenue: 182000, pct: 19 },
  { name: "Meal Boxes", revenue: 124000, pct: 13 },
  { name: "Bakery Boxes", revenue: 76000, pct: 8 },
];

const MOCK_ACTIVITIES = [
  { id: 1, user: "Priya V.", action: "Created quotation PPQ-2025-041 for Cloud Bites Kitchen", time: "10 min ago", type: "quote" },
  { id: 2, user: "Amit S.", action: "Lead converted — Spice Route Restaurant", time: "45 min ago", type: "lead" },
  { id: 3, user: "Rahul G.", action: "Invoice INV-2025-018 marked as paid ₹64,800", time: "2 hrs ago", type: "invoice" },
  { id: 4, user: "Sneha J.", action: "Dispatch #DSP-022 sent to FreshFarm Delivery", time: "3 hrs ago", type: "dispatch" },
  { id: 5, user: "Vikram S.", action: "Low stock alert: Kraft Bowls — 85 units remaining", time: "4 hrs ago", type: "alert" },
];

export default function DashboardPage() {
  const [loading, setLoading] = useState(false);
  const [lastUpdated] = useState(new Date());

  return (
    <div className="module-page">
      {/* Header */}
      <div className="module-header">
        <div>
          <h1 className="module-title">Executive Dashboard</h1>
          <p className="module-subtitle">PACKPRO Food Packaging Solutions · FY 2025–26</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs" style={{ color: "var(--muted)" }}>
            Updated {formatDate(lastUpdated)}
          </div>
          <button className="btn-ghost" onClick={() => setLoading(l => !l)}>
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPI label="Today's Revenue" value="₹1,24,500" sub="12 invoices raised" icon={DollarSign} color="#10b981" trend={8} />
        <KPI label="Monthly Revenue" value="₹12,40,000" sub="Jun 2025" icon={TrendingUp} color="#0ea5a0" trend={12} />
        <KPI label="Active Leads" value="34" sub="8 hot, 14 warm" icon={Users} color="#f59e0b" />
        <KPI label="Open Quotes" value="11" sub="₹8,40,000 pipeline" icon={FileText} color="#1b4f8a" />
      </div>

      {/* KPI Row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPI label="Outstanding Receivables" value="₹3,84,000" sub="14 invoices pending" icon={Receipt} color="#ef4444" />
        <KPI label="Pending Orders" value="7" sub="Ready to dispatch: 3" icon={ShoppingCart} color="#a78bfa" />
        <KPI label="Low Stock Alerts" value="4" sub="Below reorder level" icon={AlertTriangle} color="#f59e0b" />
        <KPI label="Active Employees" value="18" sub="Payroll: ₹3,20,000/mo" icon={Users} color="#10b981" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Revenue Trend */}
        <div className="lg:col-span-2 glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="font-bold text-white text-sm">Revenue Trend</div>
            <span className="badge badge-teal">Last 6 months</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={MOCK_TREND}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5a0" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0ea5a0" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: "#8ba5c8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#8ba5c8", fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={v => `₹${(v / 100000).toFixed(1)}L`} />
              <Tooltip
                contentStyle={{ background: "#142645", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, fontSize: 12 }}
                formatter={(v: any) => [`₹${(v / 1000).toFixed(0)}K`, "Revenue"]}
              />
              <Area type="monotone" dataKey="revenue" stroke="#0ea5a0" strokeWidth={2} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products */}
        <div className="glass rounded-2xl p-5">
          <div className="font-bold text-white text-sm mb-4">Top Products</div>
          {MOCK_TOP_PRODUCTS.map((p, i) => (
            <div key={p.name} className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color: "var(--muted)" }}>{p.name}</span>
                <span className="font-semibold" style={{ color: "#14c7c0" }}>{p.pct}%</span>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: "var(--border)" }}>
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${p.pct}%`, background: `linear-gradient(90deg, ${CHART_COLORS[i]}, ${CHART_COLORS[i]}88)` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Lead Funnel */}
        <div className="glass rounded-2xl p-5">
          <div className="font-bold text-white text-sm mb-4">Sales Funnel</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={MOCK_FUNNEL} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#8ba5c8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="status" type="category" tick={{ fill: "#8ba5c8", fontSize: 12 }} axisLine={false} tickLine={false} width={70} />
              <Tooltip
                contentStyle={{ background: "#142645", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, fontSize: 12 }}
              />
              <Bar dataKey="count" fill="#0ea5a0" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Activity */}
        <div className="glass rounded-2xl p-5">
          <div className="font-bold text-white text-sm mb-4">Recent Activity</div>
          <div className="space-y-3">
            {MOCK_ACTIVITIES.map(a => (
              <div key={a.id} className="flex gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: "linear-gradient(135deg,#0ea5a0,#1b4f8a)", color: "#fff" }}>
                  {a.user[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-white leading-tight">
                    <span className="font-semibold">{a.user}</span>{" "}
                    <span style={{ color: "var(--muted)" }}>{a.action}</span>
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: "var(--muted)" }}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
