import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, requireAuth } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { response } = await requireAuth(req);
  if (response) return response;

  const sp = req.nextUrl.searchParams;
  const date = sp.get("date") ?? new Date().toISOString().slice(0, 10);
  const targetDate = new Date(date);

  const employees = await db.employee.findMany({
    where: { isActive: true },
    select: {
      id: true, name: true, empCode: true, isActive: true,
      department: { select: { name: true } },
      attendances: {
        where: {
          date: {
            gte: new Date(targetDate.toISOString().slice(0, 10) + "T00:00:00Z"),
            lt:  new Date(targetDate.toISOString().slice(0, 10) + "T23:59:59Z"),
          },
        },
        take: 1,
      },
    },
    orderBy: { name: "asc" },
  });

  return ok(employees);
}

export async function POST(req: NextRequest) {
  const { response } = await requireAuth(req);
  if (response) return response;

  const body = await req.json().catch(() => ({}));
  const { employeeId, date, status, checkIn, checkOut, notes } = body;

  if (!employeeId || !date || !status) return err("employeeId, date and status are required");

  const targetDate = new Date(date);

  const attendance = await db.attendance.upsert({
    where: {
      employeeId_date: {
        employeeId,
        date: targetDate,
      },
    },
    update: { status, checkIn: checkIn ?? null, checkOut: checkOut ?? null, notes: notes ?? null },
    create: { employeeId, date: targetDate, status, checkIn: checkIn ?? null, checkOut: checkOut ?? null, notes: notes ?? null },
  });

  return ok(attendance);
}

export async function PUT(req: NextRequest) {
  // Bulk update: mark attendance for all employees for a date
  const { response } = await requireAuth(req);
  if (response) return response;

  const body = await req.json().catch(() => ({}));
  const { records } = body; // [{ employeeId, date, status }]

  if (!Array.isArray(records) || records.length === 0) return err("records array required");

  const results = await Promise.allSettled(
    records.map(({ employeeId, date, status }: any) =>
      db.attendance.upsert({
        where: { employeeId_date: { employeeId, date: new Date(date) } },
        update: { status },
        create: { employeeId, date: new Date(date), status },
      })
    )
  );

  const saved = results.filter(r => r.status === "fulfilled").length;
  return ok({ saved, total: records.length });
}
