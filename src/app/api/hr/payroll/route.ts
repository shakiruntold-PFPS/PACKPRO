export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, created, requireRole, logAction } from "@/lib/api";
import { Prisma, PayrollStatus } from "@prisma/client";
import { z } from "zod";

const PayrollSchema = z.object({
  employeeId: z.string(),
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2100),
  hra: z.number().min(0).default(0),
  allowances: z.number().min(0).default(0),
  pf: z.number().min(0).default(0),
  esi: z.number().min(0).default(0),
  tds: z.number().min(0).default(0),
  otherDeductions: z.number().min(0).default(0),
});

export async function GET(req: NextRequest) {
  const { response } = await requireRole(req, ["HR", "ADMIN", "ACCOUNTS"]);
  if (response) return response;

  const sp = req.nextUrl.searchParams;
  const month = Number(sp.get("month") ?? new Date().getMonth() + 1);
  const year  = Number(sp.get("year")  ?? new Date().getFullYear());

  const data = await db.payroll.findMany({
    where: { month, year },
    include: {
      employee: {
        select: {
          id: true, empCode: true, name: true, designation: true,
          department: { select: { name: true } },
        },
      },
    },
    orderBy: { employee: { name: "asc" } },
  });

  const summary = {
    totalEmployees: data.length,
    totalGross:      data.reduce((s, p) => s + p.gross, 0),
    totalNet:        data.reduce((s, p) => s + p.net, 0),
    totalDeductions: data.reduce((s, p) => s + p.pf + p.esi + p.tds + p.otherDeductions, 0),
  };

  return ok({ data, summary });
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireRole(req, ["HR", "ADMIN"]);
  if (response) return response;

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;

  // Bulk process payroll for a month
  if (body.processBulk) {
    const month = Number(body.month);
    const year  = Number(body.year);
    if (!month || !year) return err("month and year are required for bulk processing");

    const employees = await db.employee.findMany({
      where: { isActive: true, salary: { gt: 0 } },
    });

    const payrolls = [];
    for (const emp of employees) {
      const existing = await db.payroll.findFirst({ where: { employeeId: emp.id, month, year } });
      if (existing) continue;

      const basic = emp.salary ?? 0;
      const hra   = basic * 0.4;
      const pf    = basic * 0.12;
      const esi   = basic <= 21000 ? basic * 0.0075 : 0;
      const gross = basic + hra;
      const net   = gross - pf - esi;

      const payroll = await db.payroll.create({
        data: { employeeId: emp.id, month, year, basic, hra, pf, esi, gross, net },
      });
      payrolls.push(payroll);
    }

    await logAction(user.id, "PROCESS_PAYROLL", "HR", undefined, null, { month, year, count: payrolls.length } as Prisma.InputJsonValue);
    return ok({ processed: payrolls.length, payrolls });
  }

  const parsed = PayrollSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues.map((e) => e.message).join(", "));

  const emp = await db.employee.findUnique({ where: { id: parsed.data.employeeId } });
  if (!emp) return err("Employee not found", 404);

  const basic      = emp.salary ?? 0;
  const gross      = basic + parsed.data.hra + parsed.data.allowances;
  const deductions = parsed.data.pf + parsed.data.esi + parsed.data.tds + parsed.data.otherDeductions;
  const net        = gross - deductions;

  const payroll = await db.payroll.create({
    data: { ...parsed.data, basic, gross, net },
  });

  return created(payroll);
}

export async function PATCH(req: NextRequest) {
  const { response } = await requireRole(req, ["HR", "ADMIN"]);
  if (response) return response;

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const { id, status, paidAt } = body as { id?: string; status?: string; paidAt?: string };
  if (!id || !status) return err("id and status required");

  const payroll = await db.payroll.update({
    where: { id },
    data: {
      status: status as PayrollStatus,
      paidAt: paidAt ? new Date(paidAt) : undefined,
    },
  }).catch(() => null);

  if (!payroll) return err("Payroll record not found", 404);
  return ok(payroll);
}
