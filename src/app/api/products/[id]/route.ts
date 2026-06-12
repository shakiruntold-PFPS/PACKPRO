import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, requireAuth, logAction } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const product = await db.product.findUnique({
    where: { id },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!product) return err("Product not found", 404);
  return ok(product);
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { user, response } = await requireAuth(req);
  if (response) return response;
  const { id } = await params;
  const body = await req.json();
  const old = await db.product.findUnique({ where: { id } });
  if (!old) return err("Product not found", 404);
  const updated = await db.product.update({ where: { id }, data: body });
  await logAction(user!.id, "UPDATE", "PRODUCT", id, old, updated);
  return ok(updated);
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { user, response } = await requireAuth(req);
  if (response) return response;
  const { id } = await params;
  await db.product.update({ where: { id }, data: { status: "ARCHIVED" } });
  await logAction(user!.id, "DELETE", "PRODUCT", id);
  return ok({ message: "Product archived" });
}
