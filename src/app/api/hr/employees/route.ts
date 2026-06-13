export const runtime = "nodejs";
// src/app/api/hr/employees/route.ts
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, created, requireAuth, paginate, paginatedResponse, logAction } from "@/lib/api";
import { z } from "zod";

const EmployeeSchema = z.object({
  empCode: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  designation: z.string().optional(),
  departmentId: z.string().optional(),
  joiningDate: z.string().optional(),
  salary: z.number().optional(),
  bankAccount: z.string().optional(),
  bankIfsc: z.string().optional(),
  panNumber: z.string().optional(),
  pfNumber: z.string().optional(),
  esiNumber: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 25);
  const search = searchParams.get("search") ?? "";
  const deptId = searchParams.get("departmentId") ?? "";

  const where: any = { isActive: true };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { empCode: { contains: search, mode: "insensitive" } },
      { designation: { contains: search, mode: "insensitive" } },
    ];
  }
  if (deptId) where.departmentId = deptId;

  const { skip, take } = paginate(page, limit);
  const [data, total] = await Promise.all([
    db.employee.findMany({
      where,
      skip,
      take,
      include: {
        department: { select: { id: true, name: true } },
        _count: { select: { attendances: true, leaves: true } },
      },
      orderBy: { name: "asc" },
    }),
    db.employee.count({ where }),
  ]);

  return ok(paginatedResponse(data, total, page, limit));
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  const body = await req.json();
  const parsed = EmployeeSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.message);

  const exists = await db.employee.findUnique({ where: { empCode: parsed.data.empCode } });
  if (exists) return err("Employee code already exists");

  const data: any = { ...parsed.data };
  if (data.joiningDate) data.joiningDate = new Date(data.joiningDate);

  const emp = await db.employee.create({ data });
  await logAction(user!.id, "CREATE", "EMPLOYEE", emp.id, null, emp);
  return created(emp);
}
