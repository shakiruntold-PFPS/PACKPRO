// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Currency ────────────────────────────────────────────────────────────────
export function formatCurrency(amount: number, symbol = "₹"): string {
  return `${symbol}${new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)}`;
}

// ─── Dates ────────────────────────────────────────────────────────────────────
export function formatDate(date: Date | string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Number formatting ────────────────────────────────────────────────────────
export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-IN").format(n);
}

// ─── Invoice number generator ─────────────────────────────────────────────────
export function generateInvoiceNumber(prefix: string, counter: number): string {
  const year = new Date().getFullYear().toString().slice(-2);
  const month = String(new Date().getMonth() + 1).padStart(2, "0");
  const num = String(counter).padStart(4, "0");
  return `${prefix}-${year}${month}-${num}`;
}

// ─── GST calculation ──────────────────────────────────────────────────────────
export function calculateGST(
  amount: number,
  gstRate: number,
  isInterState = false
): { cgst: number; sgst: number; igst: number; total: number } {
  const taxAmount = (amount * gstRate) / 100;
  if (isInterState) {
    return { cgst: 0, sgst: 0, igst: taxAmount, total: taxAmount };
  }
  const half = taxAmount / 2;
  return { cgst: half, sgst: half, igst: 0, total: taxAmount };
}

// ─── Slug generator ───────────────────────────────────────────────────────────
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ─── Truncate ─────────────────────────────────────────────────────────────────
export function truncate(str: string, n: number): string {
  return str.length > n ? str.slice(0, n) + "…" : str;
}

// ─── Status colours ───────────────────────────────────────────────────────────
export const STATUS_COLORS: Record<string, string> = {
  // Lead
  NEW: "blue",
  CONTACTED: "purple",
  QUALIFIED: "amber",
  PROPOSAL: "orange",
  NEGOTIATION: "yellow",
  WON: "green",
  LOST: "red",
  // Quote / Invoice / Order
  DRAFT: "gray",
  SENT: "blue",
  VIEWED: "purple",
  APPROVED: "green",
  REJECTED: "red",
  EXPIRED: "orange",
  CONVERTED: "teal",
  PAID: "green",
  PARTIALLY_PAID: "amber",
  OVERDUE: "red",
  CANCELLED: "gray",
  // Order
  CONFIRMED: "blue",
  PROCESSING: "amber",
  READY: "purple",
  DISPATCHED: "teal",
  DELIVERED: "green",
  // Stock
  IN_TRANSIT: "amber",
  FAILED: "red",
};

export function getStatusColor(status: string): string {
  return STATUS_COLORS[status] ?? "gray";
}
