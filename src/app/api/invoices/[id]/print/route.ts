export const runtime = "nodejs";
// src/app/api/invoices/[id]/print/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, err } from "@/lib/api";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireAuth(req);
  if (response) return response;

  const { id } = await params;

  const invoice = await db.invoice.findUnique({
    where: { id },
    include: {
      party: true,
      items: true,
      payments: true,
    },
  });
  if (!invoice) return err("Invoice not found", 404);

  const settings = await db.companySettings.findUnique({ where: { id: "default" } });

  const html = generateInvoiceHtml(invoice, settings);

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Invoice-Number": invoice.number,
    },
  });
}

function generateInvoiceHtml(invoice: any, settings: any): string {
  const fmt = (n: number) =>
    `₹${(n ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  const items = invoice.items ?? [];

  // Calculate tax summary by GST rate
  const taxSummary: Record<
    number,
    { taxable: number; cgst: number; sgst: number; igst: number }
  > = {};
  for (const item of items) {
    const rate = item.gstRate ?? 18;
    if (!taxSummary[rate])
      taxSummary[rate] = { taxable: 0, cgst: 0, sgst: 0, igst: 0 };
    const taxable =
      (item.unitPrice ?? 0) *
      (item.qty ?? 0) *
      (1 - (item.discount ?? 0) / 100);
    taxSummary[rate].taxable += taxable;
    taxSummary[rate].cgst += item.cgst ?? 0;
    taxSummary[rate].sgst += item.sgst ?? 0;
    taxSummary[rate].igst += item.igst ?? 0;
  }

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${settings?.invoicePrefix ?? "INV"} - ${invoice.number}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 11px; color: #1a1a1a; background: white; }
  @page { size: A4; margin: 10mm; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  .page { max-width: 210mm; margin: 0 auto; padding: 8mm; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; border-bottom: 2px solid #0ea5a0; padding-bottom: 10px; }
  .company-name { font-size: 20px; font-weight: 900; color: #0ea5a0; letter-spacing: 2px; }
  .company-details { font-size: 10px; color: #555; margin-top: 4px; line-height: 1.5; }
  .invoice-badge { background: #0ea5a0; color: white; padding: 6px 16px; border-radius: 4px; font-size: 14px; font-weight: 700; text-align: center; }
  .invoice-meta { text-align: right; margin-top: 6px; font-size: 10px; color: #555; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 10px 0; }
  .party-box { border: 1px solid #ddd; border-radius: 4px; padding: 8px; }
  .party-label { font-size: 9px; font-weight: 700; color: #0ea5a0; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
  .party-name { font-size: 13px; font-weight: 700; color: #1a1a1a; }
  .party-detail { font-size: 10px; color: #555; line-height: 1.6; }
  table { width: 100%; border-collapse: collapse; margin: 10px 0; }
  th { background: #0ea5a0; color: white; padding: 6px 8px; text-align: left; font-size: 10px; font-weight: 700; }
  td { padding: 5px 8px; border-bottom: 1px solid #eee; font-size: 10px; vertical-align: top; }
  tr:nth-child(even) td { background: #f9f9f9; }
  .text-right { text-align: right; }
  .totals { display: flex; justify-content: flex-end; margin: 10px 0; }
  .totals-table { width: 280px; }
  .totals-table td { border: none; padding: 3px 8px; }
  .totals-table .total-row td { font-weight: 700; font-size: 13px; border-top: 2px solid #0ea5a0; padding-top: 5px; color: #0ea5a0; }
  .tax-section { background: #f0fdfb; border: 1px solid #ccf0ed; border-radius: 4px; padding: 8px; margin: 8px 0; }
  .tax-title { font-size: 10px; font-weight: 700; color: #0ea5a0; margin-bottom: 6px; }
  .bank-section { border: 1px solid #ddd; border-radius: 4px; padding: 8px; margin-top: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .section-title { font-size: 10px; font-weight: 700; color: #0ea5a0; margin-bottom: 4px; }
  .bank-detail { font-size: 10px; color: #555; line-height: 1.8; }
  .footer { text-align: center; margin-top: 15px; font-size: 9px; color: #999; border-top: 1px solid #eee; padding-top: 8px; }
  .status-badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 9px; font-weight: 700; text-transform: uppercase; }
  .status-PAID { background: #d1fae5; color: #065f46; }
  .status-OVERDUE { background: #fee2e2; color: #991b1b; }
  .status-SENT { background: #dbeafe; color: #1e40af; }
  .status-DRAFT { background: #f3f4f6; color: #6b7280; }
  .no-print { display: block; text-align: center; margin: 20px; }
  @media print { .no-print { display: none; } }
  .print-btn { background: #0ea5a0; color: white; border: none; padding: 10px 24px; border-radius: 6px; font-size: 14px; cursor: pointer; }
</style>
</head>
<body>
<div class="no-print">
  <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
  &nbsp;
  <button onclick="window.close()" style="background:#6b7280;color:white;border:none;padding:10px 24px;border-radius:6px;font-size:14px;cursor:pointer;">✕ Close</button>
</div>
<div class="page">
  <!-- Header -->
  <div class="header">
    <div>
      <div class="company-name">${settings?.name ?? "PACKPRO"}</div>
      <div class="company-details">
        ${settings?.address ?? ""}${settings?.city ? `, ${settings.city}` : ""}${settings?.state ? `, ${settings.state}` : ""}${settings?.pincode ? ` - ${settings.pincode}` : ""}<br>
        ${settings?.phone ? `📞 ${settings.phone}` : ""}${settings?.email ? ` &nbsp;|&nbsp; ✉ ${settings.email}` : ""}<br>
        ${settings?.gstin ? `GSTIN: <strong>${settings.gstin}</strong>` : ""}${settings?.pan ? ` &nbsp;|&nbsp; PAN: ${settings.pan}` : ""}
      </div>
    </div>
    <div style="text-align:right">
      <div class="invoice-badge">TAX INVOICE</div>
      <div class="invoice-meta">
        <strong>Invoice No:</strong> ${invoice.number}<br>
        <strong>Date:</strong> ${new Date(invoice.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}<br>
        <strong>Due Date:</strong> ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}<br>
        <span class="status-badge status-${invoice.status}">${invoice.status}</span>
      </div>
    </div>
  </div>

  <!-- Bill To / Payment Details -->
  <div class="parties">
    <div class="party-box">
      <div class="party-label">Bill To</div>
      <div class="party-name">${invoice.party?.name ?? "—"}</div>
      <div class="party-detail">
        ${invoice.party?.address ?? ""}${invoice.party?.city ? `, ${invoice.party.city}` : ""}${invoice.party?.state ? `, ${invoice.party.state}` : ""}<br>
        ${invoice.party?.gstin ? `GSTIN: ${invoice.party.gstin}<br>` : ""}
        ${invoice.party?.phone ? `📞 ${invoice.party.phone}` : ""}
      </div>
    </div>
    <div class="party-box">
      <div class="party-label">Payment Details</div>
      <div class="party-detail">
        <strong>Invoice Amount:</strong> ${fmt(invoice.total)}<br>
        <strong>Amount Paid:</strong> ${fmt(invoice.amountPaid ?? 0)}<br>
        <strong>Balance Due:</strong> <span style="color:${(invoice.balanceDue ?? 0) > 0 ? "#dc2626" : "#059669"};font-weight:700">${fmt(invoice.balanceDue ?? 0)}</span>
      </div>
    </div>
  </div>

  <!-- Line Items -->
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Description</th>
        <th>HSN</th>
        <th>Qty</th>
        <th>Unit</th>
        <th class="text-right">Rate</th>
        <th class="text-right">Disc%</th>
        <th class="text-right">Taxable</th>
        <th class="text-right">GST%</th>
        <th class="text-right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${items
        .map((item: any, i: number) => {
          const taxable =
            (item.unitPrice ?? 0) *
            (item.qty ?? 0) *
            (1 - (item.discount ?? 0) / 100);
          return `<tr>
          <td>${i + 1}</td>
          <td><strong>${item.description ?? item.product?.name ?? "—"}</strong></td>
          <td>${item.hsn ?? item.product?.hsnCode ?? "—"}</td>
          <td class="text-right">${item.qty ?? 0}</td>
          <td>${item.unit ?? "pcs"}</td>
          <td class="text-right">${fmt(item.unitPrice ?? 0)}</td>
          <td class="text-right">${item.discount ?? 0}%</td>
          <td class="text-right">${fmt(taxable)}</td>
          <td class="text-right">${item.gstRate ?? 18}%</td>
          <td class="text-right"><strong>${fmt(item.total ?? 0)}</strong></td>
        </tr>`;
        })
        .join("")}
    </tbody>
  </table>

  <!-- Tax Summary + Totals -->
  <div style="display:grid;grid-template-columns:1fr auto;gap:10px;align-items:start">
    <div class="tax-section">
      <div class="tax-title">GST Summary</div>
      <table style="margin:0">
        <thead>
          <tr>
            <th>GST Rate</th>
            <th class="text-right">Taxable</th>
            <th class="text-right">CGST</th>
            <th class="text-right">SGST</th>
            <th class="text-right">IGST</th>
            <th class="text-right">Total Tax</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(taxSummary)
            .map(
              ([rate, t]: [string, any]) => `
          <tr>
            <td>${rate}%</td>
            <td class="text-right">${fmt(t.taxable)}</td>
            <td class="text-right">${fmt(t.cgst)}</td>
            <td class="text-right">${fmt(t.sgst)}</td>
            <td class="text-right">${fmt(t.igst)}</td>
            <td class="text-right"><strong>${fmt(t.cgst + t.sgst + t.igst)}</strong></td>
          </tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>
    <div>
      <table class="totals-table">
        <tr><td>Subtotal</td><td class="text-right">${fmt(invoice.subtotal ?? 0)}</td></tr>
        ${(invoice.discount ?? 0) > 0 ? `<tr><td>Discount</td><td class="text-right" style="color:#dc2626">- ${fmt(invoice.discount)}</td></tr>` : ""}
        <tr><td>Tax Amount</td><td class="text-right">${fmt(invoice.taxAmount ?? 0)}</td></tr>
        <tr class="total-row"><td>GRAND TOTAL</td><td class="text-right">${fmt(invoice.total ?? 0)}</td></tr>
        ${(invoice.amountPaid ?? 0) > 0 ? `<tr><td>Amount Paid</td><td class="text-right" style="color:#059669">- ${fmt(invoice.amountPaid)}</td></tr>` : ""}
        ${(invoice.balanceDue ?? 0) > 0 ? `<tr style="color:#dc2626"><td><strong>Balance Due</strong></td><td class="text-right"><strong>${fmt(invoice.balanceDue)}</strong></td></tr>` : ""}
      </table>
    </div>
  </div>

  <!-- Bank Details + Terms -->
  <div class="bank-section">
    <div>
      <div class="section-title">Bank Details</div>
      <div class="bank-detail">
        ${settings?.bankName ? `Bank: <strong>${settings.bankName}</strong><br>` : ""}
        ${settings?.bankAccount ? `A/C No: <strong>${settings.bankAccount}</strong><br>` : ""}
        ${settings?.bankIfsc ? `IFSC: <strong>${settings.bankIfsc}</strong><br>` : ""}
        ${settings?.bankBranch ? `Branch: ${settings.bankBranch}` : ""}
      </div>
    </div>
    <div>
      <div class="section-title">Terms &amp; Conditions</div>
      <div class="bank-detail" style="white-space:pre-line">
        ${invoice.terms ?? "1. Goods once sold will not be taken back.\n2. Subject to local jurisdiction only.\n3. E. &amp; O. E."}
      </div>
    </div>
  </div>

  <!-- Payments Made -->
  ${
    (invoice.payments?.length ?? 0) > 0
      ? `
  <div style="margin-top:10px">
    <div class="section-title">Payments Received</div>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Method</th>
          <th>Reference</th>
          <th class="text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.payments
          .map(
            (p: any) => `<tr>
          <td>${new Date(p.date).toLocaleDateString("en-IN")}</td>
          <td>${p.method}</td>
          <td>${p.reference ?? "—"}</td>
          <td class="text-right">${fmt(p.amount)}</td>
        </tr>`
          )
          .join("")}
      </tbody>
    </table>
  </div>`
      : ""
  }

  <div class="footer">
    This is a computer-generated invoice and does not require a physical signature. &nbsp;|&nbsp;
    ${settings?.name ?? "PACKPRO"} &nbsp;|&nbsp; ${settings?.website ?? ""}
  </div>
</div>
</body>
</html>`;
}
