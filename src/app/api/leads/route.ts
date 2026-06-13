export const runtime = "nodejs";
// src/app/api/leads/route.ts
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, created, requireAuth, paginate, paginatedResponse, logAction } from "@/lib/api";
import { sanitizeObject } from "@/lib/sanitize";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { calculateLeadScore } from "@/lib/scoring";
import { triggerAutomation } from "@/lib/automation";

const LeadSchema = z.object({
  title:        z.string().min(1).max(300),
  partyId:      z.string().optional(),
  contactName:  z.string().max(100).optional(),
  phone:        z.string().max(20).optional(),
  email:        z.string().email().max(254).optional().or(z.literal("")),
  company:      z.string().max(200).optional(),
  industry:     z.string().max(100).optional(),
  source:       z.enum(["WEBSITE","WHATSAPP","REFERRAL","GOOGLE","INSTAGRAM","FACEBOOK","COLD_CALL","EXHIBITION","OTHER"]).default("WEBSITE"),
  status:       z.enum(["NEW","CONTACTED","QUALIFIED","PROPOSAL","NEGOTIATION","WON","LOST"]).default("NEW"),
  priority:     z.enum(["LOW","MEDIUM","HIGH","URGENT"]).default("MEDIUM"),
  value:        z.number().min(0).max(1_000_000_000).optional(),
  notes:        z.string().max(5000).optional(),
  assignedToId: z.string().optional(),
  followUpDate: z.string().optional(),
  tags:         z.array(z.string().max(50)).max(20).default([]),
});

export async function GET(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const page         = Number(searchParams.get("page")         ?? 1);
  const limit        = Number(searchParams.get("limit")        ?? 25);
  const search       = searchParams.get("search")       ?? "";
  const status       = searchParams.get("status")       ?? "";
  const assignedToId = searchParams.get("assignedToId") ?? "";

  const where: Prisma.LeadWhereInput = { deletedAt: null };
  if (search) {
    where.OR = [
      { title:       { contains: search, mode: "insensitive" } },
      { company:     { contains: search, mode: "insensitive" } },
      { contactName: { contains: search, mode: "insensitive" } },
      { phone:       { contains: search } },
    ];
  }
  if (status)       where.status       = status as Prisma.EnumLeadStatusFilter;
  if (assignedToId) where.assignedToId = assignedToId;

  const { skip, take } = paginate(page, limit);
  const [data, total] = await Promise.all([
    db.lead.findMany({
      where,
      skip,
      take,
      include: {
        assignedTo: { select: { id: true, name: true, avatar: true } },
        party:      { select: { id: true, name: true } },
        _count:     { select: { activities: true, tasks: true, quotes: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.lead.count({ where }),
  ]);

  const scored = data.map((lead) => {
    const { score, grade } = calculateLeadScore({
      value:         lead.value ?? undefined,
      priority:      lead.priority,
      status:        lead.status,
      activityCount: lead._count.activities,
      createdAt:     lead.createdAt,
      phone:         lead.phone,
      email:         lead.email,
    });
    return { ...lead, score, grade };
  });

  return ok(paginatedResponse(scored, total, page, limit));
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  const body = await req.json();
  const parsed = LeadSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.message);

  const clean = sanitizeObject(parsed.data) as typeof parsed.data;

  const leadData: Prisma.LeadCreateInput = {
    title:        clean.title,
    contactName:  clean.contactName,
    phone:        clean.phone,
    email:        clean.email || undefined,
    company:      clean.company,
    industry:     clean.industry,
    source:       clean.source,
    status:       clean.status,
    priority:     clean.priority,
    value:        clean.value,
    notes:        clean.notes,
    tags:         clean.tags,
    followUpDate: clean.followUpDate ? new Date(clean.followUpDate) : undefined,
    assignedTo:   { connect: { id: clean.assignedToId ?? user.id } },
    ...(clean.partyId ? { party: { connect: { id: clean.partyId } } } : {}),
  };

  const lead = await db.lead.create({ data: leadData });

  await db.activity.create({
    data: {
      type:    "NOTE",
      subject: "Lead created",
      notes:   `Lead "${lead.title}" created`,
      userId:  user.id,
      leadId:  lead.id,
    },
  });

  await logAction(user.id, "CREATE", "LEAD", lead.id, null, {
    title: lead.title,
    status: lead.status,
  });

  triggerAutomation("LEAD_CREATED", {
    leadId: lead.id,
    userId: user!.id,
    lead: { id: lead.id, title: lead.title, value: lead.value, source: lead.source },
  }).catch(() => null);

  return created(lead);
}
