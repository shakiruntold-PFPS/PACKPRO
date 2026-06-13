export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, created, requireAuth, requireRole, paginate, paginatedResponse, logAction } from "@/lib/api";
import { sanitizeObject } from "@/lib/sanitize";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const EmployeeSchema = z.object({
  empCode: z.string().min(1).max(20),
  name: z.string().min(1).max(100),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(20).optional(),
  designation: z.string().max(100).optional(),
  departmentId: z.string().optional(),
  joiningDate: z.string().optional(),
  salary: z.number().min(0).max(100_000_000).optional(),
  bankAccount: z.string().max(50).optional(),
  bankIfsc: z.string().max(20).optional(),
  panNumber: z.string().max(20).optional(),
  pfNumber: z.string().max(30).optional(),
  esiNumber: z.string().max(30).optional(),
});

export async function GET(req: NextRequest) {
  // HR, ADMIN, and MANAGER can view employees; SUPER_ADMIN always passes through requireRole
  const { response } = await requireRole(req, ["HR", "ADMIN", "MANAGER"]);
  if (response) return response;

  const sp = req.nextUrl.searchParams;
  const { skip, take, page, limit } = paginate(sp.get("page"), sp.get("limit"));
  const search = sp.get("search") ?? "";
  const deptId = sp.get("departmentId") ?? "";

  const where: Prisma.EmployeeWhereInput = { isActive: true };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { empCode: { contains: search, mode: "insensitive" } },
      { designation: { contains: search, mode: "insensitive" } },
    ];
  }
  if (deptId) where.departmentId = deptId;

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
  const { user, response } = await requireRole(req, ["HR", "ADMIN"]);
  if (response) return response;

  const body = await req.json().catch(() => ({}));
  const parsed = EmployeeSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues.map((e) => e.message).join(", "));

  const exists = await db.employee.findUnique({ where: { empCode: parsed.data.empCode } });
  if (exists) return err("Employee code already exists", 409);

  const sanitized = sanitizeObject(parsed.data as Record<string, unknown>);
  const createData: Prisma.EmployeeCreateInput = {
    empCode: sanitized.empCode as string,
    name: sanitized.name as string,
    email: sanitized.email as string | undefined,
    phone: sanitized.phone as string | undefined,
    designation: sanitized.designation as string | undefined,
    joiningDate: sanitized.joiningDate ? new Date(sanitized.joiningDate as string) : undefined,
    salary: sanitized.salary as number | undefined,
    bankAccount: sanitized.bankAccount as string | undefined,
    bankIfsc: sanitized.bankIfsc as string | undefined,
    panNumber: sanitized.panNumber as string | undefined,
    pfNumber: sanitized.pfNumber as string | undefined,
    esiNumber: sanitized.esiNumber as string | undefined,
    ...(sanitized.departmentId ? { department: { connect: { id: sanitized.departmentId as string } } } : {}),
  };

  const emp = await db.employee.create({ data: createData });
  await logAction(user.id, "CREATE", "EMPLOYEE", emp.id, null, emp as unknown as Prisma.InputJsonValue);
  return created(emp);
}
