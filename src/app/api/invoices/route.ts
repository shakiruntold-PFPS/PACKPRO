export const runtime = "nodejs";
// src/app/api/invoices/route.ts
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, created, requireAuth, paginate, paginatedResponse, logAction } from "@/lib/api";
import { generateInvoiceNumber, calculateGST } from "@/lib/utils";
import { sanitizeObject } from "@/lib/sanitize";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const InvoiceItemSchema = z.object({
  productId:    z.string().optional(),
  description:  z.string().min(1).max(500),
  hsn:          z.string().max(8).optional(),
  qty:          z.number().positive().max(1_000_000),
  unit:         z.string().max(20).default("pcs"),
  unitPrice:    z.number().positive().max(10_000_000),
  discount:     z.number().min(0).default(0),
  gstRate:      z.number().min(0).max(28).default(18),
  isInterState: z.boolean().default(false),
});

const InvoiceSchema = z.object({
  partyId:     z.string().min(1),
  salesOrderId:z.string().optional(),
  type:        z.enum(["PROFORMA", "TAX_INVOICE", "CREDIT_NOTE", "DEBIT_NOTE"]).default("TAX_INVOICE"),
  date:        z.string().optional(),
  dueDate:     z.string(),
  items:       z.array(InvoiceItemSchema).min(1).max(100),
  discount:    z.number().min(0).default(0),
  notes:       z.string().max(2000).optional(),
  terms:       z.string().max(5000).optional(),
});

export async function GET(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const page   = Number(searchParams.get("page")  ?? 1);
  const limit  = Number(searchParams.get("limit") ?? 20);
  const status = searchParams.get("status") ?? "";
  const search = searchParams.get("search") ?? "";

  const where: Prisma.InvoiceWhereInput = {};
  if (status) where.status = status as Prisma.EnumInvoiceStatusFilter;
  if (search) {
    where.OR = [
      { number: { contains: search, mode: "insensitive" } },
      { party:  { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const { skip, take } = paginate(page, limit);
  const [data, total] = await Promise.all([
    db.invoice.findMany({
      where,
      skip,
      take,
      include: {
        party:    { select: { id: true, name: true, gstin: true, address: true, city: true } },
        items:    true,
        payments: true,
        _count:   { select: { payments: true } },
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

  const input = sanitizeObject(parsed.data) as typeof parsed.data;

  // Compute line-item totals before entering the transaction
  let subtotal  = 0;
  let totalTax  = 0;
  const processedItems = input.items.map((item) => {
    const base = item.qty * item.unitPrice - item.discount;
    const gst  = calculateGST(base, item.gstRate, item.isInterState);
    subtotal  += base;
    totalTax  += gst.total;
    return {
      productId:   item.productId,
      description: item.description,
      hsn:         item.hsn,
      qty:         item.qty,
      unit:        item.unit,
      unitPrice:   item.unitPrice,
      discount:    item.discount,
      gstRate:     item.gstRate,
      cgst:        gst.cgst,
      sgst:        gst.sgst,
      igst:        gst.igst,
      total:       base + gst.total,
    };
  });

  const total = subtotal + totalTax - (input.discount ?? 0);

  // Atomic transaction: increment counter and create invoice in one round-trip.
  // Prisma's SELECT … FOR UPDATE ensures no two concurrent requests get the same number.
  const invoice = await db.$transaction(async (tx) => {
    const settings = await tx.companySettings.update({
      where: { id: "default" },
      data:  { invoiceCounter: { increment: 1 } },
      select: { invoiceCounter: true, invoicePrefix: true },
    });

    // invoiceCounter is the value AFTER increment — use (counter - 1) as the sequence
    const number = generateInvoiceNumber(
      settings.invoicePrefix ?? "INV",
      settings.invoiceCounter - 1
    );

    return tx.invoice.create({
      data: {
        number,
        partyId:     input.partyId,
        salesOrderId:input.salesOrderId,
        type:        input.type,
        date:        input.date ? new Date(input.date) : new Date(),
        dueDate:     new Date(input.dueDate),
        subtotal,
        discount:    input.discount ?? 0,
        taxAmount:   totalTax,
        total,
        balanceDue:  total,
        notes:       input.notes,
        terms:       input.terms,
        items:       { create: processedItems },
      },
      include: { party: true, items: true },
    });
  });

  await logAction(user.id, "CREATE", "INVOICE", invoice.id, null, {
    number: invoice.number,
    total,
  });

  return created(invoice);
}
