export const runtime = "nodejs";
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

  const quote = await db.quote.findUnique({
    where: { id },
    include: {
      party: true,
      createdBy: { select: { name: true } },
      items: { include: { product: { select: { name: true, hsnCode: true } } } },
    },
  });
  if (!quote) return err("Quote not found", 404);

  const settings = await db.companySettings.findUnique({ where: { id: "default" } });

  const html = generateQuoteHtml(quote, settings);

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Quote-Number": quote.number,
    },
  });
}

function generateQuoteHtml(quote: any, settings: any): string {
  const fmt = (n: number) =>
    `₹${(n ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  const items = quote.items ?? [];

  // Tax summary by GST rate
  const taxSummary: Record<number, { taxable: number; cgst: number; sgst: number }> = {};
  for (const item of items) {
    const rate = item.gstRate ?? 18;
    const taxable = item.unitPrice * item.qty * (1 - (item.discount ?? 0) / 100);
    const half = (taxable * rate) / 200;
    if (!taxSummary[rate]) taxSummary[rate] = { taxable: 0, cgst: 0, sgst: 0 };
    taxSummary[rate].taxable += taxable;
    taxSummary[rate].cgst += half;
    taxSummary[rate].sgst += half;
  }

  const co = settings ?? {};
  const party = quote.party ?? {};
  const validTill = quote.validTill
    ? new Date(quote.validTill).toLocaleDateString("en-IN")
    : "—";
  const createdAt = new Date(quote.createdAt).toLocaleDateString("en-IN");
  const statusColor = quote.status === "APPROVED" ? "#16a34a" : quote.status === "REJECTED" ? "#dc2626" : "#0ea5a0";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Quotation ${quote.number}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #1a1a1a; background: #fff; }
  .page { max-width: 800px; margin: 0 auto; padding: 32px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 3px solid #0ea5a0; }
  .brand { font-size: 22px; font-weight: 900; color: #0ea5a0; letter-spacing: 2px; }
  .brand-sub { font-size: 10px; color: #666; margin-top: 2px; }
  .doc-title { text-align: right; }
  .doc-title h1 { font-size: 26px; font-weight: 900; color: #1a1a1a; }
  .doc-number { font-size: 14px; color: #0ea5a0; font-weight: 700; margin-top: 4px; }
  .status-badge { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; letter-spacing: 1px; color: #fff; background: ${statusColor}; margin-top: 6px; }
  .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
  .meta-box { background: #f8f9fa; border-radius: 8px; padding: 14px; }
  .meta-box h3 { font-size: 9px; font-weight: 700; color: #888; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 8px; }
  .meta-box p { font-size: 12px; color: #333; line-height: 1.6; }
  .meta-box .name { font-weight: 700; font-size: 13px; color: #1a1a1a; }
  .dates { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 24px; }
  .date-item { text-align: center; background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; padding: 10px; }
  .date-label { font-size: 9px; color: #0ea5a0; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
  .date-val { font-size: 13px; font-weight: 700; color: #1a1a1a; margin-top: 3px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th { background: #0ea5a0; color: #fff; font-size: 10px; font-weight: 700; padding: 8px 10px; text-align: left; letter-spacing: 0.5px; }
  td { padding: 8px 10px; font-size: 11px; border-bottom: 1px solid #e5e7eb; }
  tr:nth-child(even) td { background: #fafafa; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; }
  .totals { display: flex; justify-content: flex-end; margin-bottom: 20px; }
  .totals-table { width: 260px; }
  .totals-table tr td { padding: 5px 10px; border-bottom: none; }
  .totals-table .grand { background: #0ea5a0; color: #fff; font-weight: 900; font-size: 14px; border-radius: 4px; }
  .tax-section { margin-bottom: 20px; }
  .tax-section h3 { font-size: 10px; font-weight: 700; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
  .tax-table th { background: #f3f4f6; color: #555; font-size: 9px; }
  .tax-table td { font-size: 10px; }
  .notes { margin-bottom: 20px; }
  .notes h3 { font-size: 10px; font-weight: 700; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
  .notes p { font-size: 11px; color: #555; line-height: 1.6; white-space: pre-line; }
  .footer { border-top: 2px solid #e5e7eb; padding-top: 16px; display: flex; justify-content: space-between; align-items: flex-end; }
  .footer-left { font-size: 10px; color: #888; }
  .sig-line { border-top: 1px solid #ccc; width: 150px; margin-top: 36px; text-align: center; font-size: 9px; color: #888; padding-top: 4px; }
  .print-bar { background: #0ea5a0; color: #fff; padding: 10px 24px; text-align: center; font-size: 13px; font-weight: 600; cursor: pointer; border: none; width: 100%; border-radius: 0; }
  @media print {
    .no-print { display: none !important; }
    .page { padding: 16px; }
    body { font-size: 11px; }
  }
</style>
</head>
<body>
<div class="no-print" style="background:#f0fdfa;padding:10px;display:flex;gap:10px;justify-content:center">
  <button class="print-bar" style="width:auto;border-radius:6px" onclick="window.print()">🖨️ Print / Save as PDF</button>
  <button class="print-bar" style="width:auto;border-radius:6px;background:#6b7280" onclick="window.close()">✕ Close</button>
</div>
<div class="page">
  <div class="header">
    <div>
      <div class="brand">${co.name ?? "PACKPRO"}</div>
      <div class="brand-sub">${co.address ?? ""}</div>
      ${co.gstin ? `<div class="brand-sub">GSTIN: ${co.gstin}</div>` : ""}
      ${co.phone ? `<div class="brand-sub">📞 ${co.phone}</div>` : ""}
      ${co.email ? `<div class="brand-sub">✉️ ${co.email}</div>` : ""}
    </div>
    <div class="doc-title">
      <h1>QUOTATION</h1>
      <div class="doc-number"># ${quote.number}</div>
      <span class="status-badge">${quote.status}</span>
    </div>
  </div>

  <div class="dates">
    <div class="date-item">
      <div class="date-label">Date</div>
      <div class="date-val">${createdAt}</div>
    </div>
    <div class="date-item">
      <div class="date-label">Valid Till</div>
      <div class="date-val">${validTill}</div>
    </div>
    <div class="date-item">
      <div class="date-label">Prepared By</div>
      <div class="date-val">${quote.createdBy?.name ?? "—"}</div>
    </div>
  </div>

  <div class="meta">
    <div class="meta-box">
      <h3>Quotation To</h3>
      <p class="name">${party.name ?? "—"}</p>
      ${party.gstin ? `<p>GSTIN: ${party.gstin}</p>` : ""}
      ${party.address ? `<p>${party.address}</p>` : ""}
      ${party.city ? `<p>${party.city}${party.state ? ", " + party.state : ""}</p>` : ""}
      ${party.phone ? `<p>📞 ${party.phone}</p>` : ""}
      ${party.email ? `<p>✉️ ${party.email}</p>` : ""}
    </div>
    <div class="meta-box">
      <h3>From</h3>
      <p class="name">${co.name ?? "PACKPRO"}</p>
      ${co.gstin ? `<p>GSTIN: ${co.gstin}</p>` : ""}
      ${co.address ? `<p>${co.address}</p>` : ""}
      ${co.website ? `<p>🌐 ${co.website}</p>` : ""}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Description</th>
        <th>HSN</th>
        <th class="num">Qty</th>
        <th>Unit</th>
        <th class="num">Unit Price</th>
        <th class="num">GST%</th>
        <th class="num">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${items.map((item: any, i: number) => `
        <tr>
          <td>${i + 1}</td>
          <td>${item.description ?? item.product?.name ?? "—"}</td>
          <td>${item.product?.hsnCode ?? "—"}</td>
          <td class="num">${item.qty}</td>
          <td>${item.unit}</td>
          <td class="num">${fmt(item.unitPrice)}</td>
          <td class="num">${item.gstRate}%</td>
          <td class="num">${fmt(item.total)}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  ${Object.keys(taxSummary).length > 0 ? `
  <div class="tax-section">
    <h3>Tax Summary</h3>
    <table class="tax-table">
      <thead>
        <tr><th>GST Rate</th><th class="num">Taxable</th><th class="num">CGST</th><th class="num">SGST</th><th class="num">Total Tax</th></tr>
      </thead>
      <tbody>
        ${Object.entries(taxSummary).map(([rate, t]) => `
          <tr>
            <td>${rate}%</td>
            <td class="num">${fmt(t.taxable)}</td>
            <td class="num">${fmt(t.cgst)} (${Number(rate) / 2}%)</td>
            <td class="num">${fmt(t.sgst)} (${Number(rate) / 2}%)</td>
            <td class="num">${fmt(t.cgst + t.sgst)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  </div>
  ` : ""}

  <div class="totals">
    <table class="totals-table">
      <tr><td>Subtotal</td><td class="num">${fmt(quote.subtotal)}</td></tr>
      ${quote.discount > 0 ? `<tr><td>Discount</td><td class="num">− ${fmt(quote.discount)}</td></tr>` : ""}
      <tr><td>Tax</td><td class="num">${fmt(quote.taxAmount)}</td></tr>
      <tr class="grand"><td>Total</td><td class="num">${fmt(quote.total)}</td></tr>
    </table>
  </div>

  ${quote.notes ? `
  <div class="notes">
    <h3>Notes</h3>
    <p>${quote.notes}</p>
  </div>
  ` : ""}

  ${quote.terms ? `
  <div class="notes">
    <h3>Terms &amp; Conditions</h3>
    <p>${quote.terms}</p>
  </div>
  ` : ""}

  <div class="footer">
    <div class="footer-left">
      <p>${co.name ?? "PACKPRO"} · ${co.address ?? ""}</p>
      <p style="margin-top:4px">This is a computer-generated quotation.</p>
      <p style="margin-top:2px;color:#0ea5a0;font-weight:700">Valid till ${validTill}</p>
    </div>
    <div class="sig-line">Authorised Signatory</div>
  </div>
</div>
</body>
</html>`;
}
