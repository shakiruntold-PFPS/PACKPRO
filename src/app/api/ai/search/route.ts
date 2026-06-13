export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, requireAuth } from "@/lib/api";

export async function GET(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  const q = (req.nextUrl.searchParams.get("q") ?? "").toLowerCase().trim();

  if (!q) {
    return ok({ results: [], type: "empty", query: q });
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  let results: any[] = [];
  let type = "unknown";

  if (q.includes("overdue") && (q.includes("invoice") || q.includes("payment"))) {
    type = "overdue_invoices";
    results = await db.invoice.findMany({
      where: { status: "OVERDUE" },
      include: { party: { select: { name: true } } },
      orderBy: { dueDate: "asc" },
      take: 20,
    }).catch(() => []);
  } else if (q.includes("overdue") && q.includes("quote")) {
    type = "overdue_quotes";
    results = await db.quote.findMany({
      where: { validTill: { lt: now }, status: { in: ["DRAFT", "SENT", "VIEWED"] } },
      include: { party: { select: { name: true } } },
      orderBy: { validTill: "asc" },
      take: 20,
    }).catch(() => []);
  } else if (q.includes("overdue")) {
    type = "overdue_invoices";
    results = await db.invoice.findMany({
      where: { status: "OVERDUE" },
      include: { party: { select: { name: true } } },
      orderBy: { dueDate: "asc" },
      take: 20,
    }).catch(() => []);
  } else if (q.includes("low stock") || (q.includes("low") && q.includes("stock"))) {
    type = "low_stock_products";
    const products = await db.product.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, name: true, sku: true, stockQty: true, reorderLevel: true, unit: true },
    }).catch(() => []);
    results = products.filter((p: any) => (p.stockQty ?? 0) <= (p.reorderLevel ?? 100));
  } else if (q.includes("lead") && q.includes("today")) {
    type = "leads_today";
    results = await db.lead.findMany({
      where: { createdAt: { gte: startOfToday } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }).catch(() => []);
  } else if (q.includes("lead") && q.includes("urgent")) {
    type = "urgent_leads";
    results = await db.lead.findMany({
      where: { priority: "URGENT", status: { notIn: ["WON", "LOST"] } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }).catch(() => []);
  } else if (q.includes("lead") && q.includes("this month")) {
    type = "leads_this_month";
    results = await db.lead.findMany({
      where: { createdAt: { gte: startOfMonth } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }).catch(() => []);
  } else if (q.includes("lead")) {
    type = "leads";
    results = await db.lead.findMany({
      where: { status: { notIn: ["WON", "LOST"] } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }).catch(() => []);
  } else if (q.includes("pending order") || (q.includes("pending") && q.includes("order"))) {
    type = "pending_orders";
    results = await db.salesOrder.findMany({
      where: { status: { in: ["CONFIRMED", "PROCESSING"] } },
      include: { party: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }).catch(() => []);
  } else if (q.includes("order") && q.includes("today")) {
    type = "orders_today";
    results = await db.salesOrder.findMany({
      where: { createdAt: { gte: startOfToday } },
      include: { party: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }).catch(() => []);
  } else if (q.includes("quote") && q.includes("this month")) {
    type = "quotes_this_month";
    results = await db.quote.findMany({
      where: { createdAt: { gte: startOfMonth } },
      include: { party: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }).catch(() => []);
  } else if (q.includes("quote") && q.includes("today")) {
    type = "quotes_today";
    results = await db.quote.findMany({
      where: { createdAt: { gte: startOfToday } },
      include: { party: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }).catch(() => []);
  } else if (q.includes("quote") && q.includes("pending")) {
    type = "pending_quotes";
    results = await db.quote.findMany({
      where: { status: { in: ["DRAFT", "SENT", "VIEWED"] } },
      include: { party: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }).catch(() => []);
  } else if (q.includes("quote")) {
    type = "quotes";
    results = await db.quote.findMany({
      where: { status: { in: ["DRAFT", "SENT", "VIEWED"] } },
      include: { party: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }).catch(() => []);
  } else if (q.includes("invoice") && q.includes("today")) {
    type = "invoices_today";
    results = await db.invoice.findMany({
      where: { date: { gte: startOfToday } },
      include: { party: { select: { name: true } } },
      orderBy: { date: "desc" },
      take: 20,
    }).catch(() => []);
  } else if (q.includes("invoice") && q.includes("this month")) {
    type = "invoices_this_month";
    results = await db.invoice.findMany({
      where: { date: { gte: startOfMonth } },
      include: { party: { select: { name: true } } },
      orderBy: { date: "desc" },
      take: 20,
    }).catch(() => []);
  } else if (q.includes("invoice") && q.includes("pending")) {
    type = "pending_invoices";
    results = await db.invoice.findMany({
      where: { status: { in: ["SENT", "VIEWED", "PARTIALLY_PAID"] } },
      include: { party: { select: { name: true } } },
      orderBy: { date: "desc" },
      take: 20,
    }).catch(() => []);
  } else if (q.includes("urgent")) {
    type = "urgent_leads";
    results = await db.lead.findMany({
      where: { priority: "URGENT", status: { notIn: ["WON", "LOST"] } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }).catch(() => []);
  } else if (q.includes("today")) {
    type = "today_activity";
    results = await db.lead.findMany({
      where: { createdAt: { gte: startOfToday } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }).catch(() => []);
  } else if (q.includes("this month")) {
    type = "this_month_invoices";
    results = await db.invoice.findMany({
      where: { date: { gte: startOfMonth }, status: { not: "CANCELLED" } },
      include: { party: { select: { name: true } } },
      orderBy: { date: "desc" },
      take: 20,
    }).catch(() => []);
  } else if (q.includes("pending")) {
    type = "pending_orders";
    results = await db.salesOrder.findMany({
      where: { status: { in: ["CONFIRMED", "PROCESSING"] } },
      include: { party: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }).catch(() => []);
  } else {
    // Generic fallback: search leads and parties by name
    type = "search_results";
    const [leads, parties] = await Promise.all([
      db.lead.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { contactName: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 10,
      }).catch(() => []),
      db.party.findMany({
        where: { name: { contains: q, mode: "insensitive" } },
        take: 10,
      }).catch(() => []),
    ]);
    results = [...leads, ...parties];
  }

  return ok({ results, type, query: q, count: results.length });
}
