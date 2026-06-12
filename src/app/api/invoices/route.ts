// src/app/api/invoices/route.ts
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, created, requireAuth, paginate, paginatedResponse, logAction } from "@/lib/api";
import { generateInvoiceNumber, calculateGST } from "@/lib/utils";
import { z } from "zod";

const InvoiceItemSchema = z.object({
  productId: z.string().optional(),
  description: z.string(),
  hsn: z.string().optional(),
  qty: z.number().positive(),
  unit: z.string().default("pcs"),
  unitPrice: z.number().positive(),
  discount: z.number().default(0),
  gstRate: z.number().default(18),
  isInterState: z.boolean().default(false),
});

const InvoiceSchema = z.object({
  partyId: z.string(),
  salesOrderId: z.string().optional(),
  type: z.enum(["PROFORMA","TAX_INVOICE","CREDIT_NOTE","DEBIT_NOTE"]).default("TAX_INVOICE"),
  date: z.string().optional(),
  dueDate: z.string(),
  items: z.array(InvoiceItemSchema).min(1),
  discount: z.number().default(0),
  notes: z.string().optional(),
  terms: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 20);
  const status = searchParams.get("status") ?? "";

  const where: any = {};
  if (status) where.status = status;

  const { skip, take } = paginate(page, limit);
  const [data, total] = await Promise.all([
    db.invoice.findMany({
      where,
      skip,
      take,
      include: {
        party: { select: { id: true, name: true, gstin: true, address: true, city: true } },
        items: true,
        payments: true,
        _count: { select: { payments: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.invoice.count({ where }),
  ]);

  return ok(paginatedResponse(data, total, page, limit));
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  const body = await req.json();
  const parsed = InvoiceSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.message);

  const settings = await db.companySettings.findUnique({ where: { id: "default" } });
  const number = generateInvoiceNumber("INV", settings?.invoiceCounter ?? 1);

  let subtotal = 0;
  let totalTax = 0;
  const processedItems = parsed.data.items.map((item) => {
    const base = item.qty * item.unitPrice - item.discount;
    const gst = calculateGST(base, item.gstRate, item.isInterState);
    subtotal += base;
    totalTax += gst.total;
    return {
      productId: item.productId,
      description: item.description,
      hsn: item.hsn,
      qty: item.qty,
      unit: item.unit,
      unitPrice: item.unitPrice,
      discount: item.discount,
      gstRate: item.gstRate,
      cgst: gst.cgst,
      sgst: gst.sgst,
      igst: gst.igst,
      total: base + gst.total,
    };
  });

  const total = subtotal + totalTax - (parsed.data.discount ?? 0);

  const invoice = await db.invoice.create({
    data: {
      number,
      partyId: parsed.data.partyId,
      salesOrderId: parsed.data.salesOrderId,
      type: parsed.data.type,
      date: parsed.data.date ? new Date(parsed.data.date) : new Date(),
      dueDate: new Date(parsed.data.dueDate),
      subtotal,
      discount: parsed.data.discount ?? 0,
      taxAmount: totalTax,
      total,
      balanceDue: total,
      notes: parsed.data.notes,
      terms: parsed.data.terms,
      items: { create: processedItems },
    },
    include: { party: true, items: true },
  });

  await db.companySettings.update({
    where: { id: "default" },
    data: { invoiceCounter: { increment: 1 } },
  });

  await logAction(user!.id, "CREATE", "INVOICE", invoice.id, null, { number, total });
  return created(invoice);
}
