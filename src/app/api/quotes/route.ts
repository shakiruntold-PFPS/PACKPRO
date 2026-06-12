// src/app/api/quotes/route.ts
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, created, requireAuth, paginate, paginatedResponse, logAction } from "@/lib/api";
import { generateInvoiceNumber } from "@/lib/utils";
import { z } from "zod";

const QuoteItemSchema = z.object({
  productId: z.string(),
  description: z.string().optional(),
  qty: z.number().positive(),
  unit: z.string().default("pcs"),
  unitPrice: z.number().positive(),
  discount: z.number().default(0),
  gstRate: z.number().default(18),
});

const QuoteSchema = z.object({
  partyId: z.string(),
  leadId: z.string().optional(),
  validTill: z.string(),
  items: z.array(QuoteItemSchema).min(1),
  discount: z.number().default(0),
  discountType: z.enum(["flat", "percent"]).default("flat"),
  notes: z.string().optional(),
  terms: z.string().optional(),
});

function calcItems(items: any[]) {
  return items.map((item) => {
    const base = item.qty * item.unitPrice;
    const disc = item.discount ?? 0;
    const taxable = base - disc;
    const gstAmount = (taxable * item.gstRate) / 100;
    return { ...item, gstAmount, total: taxable + gstAmount };
  });
}

export async function GET(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 20);
  const status = searchParams.get("status") ?? "";
  const search = searchParams.get("search") ?? "";

  const where: any = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { number: { contains: search, mode: "insensitive" } },
      { party: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const { skip, take } = paginate(page, limit);
  const [data, total] = await Promise.all([
    db.quote.findMany({
      where,
      skip,
      take,
      include: {
        party: { select: { id: true, name: true, phone: true, email: true } },
        createdBy: { select: { id: true, name: true } },
        items: { include: { product: { select: { id: true, name: true, code: true } } } },
        _count: { select: { salesOrders: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.quote.count({ where }),
  ]);

  return ok(paginatedResponse(data, total, page, limit));
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  const body = await req.json();
  const parsed = QuoteSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.message);

  const settings = await db.companySettings.findUnique({ where: { id: "default" } });
  const counter = settings?.invoiceCounter ?? 1;
  const prefix = settings?.invoicePrefix ?? "PPQ";
  const number = generateInvoiceNumber(prefix, counter);

  const calculatedItems = calcItems(parsed.data.items);
  const subtotal = calculatedItems.reduce((s, i) => s + i.qty * i.unitPrice - i.discount, 0);
  let lineDiscount = parsed.data.discount ?? 0;
  if (parsed.data.discountType === "percent") lineDiscount = (subtotal * lineDiscount) / 100;
  const taxAmount = calculatedItems.reduce((s, i) => s + i.gstAmount, 0);
  const total = subtotal - lineDiscount + taxAmount;

  const quote = await db.quote.create({
    data: {
      number,
      partyId: parsed.data.partyId,
      leadId: parsed.data.leadId,
      createdById: user!.id,
      validTill: new Date(parsed.data.validTill),
      discount: lineDiscount,
      discountType: parsed.data.discountType,
      subtotal,
      taxAmount,
      total,
      notes: parsed.data.notes,
      terms: parsed.data.terms,
      items: {
        create: calculatedItems.map((i) => ({
          productId: i.productId,
          description: i.description,
          qty: i.qty,
          unit: i.unit,
          unitPrice: i.unitPrice,
          discount: i.discount,
          gstRate: i.gstRate,
          gstAmount: i.gstAmount,
          total: i.total,
        })),
      },
    },
    include: { party: true, items: { include: { product: true } } },
  });

  // Increment invoice counter
  await db.companySettings.update({ where: { id: "default" }, data: { invoiceCounter: counter + 1 } });
  await logAction(user!.id, "CREATE", "QUOTE", quote.id, null, { number, total });
  return created(quote);
}
