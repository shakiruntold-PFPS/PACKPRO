// src/lib/email.ts
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT ?? "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://packpro.site";
const TEAL = "#0ea5a0";

// ─── Shared layout ────────────────────────────────────────────────────────────

function wrapHtml(title: string, body: string, companyName = "PACKPRO"): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:30px 0;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:${TEAL};padding:24px 32px;">
            <span style="font-size:24px;font-weight:900;color:#ffffff;letter-spacing:3px;">${companyName}</span>
            <span style="display:block;font-size:11px;color:rgba(255,255,255,0.75);margin-top:2px;letter-spacing:1px;">FOOD PACKAGING SOLUTIONS</span>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            ${body}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;text-align:center;">
            <span style="font-size:11px;color:#9ca3af;">
              This email was sent by ${companyName}. If you have questions, reply to this email or call us.<br>
              &copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.
            </span>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

function primaryButton(text: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;background:${TEAL};color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:14px;font-weight:700;margin:16px 0;">${text}</a>`;
}

function infoRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:8px 12px;font-size:12px;color:#6b7280;border-bottom:1px solid #f3f4f6;">${label}</td>
    <td style="padding:8px 12px;font-size:12px;color:#1f2937;font-weight:600;border-bottom:1px solid #f3f4f6;">${value}</td>
  </tr>`;
}

function fmt(n: number): string {
  return `₹${(n ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

// ─── Send helpers ─────────────────────────────────────────────────────────────

async function send(options: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await transporter.sendMail({
      from: options.from ?? `"${process.env.SMTP_FROM_NAME ?? "PACKPRO"}" <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    return { success: true };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[email] send failed:", message);
    return { success: false, error: message };
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Send a tax invoice to a customer with a "View Invoice" link.
 */
export async function sendInvoiceEmail(params: {
  to: string;
  toName: string;
  invoiceNumber: string;
  invoiceId: string;
  amount: number;
  dueDate: string;
  companyName: string;
  companyPhone: string;
}): Promise<{ success: boolean; error?: string }> {
  const viewUrl = `${APP_URL}/invoices/${params.invoiceId}`;
  const printUrl = `${APP_URL}/api/invoices/${params.invoiceId}/print`;

  const body = `
    <h2 style="font-size:20px;color:#111827;margin:0 0 8px;">Invoice ${params.invoiceNumber}</h2>
    <p style="font-size:14px;color:#4b5563;margin:0 0 20px;">Dear ${params.toName},</p>
    <p style="font-size:14px;color:#4b5563;margin:0 0 20px;">
      Please find your invoice from <strong>${params.companyName}</strong> below.
      Kindly make the payment before the due date to avoid any delays.
    </p>
    <table cellpadding="0" cellspacing="0" style="width:100%;background:#f0fdfb;border:1px solid #ccf0ed;border-radius:6px;margin:0 0 20px;">
      ${infoRow("Invoice Number", params.invoiceNumber)}
      ${infoRow("Amount Due", fmt(params.amount))}
      ${infoRow("Due Date", params.dueDate)}
    </table>
    <div>
      ${primaryButton("View Invoice", viewUrl)}
      &nbsp;&nbsp;
      <a href="${printUrl}" style="display:inline-block;background:#ffffff;color:${TEAL};text-decoration:none;padding:12px 28px;border-radius:6px;font-size:14px;font-weight:700;margin:16px 0;border:2px solid ${TEAL};">Download PDF</a>
    </div>
    <p style="font-size:13px;color:#6b7280;margin:20px 0 0;">
      For any queries, please contact us at <strong>${params.companyPhone}</strong>.
    </p>`;

  return send({
    to: params.to,
    subject: `Invoice ${params.invoiceNumber} from ${params.companyName} — ${fmt(params.amount)} due ${params.dueDate}`,
    html: wrapHtml(`Invoice ${params.invoiceNumber}`, body, params.companyName),
  });
}

/**
 * Send a quotation / proforma to a prospect.
 */
export async function sendQuoteEmail(params: {
  to: string;
  toName: string;
  quoteNumber: string;
  quoteId: string;
  amount: number;
  validTill: string;
  companyName: string;
}): Promise<{ success: boolean; error?: string }> {
  const viewUrl = `${APP_URL}/quotes/${params.quoteId}`;

  const body = `
    <h2 style="font-size:20px;color:#111827;margin:0 0 8px;">Quotation ${params.quoteNumber}</h2>
    <p style="font-size:14px;color:#4b5563;margin:0 0 20px;">Dear ${params.toName},</p>
    <p style="font-size:14px;color:#4b5563;margin:0 0 20px;">
      Thank you for your interest! Please find our quotation attached for your review.
      This quote is valid until <strong>${params.validTill}</strong>.
    </p>
    <table cellpadding="0" cellspacing="0" style="width:100%;background:#f0fdfb;border:1px solid #ccf0ed;border-radius:6px;margin:0 0 20px;">
      ${infoRow("Quote Number", params.quoteNumber)}
      ${infoRow("Total Amount", fmt(params.amount))}
      ${infoRow("Valid Till", params.validTill)}
    </table>
    ${primaryButton("View Quotation", viewUrl)}
    <p style="font-size:13px;color:#6b7280;margin:20px 0 0;">
      We look forward to your business. Please reach out if you need any adjustments or have questions.
    </p>`;

  return send({
    to: params.to,
    subject: `Quotation ${params.quoteNumber} from ${params.companyName}`,
    html: wrapHtml(`Quotation ${params.quoteNumber}`, body, params.companyName),
  });
}

/**
 * Send a CRM follow-up reminder to a sales rep.
 */
export async function sendFollowUpReminder(params: {
  to: string;
  leadTitle: string;
  contactName: string;
  notes: string;
}): Promise<{ success: boolean; error?: string }> {
  const body = `
    <h2 style="font-size:20px;color:#111827;margin:0 0 8px;">Follow-up Reminder</h2>
    <p style="font-size:14px;color:#4b5563;margin:0 0 20px;">
      You have a scheduled follow-up for the lead below.
    </p>
    <table cellpadding="0" cellspacing="0" style="width:100%;background:#f0fdfb;border:1px solid #ccf0ed;border-radius:6px;margin:0 0 20px;">
      ${infoRow("Lead", params.leadTitle)}
      ${infoRow("Contact", params.contactName)}
    </table>
    ${params.notes ? `<p style="font-size:13px;color:#4b5563;background:#f9fafb;border-left:4px solid ${TEAL};padding:10px 14px;border-radius:0 4px 4px 0;margin:0 0 20px;"><strong>Notes:</strong><br>${params.notes}</p>` : ""}
    ${primaryButton("Open Lead", `${APP_URL}/leads`)}`;

  return send({
    to: params.to,
    subject: `Follow-up reminder: ${params.leadTitle}`,
    html: wrapHtml("Follow-up Reminder", body),
  });
}

/**
 * Send a payment received confirmation to the customer.
 */
export async function sendPaymentConfirmation(params: {
  to: string;
  toName: string;
  invoiceNumber: string;
  invoiceId: string;
  amountPaid: number;
  balanceDue: number;
  paymentMethod: string;
  companyName: string;
}): Promise<{ success: boolean; error?: string }> {
  const viewUrl = `${APP_URL}/invoices/${params.invoiceId}`;

  const body = `
    <h2 style="font-size:20px;color:#111827;margin:0 0 8px;">Payment Received</h2>
    <p style="font-size:14px;color:#4b5563;margin:0 0 20px;">Dear ${params.toName},</p>
    <p style="font-size:14px;color:#4b5563;margin:0 0 20px;">
      We have received your payment. Thank you!
    </p>
    <table cellpadding="0" cellspacing="0" style="width:100%;background:#f0fdfb;border:1px solid #ccf0ed;border-radius:6px;margin:0 0 20px;">
      ${infoRow("Invoice Number", params.invoiceNumber)}
      ${infoRow("Amount Paid", `<span style="color:#059669">${fmt(params.amountPaid)}</span>`)}
      ${infoRow("Payment Method", params.paymentMethod)}
      ${infoRow("Balance Due", params.balanceDue > 0 ? `<span style="color:#dc2626">${fmt(params.balanceDue)}</span>` : `<span style="color:#059669">NIL (Fully Paid)</span>`)}
    </table>
    ${primaryButton("View Invoice", viewUrl)}
    <p style="font-size:13px;color:#6b7280;margin:20px 0 0;">
      Thank you for your prompt payment. We appreciate your business!
    </p>`;

  return send({
    to: params.to,
    subject: `Payment Received — Invoice ${params.invoiceNumber} | ${params.companyName}`,
    html: wrapHtml("Payment Received", body, params.companyName),
  });
}

/**
 * Send a low-stock alert to internal staff.
 */
export async function sendLowStockAlert(params: {
  to: string;
  items: Array<{ name: string; sku: string; currentStock: number; reorderLevel: number }>;
}): Promise<{ success: boolean; error?: string }> {
  const rows = params.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 12px;font-size:12px;color:#1f2937;border-bottom:1px solid #f3f4f6;">${item.name}</td>
          <td style="padding:8px 12px;font-size:12px;color:#6b7280;border-bottom:1px solid #f3f4f6;">${item.sku}</td>
          <td style="padding:8px 12px;font-size:12px;color:#dc2626;font-weight:700;border-bottom:1px solid #f3f4f6;">${item.currentStock}</td>
          <td style="padding:8px 12px;font-size:12px;color:#4b5563;border-bottom:1px solid #f3f4f6;">${item.reorderLevel}</td>
        </tr>`
    )
    .join("");

  const body = `
    <h2 style="font-size:20px;color:#111827;margin:0 0 8px;">Low Stock Alert</h2>
    <p style="font-size:14px;color:#4b5563;margin:0 0 20px;">
      The following products have fallen below their reorder levels and require attention:
    </p>
    <table cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;margin:0 0 20px;">
      <thead>
        <tr style="background:${TEAL};">
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:#ffffff;">Product</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:#ffffff;">SKU</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:#ffffff;">Current Stock</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:#ffffff;">Reorder Level</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    ${primaryButton("Go to Inventory", `${APP_URL}/inventory`)}`;

  return send({
    to: params.to,
    subject: `Low Stock Alert — ${params.items.length} product${params.items.length !== 1 ? "s" : ""} need restocking`,
    html: wrapHtml("Low Stock Alert", body),
  });
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetUrl: string
) {
  const body = `
    <p style="font-size:15px;color:#1a1a2e;margin-bottom:16px;">Hi ${name},</p>
    <p style="font-size:14px;color:#555;margin-bottom:20px;">
      You requested a password reset for your PACKPRO account. Click the button below to set a new password.
      This link expires in <strong>1 hour</strong>.
    </p>
    ${primaryButton("Reset Password", resetUrl)}
    <p style="font-size:12px;color:#888;margin-top:20px;">
      If you did not request a password reset, you can safely ignore this email.
    </p>`;

  return send({
    to,
    subject: "Reset your PACKPRO password",
    html: wrapHtml("Password Reset", body),
  });
}
