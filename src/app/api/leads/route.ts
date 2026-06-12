// src/app/api/leads/route.ts
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, created, requireAuth, paginate, paginatedResponse, logAction } from "@/lib/api";
import { z } from "zod";

const LeadSchema = z.object({
  title: z.string().min(1),
  partyId: z.string().optional(),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  company: z.string().optional(),
  industry: z.string().optional(),
  source: z.enum(["WEBSITE","WHATSAPP","REFERRAL","GOOGLE","INSTAGRAM","FACEBOOK","COLD_CALL","EXHIBITION","OTHER"]).default("WEBSITE"),
  status: z.enum(["NEW","CONTACTED","QUALIFIED","PROPOSAL","NEGOTIATION","WON","LOST"]).default("NEW"),
  priority: z.enum(["LOW","MEDIUM","HIGH","URGENT"]).default("MEDIUM"),
  value: z.number().optional(),
  notes: z.string().optional(),
  assignedToId: z.string().optional(),
  followUpDate: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export async function GET(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 25);
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";
  const assignedToId = searchParams.get("assignedToId") ?? "";

  const where: any = {};
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { company: { contains: search, mode: "insensitive" } },
      { contactName: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
    ];
  }
  if (status) where.status = status;
  if (assignedToId) where.assignedToId = assignedToId;

  const { skip, take } = paginate(page, limit);
  const [data, total] = await Promise.all([
    db.lead.findMany({
      where,
      skip,
      take,
      include: {
        assignedTo: { select: { id: true, name: true, avatar: true } },
        party: { select: { id: true, name: true } },
        _count: { select: { activities: true, tasks: true, quotes: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.lead.count({ where }),
  ]);

  return ok(paginatedResponse(data, total, page, limit));
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  const body = await req.json();
  const parsed = LeadSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.message);

  const data: any = { ...parsed.data };
  if (!data.assignedToId) data.assignedToId = user!.id;
  if (data.followUpDate) data.followUpDate = new Date(data.followUpDate);

  const lead = await db.lead.create({ data });

  // Auto-create first activity
  await db.activity.create({
    data: {
      type: "NOTE",
      subject: "Lead created",
      notes: `Lead "${lead.title}" created`,
      userId: user!.id,
      leadId: lead.id,
    },
  });

  await logAction(user!.id, "CREATE", "LEAD", lead.id, null, lead);
  return created(lead);
}
