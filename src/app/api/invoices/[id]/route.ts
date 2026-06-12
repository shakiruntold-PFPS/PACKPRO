import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, requireAuth, logAction } from "@/lib/api";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const PaymentSchema = z.object({
  amount: z.number().positive(),
  method: z.enum(["CASH","CHEQUE","BANK_TRANSFER","UPI","NEFT","RTGS","IMPS","CARD"]).default("BANK_TRANSFER"),
  reference: z.string().optional(),
  date: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(_: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const invoice = await db.invoice.findUnique({
    where: { id },
    include: {
      party: true,
      items: true,
      payments: { orderBy: { date: "desc" } },
      salesOrder: { select: { number: true } },
    },
  });
  if (!invoice) return err("Invoice not found", 404);
  return ok(invoice);
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { user, response } = await requireAuth(req);
  if (response) return response;
  const { id } = await params;
  const body = await req.json();
  const old = await db.invoice.findUnique({ where: { id } });
  if (!old) return err("Invoice not found", 404);
  const updated = await db.invoice.update({ where: { id }, data: body });
  await logAction(user!.id, "UPDATE", "INVOICE", id, old, updated);
  return ok(updated);
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { user, response } = await requireAuth(req);
  if (response) return response;
  const { id } = await params;
  const body = await req.json();
  if (body.action !== "payment") return err("Unknown action");
  const parsed = PaymentSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.message);
  const invoice = await db.invoice.findUnique({ where: { id } });
  if (!invoice) return err("Invoice not found", 404);
  if (parsed.data.amount > invoice.balanceDue) return err(`Payment exceeds balance due (₹${invoice.balanceDue})`);
  const [payment] = await db.$transaction([
    db.payment.create({
      data: {
        invoiceId: id,
        amount: parsed.data.amount,
        method: parsed.data.method,
        reference: parsed.data.reference,
        date: parsed.data.date ? new Date(parsed.data.date) : new Date(),
        notes: parsed.data.notes,
      },
    }),
    db.invoice.update({
      where: { id },
      data: {
        amountPaid: { increment: parsed.data.amount },
        balanceDue: { decrement: parsed.data.amount },
        status: invoice.balanceDue - parsed.data.amount <= 0 ? "PAID" : "PARTIALLY_PAID",
      },
    }),
  ]);
  await logAction(user!.id, "PAYMENT", "INVOICE", id, null, { amount: parsed.data.amount });
  return ok(payment);
}
