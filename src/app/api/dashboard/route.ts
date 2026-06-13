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
    // Use findMany + filter to avoid the invalid db.product.fields.reorderLevel pattern
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
    },
    monthlyTrend,
    topProducts,
    topCustomers,
    recentActivities,
    quoteFunnel,
  });
}
