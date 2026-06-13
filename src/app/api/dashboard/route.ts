export const runtime = "nodejs";
// src/app/api/dashboard/route.ts
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, requireAuth } from "@/lib/api";

export async function GET(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  const now           = new Date();
  const startOfMonth  = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear   = new Date(now.getFullYear(), 3, 1); // April (Indian FY)
  const startOfToday  = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const [
    todaySales,
    monthSales,
    yearSales,
    totalLeads,
    newLeads,
    hotLeads,
    openQuotes,
    pendingOrders,
    outstandingReceivables,
    outstandingPayables,
    lowStockProducts,
    totalProducts,
    totalEmployees,
    pendingDispatches,
    topProducts,
    topCustomers,
    recentActivities,
    quoteFunnel,
    followUpsToday,
    overdueInvoices,
    // NEW queries
    openTasksCount,
    pendingFollowUpsCount,
    teamPerformanceRaw,
    customerRisksRaw,
    upcomingFollowUps,
    pendingApprovals,
    recentOrders,
    dispatchStatusRaw,
  ] = await Promise.all([
    // Today's invoiced total
    db.invoice.aggregate({
      where: { date: { gte: startOfToday }, status: { not: "CANCELLED" } },
      _sum: { total: true },
    }).catch(() => ({ _sum: { total: 0 } })),

    // This month
    db.invoice.aggregate({
      where: { date: { gte: startOfMonth }, status: { not: "CANCELLED" } },
      _sum: { total: true },
    }).catch(() => ({ _sum: { total: 0 } })),

    // This financial year
    db.invoice.aggregate({
      where: { date: { gte: startOfYear }, status: { not: "CANCELLED" } },
      _sum: { total: true },
    }).catch(() => ({ _sum: { total: 0 } })),

    // Lead counts
    db.lead.count().catch(() => 0),
    db.lead.count({ where: { status: "NEW" } }).catch(() => 0),
    db.lead.count({ where: { priority: "URGENT" } }).catch(() => 0),

    // Open quotes
    db.quote.count({ where: { status: { in: ["DRAFT", "SENT", "VIEWED"] } } }).catch(() => 0),

    // Pending orders
    db.salesOrder.count({ where: { status: { in: ["CONFIRMED", "PROCESSING", "READY"] } } }).catch(() => 0),

    // Receivables (balance due on open invoices)
    db.invoice.aggregate({
      where: { status: { in: ["SENT", "VIEWED", "PARTIALLY_PAID", "OVERDUE"] } },
      _sum: { balanceDue: true },
    }).catch(() => ({ _sum: { balanceDue: 0 } })),

    // Payables
    db.purchaseBill.aggregate({
      where: { status: { in: ["PENDING", "PARTIALLY_PAID"] } },
      _sum: { total: true },
    }).catch(() => ({ _sum: { total: 0 } })),

    // Low stock: products where stockQty <= reorderLevel
    db.product.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, stockQty: true, reorderLevel: true },
    }).catch(() => [] as any[]),

    // Total active products
    db.product.count({ where: { status: "PUBLISHED" } }).catch(() => 0),

    // Active employees
    db.employee.count({ where: { isActive: true } }).catch(() => 0),

    // Pending dispatches
    db.dispatch.count({ where: { status: { in: ["READY", "DISPATCHED", "IN_TRANSIT"] } } }).catch(() => 0),

    // Top 5 products by invoice revenue
    db.invoiceItem.groupBy({
      by: ["productId"],
      _sum: { total: true, qty: true },
      orderBy: { _sum: { total: "desc" } },
      take: 5,
    }).catch(() => []),

    // Top 5 customers by invoice total
    db.invoice.groupBy({
      by: ["partyId"],
      _sum: { total: true },
      orderBy: { _sum: { total: "desc" } },
      take: 5,
      where: { status: { not: "CANCELLED" } },
    }).catch(() => []),

    // Recent activities
    db.activity.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, avatar: true } },
        lead: { select: { title: true } },
      },
    }).catch(() => []),

    // Quote funnel by status
    db.quote.groupBy({
      by: ["status"],
      _count: true,
      _sum: { total: true },
    }).catch(() => []),

    // Follow-ups due today or overdue
    db.lead.count({
      where: {
        followUpDate: { lte: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) },
        status: { notIn: ["WON", "LOST"] },
      },
    }).catch(() => 0),

    // Overdue invoices
    db.invoice.aggregate({
      where: { status: "OVERDUE" },
      _count: true,
      _sum: { balanceDue: true },
    }).catch(() => ({ _count: 0, _sum: { balanceDue: 0 } })),

    // NEW: Open tasks (PENDING or IN_PROGRESS)
    db.task.count({
      where: { status: { in: ["PENDING", "IN_PROGRESS"] } },
    }).catch(() => 0),

    // NEW: Pending follow-ups (followUpDate <= today, not WON/LOST)
    db.lead.count({
      where: {
        followUpDate: { lte: now },
        status: { notIn: ["WON", "LOST"] },
      },
    }).catch(() => 0),

    // NEW: Team performance — quotes per user in last 30 days
    db.quote.groupBy({
      by: ["createdById"],
      _count: true,
      where: { createdAt: { gte: thirtyDaysAgo } },
      orderBy: { _count: { createdById: "desc" } },
    }).catch(() => []),

    // NEW: Customer risks — overdue invoices grouped by party
    db.invoice.groupBy({
      by: ["partyId"],
      _count: true,
      _sum: { balanceDue: true },
      where: { status: "OVERDUE" },
      orderBy: { _sum: { balanceDue: "desc" } },
      take: 10,
    }).catch(() => []),

    // NEW: Upcoming follow-ups (next 3 days)
    db.lead.findMany({
      where: {
        followUpDate: { gte: now, lte: threeDaysFromNow },
        status: { notIn: ["WON", "LOST"] },
      },
      select: { id: true, title: true, contactName: true, followUpDate: true, priority: true },
      orderBy: { followUpDate: "asc" },
      take: 10,
    }).catch(() => []),

    // NEW: Pending approvals — quotes with status=SENT
    db.quote.findMany({
      where: { status: "SENT" },
      select: {
        id: true, number: true, total: true, createdAt: true,
        party: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }).catch(() => []),

    // NEW: Recent orders (last 5 CONFIRMED/PROCESSING)
    db.salesOrder.findMany({
      where: { status: { in: ["CONFIRMED", "PROCESSING"] } },
      select: {
        id: true, number: true, total: true, status: true,
        party: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }).catch(() => []),

    // NEW: Dispatch status grouped
    db.dispatch.groupBy({
      by: ["status"],
      _count: true,
    }).catch(() => []),
  ]);

  // Calculate low stock count from fetched products
  const lowStockCount = Array.isArray(lowStockProducts)
    ? lowStockProducts.filter((p: any) => (p.stockQty ?? 0) <= (p.reorderLevel ?? 100)).length
    : 0;

  // Build real monthly revenue trend for last 6 months
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleString("en-IN", { month: "short" }) };
  });

  const monthlyTrendRaw = await Promise.all(
    months.map(m =>
      db.invoice.aggregate({
        where: {
          date: {
            gte: new Date(m.year, m.month, 1),
            lt:  new Date(m.year, m.month + 1, 1),
          },
          status: { not: "CANCELLED" },
        },
        _sum: { total: true },
        _count: true,
      }).catch(() => ({ _sum: { total: 0 }, _count: 0 }))
    )
  );

  const monthlyTrend = months.map((m, i) => ({
    month: m.label,
    revenue: (monthlyTrendRaw[i] as any)._sum?.total ?? 0,
    invoices: (monthlyTrendRaw[i] as any)._count ?? 0,
  }));

  // Revenue target projection
  const daysElapsed = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const actualMonthRevenue = (monthSales as any)._sum?.total ?? 0;
  const projectedMonthRevenue = daysElapsed > 0
    ? Math.round((actualMonthRevenue / daysElapsed) * daysInMonth)
    : 0;

  // Enrich team performance with user names
  const teamPerformanceEnriched = await Promise.all(
    (teamPerformanceRaw as any[]).map(async (row: any) => {
      const u = await db.user.findUnique({
        where: { id: row.createdById },
        select: { name: true },
      }).catch(() => null);
      return { userId: row.createdById, name: u?.name ?? "Unknown", quotesCount: row._count };
    })
  );

  // Enrich customer risks with party names
  const customerRisksEnriched = await Promise.all(
    (customerRisksRaw as any[]).map(async (row: any) => {
      const p = await db.party.findUnique({
        where: { id: row.partyId },
        select: { name: true },
      }).catch(() => null);
      return {
        partyId: row.partyId,
        partyName: p?.name ?? "Unknown",
        overdueCount: row._count,
        totalOverdue: row._sum?.balanceDue ?? 0,
      };
    })
  );

  // Dispatch status map
  const dispatchStatus: Record<string, number> = {
    READY: 0, DISPATCHED: 0, IN_TRANSIT: 0, DELIVERED: 0,
  };
  (dispatchStatusRaw as any[]).forEach((row: any) => {
    dispatchStatus[row.status] = row._count ?? 0;
  });

  return ok({
    kpis: {
      todayRevenue:             (todaySales as any)._sum?.total ?? 0,
      monthRevenue:             (monthSales as any)._sum?.total ?? 0,
      yearRevenue:              (yearSales as any)._sum?.total ?? 0,
      totalLeads,
      newLeads,
      hotLeads,
      openQuotes,
      pendingOrders,
      outstandingReceivables:   (outstandingReceivables as any)._sum?.balanceDue ?? 0,
      outstandingPayables:      (outstandingPayables as any)._sum?.total ?? 0,
      lowStockCount,
      totalProducts,
      totalEmployees,
      pendingDispatches,
      followUpsToday,
      overdueInvoiceCount: (overdueInvoices as any)._count ?? 0,
      overdueAmount: (overdueInvoices as any)._sum?.balanceDue ?? 0,
      openTasks: openTasksCount,
      pendingFollowUps: pendingFollowUpsCount,
    },
    monthlyTrend,
    topProducts,
    topCustomers,
    recentActivities,
    quoteFunnel,
    // NEW
    upcomingFollowUps,
    pendingApprovals,
    recentOrders,
    dispatchStatus,
    customerRisks: customerRisksEnriched,
    teamPerformance: teamPerformanceEnriched,
    revenueTarget: {
      projected: projectedMonthRevenue,
      actual: actualMonthRevenue,
      daysElapsed,
      daysInMonth,
    },
  });
}
