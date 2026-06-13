"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard, Users, Package, FileText, ShoppingCart,
  Receipt, Truck, Warehouse, UserSquare, Settings, LogOut,
  ChevronLeft, ChevronRight, Bell, Search, Building2,
  ClipboardList, FolderOpen, X, Menu, Command, ChevronDown,
  Globe, BookOpen, Zap,
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
      { href: "/admin/catalog", icon: BookOpen, label: "Catalog Manager" },
      { href: "/admin/parties", icon: Building2, label: "Parties" },
    ],
  },
  {
    group: "Website",
    items: [
      { href: "/admin/website", icon: Globe, label: "Website & Settings" },
      { href: "/admin/cms", icon: BookOpen, label: "CMS & Blog" },
      { href: "/admin/documents", icon: FolderOpen, label: "Documents" },
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
      { href: "/admin/users", icon: UserSquare, label: "User Management" },
      { href: "/admin/automation", icon: Zap, label: "Automation" },
      { href: "/admin/settings", icon: Settings, label: "Settings" },
    ],
  },
];

const ALL_ITEMS = NAV.flatMap(g => g.items);

function CommandPalette({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [idx, setIdx] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query.trim()
    ? ALL_ITEMS.filter(i => i.label.toLowerCase().includes(query.toLowerCase()))
    : ALL_ITEMS.slice(0, 8);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { setIdx(0); }, [query]);

  function go(href: string) { router.push(href); onClose(); }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setIdx(i => Math.min(i + 1, filtered.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setIdx(i => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && filtered[idx]) go(filtered[idx].href);
    if (e.key === "Escape") onClose();
  }

  return (
    <div className="cmd-overlay" onClick={onClose}>
      <div className="cmd-box" onClick={e => e.stopPropagation()}>
        <div className="cmd-input-wrap">
          <Search size={15} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          <input
            ref={inputRef}
            className="cmd-input"
            placeholder="Search modules, settings…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKey}
          />
          <kbd className="text-[10px] px-1.5 py-0.5 rounded font-mono"
            style={{ background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
            ESC
          </kbd>
        </div>
        <div className="cmd-list">
          {filtered.length === 0 && (
            <div className="py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>No results</div>
          )}
          {filtered.map((item, i) => {
            const Icon = item.icon;
            return (
              <button key={item.href} onClick={() => go(item.href)}
                className={`cmd-item ${i === idx ? "focused" : ""}`}
                onMouseEnter={() => setIdx(i)}>
                <Icon size={15} style={{ color: i === idx ? "var(--brand)" : "var(--text-muted)" }} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen(o => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3"
            style={{ borderColor: "var(--brand)" }} />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading…</p>
        </div>
      </div>
    );
  }
  if (status === "unauthenticated") return null;

  function toggleGroup(group: string) {
    setCollapsedGroups(g => ({ ...g, [group]: !g[group] }));
  }

  const SidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-sm font-black"
          style={{ background: "linear-gradient(135deg,var(--brand),var(--accent))", color: "#fff" }}>
          P
        </div>
        {!collapsed && (
          <div className="overflow-hidden flex-1">
            <div className="font-black text-sm tracking-widest leading-none" style={{ color: "var(--text-primary)" }}>PACKPRO</div>
            <div className="text-[9px] font-semibold tracking-[2px] uppercase mt-0.5" style={{ color: "var(--text-muted)" }}>Business OS</div>
          </div>
        )}
        <button onClick={() => setCollapsed(c => !c)}
          className="hidden md:flex ml-auto w-6 h-6 rounded-md items-center justify-center transition-colors hover:bg-white/5"
          style={{ color: "var(--text-muted)" }}>
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Search / Cmd */}
      {!collapsed && (
        <div className="px-3 py-3">
          <button onClick={() => setCmdOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
            style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
            <Search size={13} />
            <span className="flex-1 text-left text-xs">Search…</span>
            <span className="flex items-center gap-0.5 text-[10px] font-mono">
              <Command size={10} />K
            </span>
          </button>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 scrollbar-hide">
        {NAV.map(({ group, items }) => {
          const groupCollapsed = collapsedGroups[group];
          return (
            <div key={group} className="mb-1">
              {!collapsed && (
                <button onClick={() => toggleGroup(group)}
                  className="nav-group-label w-full flex items-center justify-between px-3 py-1.5 rounded-md transition-colors hover:bg-white/5">
                  <span>{group}</span>
                  <ChevronDown size={10} style={{
                    transform: groupCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
                    transition: "transform 0.2s",
                    color: "var(--text-muted)",
                  }} />
                </button>
              )}
              {!groupCollapsed && items.map(({ href, icon: Icon, label }) => {
                const active = pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link key={href} href={href}
                    onClick={() => setMobileOpen(false)}
                    className={`nav-item ${active ? "active" : ""}`}>
                    <Icon size={15} className="flex-shrink-0" />
                    {!collapsed && <span className="flex-1 truncate">{label}</span>}
                    {active && !collapsed && <span className="nav-active-dot" />}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-3" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl"
          style={{ background: "var(--bg-input)" }}>
          <div className="avatar avatar-sm flex-shrink-0">
            {session?.user?.name?.[0] ?? "A"}
          </div>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <div className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                {session?.user?.name ?? "Admin"}
              </div>
              <div className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>
                {(session?.user as any)?.role ?? "ADMIN"}
              </div>
            </div>
          )}
          {!collapsed && (
            <button onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
              style={{ color: "var(--text-muted)" }} title="Sign out">
              <LogOut size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {cmdOpen && <CommandPalette onClose={() => setCmdOpen(false)} />}

      {/* Desktop Sidebar */}
      <aside className={`sidebar hidden md:block ${collapsed ? "collapsed" : ""}`}>
        {SidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64"
            style={{ background: "var(--bg-surface)", borderRight: "1px solid var(--border)" }}>
            <button onClick={() => setMobileOpen(false)}
              className="absolute top-3 right-3 p-1.5 rounded-lg" style={{ color: "var(--text-muted)" }}>
              <X size={16} />
            </button>
            {SidebarContent}
          </aside>
        </div>
      )}

      {/* Main */}
      <div className={`main-content ${collapsed ? "collapsed" : ""}`}>
        <header className="topbar flex items-center px-4 gap-3">
          <button className="md:hidden btn-ghost p-2" onClick={() => setMobileOpen(true)}>
            <Menu size={18} />
          </button>

          {/* Breadcrumb / page title area — filled by each page */}
          <div className="flex-1" />

          {/* Search trigger */}
          <button onClick={() => setCmdOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors"
            style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
            <Search size={12} />
            <span>Search</span>
            <span className="flex items-center gap-0.5 font-mono ml-1 opacity-60">
              <Command size={10} />K
            </span>
          </button>

          {/* Notifications */}
          <button className="btn-ghost p-2 relative">
            <Bell size={16} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
              style={{ background: "#ef4444" }} />
          </button>

          {/* User avatar */}
          <div className="avatar avatar-sm cursor-pointer" title={session?.user?.name ?? "User"}
            onClick={() => signOut({ callbackUrl: "/login" })}>
            {session?.user?.name?.[0] ?? "A"}
          </div>
        </header>

        <main className="animate-in">
          {children}
        </main>
      </div>
    </div>
  );
}
