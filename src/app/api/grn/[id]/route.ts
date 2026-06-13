export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const grn = await db.gRN.findUnique({
    where: { id },
    include: {
      purchaseOrder: { include: { vendor: true } },
      items: {
        include: {
          product: { select: { name: true, code: true, unit: true } },
        },
      },
    },
  });

  if (!grn) return err("GRN not found", 404);
  return ok(grn);
}
