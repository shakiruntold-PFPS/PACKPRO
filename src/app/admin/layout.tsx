"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard, Users, Package, FileText, ShoppingCart,
  Receipt, Truck, Warehouse, UserSquare, Settings, LogOut,
  ChevronLeft, ChevronRight, Bell, Search, MessageSquare,
  BarChart3, FolderOpen, ClipboardList, Menu, X, Building2
} from "lucide-react";

const NAV = [
  {
    group: "Overview",
    items: [
      { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    ],
  },
  {
    group: "Sales",
    items: [
      { href: "/admin/crm", icon: Users, label: "CRM & Leads" },
      { href: "/admin/quotes", icon: FileText, label: "Quotations" },
      { href: "/admin/sales-orders", icon: ShoppingCart, label: "Sales Orders" },
      { href: "/admin/invoices", icon: Receipt, label: "Invoices" },
    ],
  },
  {
    group: "Operations",
    items: [
      { href: "/admin/purchases", icon: ClipboardList, label: "Purchases" },
      { href: "/admin/inventory", icon: Warehouse, label: "Inventory" },
      { href: "/admin/dispatches", icon: Truck, label: "Dispatches" },
    ],
  },
  {
    group: "Catalog",
    items: [
      { href: "/admin/products", icon: Package, label: "Products" },
      { href: "/admin/parties", icon: Building2, label: "Parties" },
    ],
  },
  {
    group: "HR",
    items: [
      { href: "/admin/hr/employees", icon: UserSquare, label: "Employees" },
      { href: "/admin/hr/payroll", icon: Receipt, label: "Payroll" },
      { href: "/admin/hr/attendance", icon: ClipboardList, label: "Attendance" },
    ],
  },
  {
    group: "Admin",
    items: [
      { href: "/admin/documents", icon: FolderOpen, label: "Documents" },
      { href: "/admin/settings", icon: Settings, label: "Settings" },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0b1e3d" }}>
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm" style={{ color: "var(--muted)" }}>Loading…</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/8">
        <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-sm font-black"
          style={{ background: "linear-gradient(135deg,#0ea5a0,#1b4f8a)" }}>
          P
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="font-black text-sm tracking-widest text-white leading-none">PACKPRO</div>
            <div className="text-[9px] text-muted font-medium tracking-[2px] uppercase mt-0.5"
              style={{ color: "var(--muted)" }}>Business OS</div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="ml-auto hidden md:flex items-center justify-center w-6 h-6 rounded-md hover:bg-white/5 text-muted"
          style={{ color: "var(--muted)" }}>
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {NAV.map(({ group, items }) => (
          <div key={group} className="mb-4">
            {!collapsed && (
              <div className="text-[10px] font-bold uppercase tracking-widest px-3 mb-1"
                style={{ color: "var(--muted)", letterSpacing: "1.5px" }}>
                {group}
              </div>
            )}
            {items.map(({ href, icon: Icon, label }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link key={href} href={href}
                  onClick={() => setMobileSidebarOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 transition-all duration-150 group"
                  style={{
                    background: active ? "rgba(14,165,160,0.15)" : "transparent",
                    color: active ? "#14c7c0" : "#8ba5c8",
                  }}>
                  <Icon size={16} className="flex-shrink-0"
                    style={{ color: active ? "#14c7c0" : "#8ba5c8" }} />
                  {!collapsed && (
                    <span className="text-sm font-medium truncate">{label}</span>
                  )}
                  {active && !collapsed && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0"
                      style={{ background: "#14c7c0" }} />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User section */}
      <div className="p-3 border-t" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg"
          style={{ background: "var(--glass)" }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#0ea5a0,#1b4f8a)", color: "#fff" }}>
            {session?.user?.name?.[0] ?? "A"}
          </div>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <div className="text-sm font-semibold text-white truncate">{session?.user?.name ?? "Admin"}</div>
              <div className="text-[11px] truncate" style={{ color: "var(--muted)" }}>
                {(session?.user as any)?.role ?? "ADMIN"}
              </div>
            </div>
          )}
          {!collapsed && (
            <button onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-1.5 rounded-md hover:bg-red-500/10 transition-colors"
              style={{ color: "var(--muted)" }} title="Sign out">
              <LogOut size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {/* Desktop Sidebar */}
      <aside className={`sidebar hidden md:block ${collapsed ? "collapsed" : ""}`}>
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64"
            style={{ background: "rgba(11,30,61,0.98)", borderRight: "1px solid var(--border)" }}>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className={`main-content ${collapsed ? "collapsed" : ""}`}>
        {/* Topbar */}
        <header className="topbar flex items-center px-4 gap-4">
          {/* Mobile menu button */}
          <button className="md:hidden btn-ghost p-2"
            onClick={() => setMobileSidebarOpen(true)}>
            <Menu size={18} />
          </button>

          {/* Search */}
          <div className="search-bar flex-1 max-w-sm hidden sm:flex">
            <Search size={14} style={{ color: "var(--muted)" }} />
            <input placeholder="Search products, leads, invoices…" />
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Notifications */}
            <button className="btn-ghost p-2 relative">
              <Bell size={16} />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full"
                style={{ background: "#ef4444" }} />
            </button>
            {/* WhatsApp */}
            <a href="https://wa.me/919057627625" target="_blank" rel="noreferrer"
              className="btn-ghost p-2" style={{ color: "#4ade80" }}>
              <MessageSquare size={16} />
            </a>
            {/* Company */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{ background: "var(--glass)", border: "1px solid var(--border)" }}>
              <Building2 size={14} style={{ color: "var(--muted)" }} />
              <span className="text-xs font-semibold" style={{ color: "var(--muted)" }}>PACKPRO ERP</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="animate-in">
          {children}
        </main>
      </div>
    </div>
  );
}
