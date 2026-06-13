export const runtime = "nodejs";
// src/app/api/ai/insights/route.ts
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, requireAuth } from "@/lib/api";

export async function GET(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [
    // Leads
    leadsByStatus,
    orphanedLeads,
    urgentUncontactedLeads,
    // Quotes
    overdueQuotes,
    draftHighValueQuotes,
    // Invoices
    overdueInvoices,
    dueSoonInvoices,
    // Products
    allPublishedProducts,
    noRecentPurchaseProducts,
    // Sales orders
    stuckOrders,
    // Revenue data
    thisMonthRevenue,
    lastMonthRevenue,
    totalInvoiceRevenue,
    totalInvoiceCount,
    totalLeadValue,
    wonLeadCount,
    totalLeadCount,
  ] = await Promise.all([
    // Leads by status
    db.lead.groupBy({ by: ["status"], _count: true }).catch(() => []),

    // Orphaned leads: no activity in 7+ days, not WON/LOST
    db.lead.count({
      where: {
        status: { notIn: ["WON", "LOST"] },
        activities: { none: { createdAt: { gte: sevenDaysAgo } } },
        createdAt: { lte: sevenDaysAgo },
      },
    }).catch(() => 0),

    // Urgent priority leads not yet CONTACTED
    db.lead.count({
      where: { priority: "URGENT", status: { in: ["NEW"] } },
    }).catch(() => 0),

    // Overdue quotes (validTill < now, not accepted/rejected)
    db.quote.count({
      where: {
        validTill: { lt: now },
        status: { in: ["DRAFT", "SENT", "VIEWED"] },
      },
    }).catch(() => 0),

    // High-value draft quotes (total > 50000)
    db.quote.count({
      where: { status: "DRAFT", total: { gt: 50000 } },
    }).catch(() => 0),

    // Overdue invoices
    db.invoice.aggregate({
      where: { status: "OVERDUE" },
      _count: true,
      _sum: { balanceDue: true },
    }).catch(() => ({ _count: 0, _sum: { balanceDue: 0 } })),

    // Invoices due soon (next 7 days)
    db.invoice.count({
      where: {
        dueDate: { gte: now, lte: sevenDaysFromNow },
        status: { in: ["SENT", "VIEWED", "PARTIALLY_PAID"] },
      },
    }).catch(() => 0),

    // All published products (to calculate low stock)
    db.product.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, stockQty: true, reorderLevel: true },
    }).catch(() => [] as any[]),

    // Products with no stock movements in 30 days (via inventory transactions)
    db.product.count({
      where: {
        status: "PUBLISHED",
        inventoryTxns: { none: { createdAt: { gte: thirtyDaysAgo } } },
      },
    }).catch(() => 0),

    // Orders stuck in CONFIRMED for 3+ days
    db.salesOrder.count({
      where: {
        status: "CONFIRMED",
        createdAt: { lte: threeDaysAgo },
      },
    }).catch(() => 0),

    // This month revenue
    db.invoice.aggregate({
      where: { date: { gte: startOfMonth }, status: { not: "CANCELLED" } },
      _sum: { total: true },
    }).catch(() => ({ _sum: { total: 0 } })),

    // Last month revenue
    db.invoice.aggregate({
      where: {
        date: { gte: startOfLastMonth, lte: endOfLastMonth },
        status: { not: "CANCELLED" },
      },
      _sum: { total: true },
    }).catch(() => ({ _sum: { total: 0 } })),

    // Total invoice revenue (all time)
    db.invoice.aggregate({
      where: { status: { not: "CANCELLED" } },
      _sum: { total: true },
      _count: true,
    }).catch(() => ({ _sum: { total: 0 }, _count: 0 })),

    // Total invoice count
    db.invoice.count({ where: { status: { not: "CANCELLED" } } }).catch(() => 0),

    // Total lead value
    db.lead.aggregate({ _sum: { value: true } }).catch(() => ({ _sum: { value: 0 } })),

    // WON leads
    db.lead.count({ where: { status: "WON" } }).catch(() => 0),

    // Total leads
    db.lead.count().catch(() => 0),
  ]);

  // Calculate low stock count
  const lowStockProducts = Array.isArray(allPublishedProducts)
    ? allPublishedProducts.filter((p: any) => (p.stockQty ?? 0) <= (p.reorderLevel ?? 100)).length
    : 0;

  // Build insights
  type InsightType = "URGENT" | "WARNING" | "OPPORTUNITY" | "INFO";
  type InsightCategory = "CRM" | "SALES" | "FINANCE" | "INVENTORY" | "OPERATIONS";

  interface Insight {
    type: InsightType;
    category: InsightCategory;
    title: string;
    message: string;
    action: string;
    link: string;
    value?: number;
  }

  const insights: Insight[] = [];

  // CRM insights
  if ((orphanedLeads as number) > 0) {
    insights.push({
      type: "URGENT",
      category: "CRM",
      title: `${orphanedLeads} leads have no activity in 7+ days`,
      message: `${orphanedLeads} active leads haven't been touched in over a week. They may go cold.`,
      action: "Contact them today",
      link: "/admin/crm",
      value: orphanedLeads as number,
    });
  }

  if ((urgentUncontactedLeads as number) > 0) {
    insights.push({
      type: "URGENT",
      category: "CRM",
      title: `${urgentUncontactedLeads} urgent leads not yet contacted`,
      message: `${urgentUncontactedLeads} leads marked URGENT are still in NEW status.`,
      action: "Call them now",
      link: "/admin/crm",
      value: urgentUncontactedLeads as number,
    });
  }

  // Finance insights
  const overdueCount = (overdueInvoices as any)._count ?? 0;
  const overdueAmount = (overdueInvoices as any)._sum?.balanceDue ?? 0;
  if (overdueCount > 0) {
    insights.push({
      type: "URGENT",
      category: "FINANCE",
      title: `${overdueCount} overdue invoices totaling ₹${Math.round(overdueAmount).toLocaleString("en-IN")}`,
      message: `You have ${overdueCount} overdue invoices with ₹${Math.round(overdueAmount).toLocaleString("en-IN")} pending collection.`,
      action: "Send payment reminders",
      link: "/admin/invoices",
      value: overdueAmount,
    });
  }

  if ((dueSoonInvoices as number) > 0) {
    insights.push({
      type: "WARNING",
      category: "FINANCE",
      title: `${dueSoonInvoices} invoices due in next 7 days`,
      message: `${dueSoonInvoices} invoices will become overdue within a week if not paid.`,
      action: "Follow up with customers",
      link: "/admin/invoices",
      value: dueSoonInvoices as number,
    });
  }

  // Inventory insights
  if (lowStockProducts > 0) {
    insights.push({
      type: "WARNING",
      category: "INVENTORY",
      title: `${lowStockProducts} products below reorder level`,
      message: `${lowStockProducts} products have stock at or below their reorder point and need replenishment.`,
      action: "Create purchase orders",
      link: "/admin/inventory",
      value: lowStockProducts,
    });
  }

  if ((noRecentPurchaseProducts as number) > 0) {
    insights.push({
      type: "INFO",
      category: "INVENTORY",
      title: `${noRecentPurchaseProducts} products not purchased in 30 days`,
      message: `These products haven't been restocked in a month — review if they are still needed.`,
      action: "Review inventory",
      link: "/admin/inventory",
      value: noRecentPurchaseProducts as number,
    });
  }

  // Sales insights
  if ((draftHighValueQuotes as number) > 0) {
    insights.push({
      type: "OPPORTUNITY",
      category: "SALES",
      title: `${draftHighValueQuotes} high-value quotes stuck in draft`,
      message: `${draftHighValueQuotes} quotes worth over ₹50,000 each are still in DRAFT status.`,
      action: "Send for approval now",
      link: "/admin/quotes",
      value: draftHighValueQuotes as number,
    });
  }

  if ((overdueQuotes as number) > 0) {
    insights.push({
      type: "WARNING",
      category: "SALES",
      title: `${overdueQuotes} quotes have expired`,
      message: `${overdueQuotes} quotes have passed their validity date and need renewal or follow-up.`,
      action: "Renew or close expired quotes",
      link: "/admin/quotes",
      value: overdueQuotes as number,
    });
  }

  // Operations insights
  if ((stuckOrders as number) > 0) {
    insights.push({
      type: "WARNING",
      category: "OPERATIONS",
      title: `${stuckOrders} orders stuck in CONFIRMED for 3+ days`,
      message: `${stuckOrders} sales orders haven't moved to processing despite being confirmed days ago.`,
      action: "Move to processing",
      link: "/admin/sales-orders",
      value: stuckOrders as number,
    });
  }

  // Sort: URGENT → WARNING → OPPORTUNITY → INFO
  const sortOrder: Record<InsightType, number> = {
    URGENT: 0, WARNING: 1, OPPORTUNITY: 2, INFO: 3,
  };
  insights.sort((a, b) => sortOrder[a.type] - sortOrder[b.type]);

  // Forecast
  const thisMonthActual = (thisMonthRevenue as any)._sum?.total ?? 0;
  const lastMonthActual = (lastMonthRevenue as any)._sum?.total ?? 0;
  const daysElapsed = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const thisMonthProjected = daysElapsed > 0
    ? Math.round((thisMonthActual / daysElapsed) * daysInMonth)
    : 0;
  const growthRate = lastMonthActual > 0
    ? Math.round(((thisMonthProjected - lastMonthActual) / lastMonthActual) * 100)
    : 0;

  // Quick stats
  const totalRevenue = (totalInvoiceRevenue as any)._sum?.total ?? 0;
  const invoiceCount = (totalInvoiceRevenue as any)._count ?? 0;
  const leadValueSum = (totalLeadValue as any)._sum?.value ?? 0;
  const conversionRate = (totalLeadCount as number) > 0
    ? Math.round(((wonLeadCount as number) / (totalLeadCount as number)) * 100 * 10) / 10
    : 0;
  const avgDealSize = invoiceCount > 0 ? Math.round(totalRevenue / invoiceCount) : 0;

  // Recommendations (top 3 from insights)
  const recommendations = insights.slice(0, 3).map(i => ({
    title: i.title,
    action: i.action,
    link: i.link,
    type: i.type,
  }));

  return ok({
    insights: insights.slice(0, 20),
    forecast: {
      thisMonthProjected,
      lastMonthActual,
      growthRate,
    },
    quickStats: {
      totalLeadValue: leadValueSum,
      conversionRate,
      avgDealSize,
    },
    recommendations,
  });
}
