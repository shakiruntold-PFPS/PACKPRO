// Rule-based automation engine for PACKPRO
// Call triggerAutomation(trigger, context) after events to fire matching rules

import { db } from "@/lib/db";
import { notify } from "@/lib/api";

interface AutomationAction {
  type: "CREATE_TASK" | "SEND_NOTIFICATION" | "SEND_EMAIL" | "SEND_WHATSAPP" | "UPDATE_STATUS";
  params: Record<string, any>;
}

interface AutomationCondition {
  field: string;
  operator: "eq" | "neq" | "gt" | "lt" | "gte" | "lte" | "contains";
  value: any;
}

function checkConditions(
  conditions: AutomationCondition[] | null | undefined,
  context: Record<string, any>
): boolean {
  if (!conditions || conditions.length === 0) return true;

  return conditions.every((cond) => {
    // Support dot-notation for nested fields e.g. "lead.value"
    const fieldValue = cond.field.split(".").reduce((obj, key) => obj?.[key], context);

    switch (cond.operator) {
      case "eq":
        return fieldValue == cond.value;
      case "neq":
        return fieldValue != cond.value;
      case "gt":
        return Number(fieldValue) > Number(cond.value);
      case "lt":
        return Number(fieldValue) < Number(cond.value);
      case "gte":
        return Number(fieldValue) >= Number(cond.value);
      case "lte":
        return Number(fieldValue) <= Number(cond.value);
      case "contains":
        return String(fieldValue ?? "").toLowerCase().includes(String(cond.value).toLowerCase());
      default:
        return true;
    }
  });
}

async function executeAction(
  action: AutomationAction,
  context: Record<string, any>
): Promise<void> {
  const p = action.params ?? {};

  switch (action.type) {
    case "CREATE_TASK": {
      const dueDate = p.dueInDays != null
        ? new Date(Date.now() + Number(p.dueInDays) * 86_400_000)
        : undefined;

      await db.task.create({
        data: {
          title: p.title ?? "Automated Task",
          status: "PENDING",
          priority: p.priority ?? "MEDIUM",
          assignedToId: p.assignedToId ?? context.userId ?? undefined,
          dueDate: dueDate,
          leadId: p.leadId ?? context.leadId ?? undefined,
        },
      });
      break;
    }

    case "SEND_NOTIFICATION": {
      const targetUserId = p.userId ?? context.userId;
      if (targetUserId) {
        await notify(
          targetUserId,
          p.type ?? "AUTOMATION",
          p.title ?? "Automation Alert",
          p.message ?? "An automated event occurred.",
          p.link ?? undefined
        );
      }
      break;
    }

    case "SEND_EMAIL": {
      // Email sending is best-effort; import dynamically to avoid circular deps
      try {
        const emailLib = await import("@/lib/email");
        if (typeof (emailLib as any).sendEmail === "function") {
          await (emailLib as any).sendEmail({
            to: p.to ?? context.email,
            subject: p.subject ?? "PACKPRO Notification",
            html: p.body ?? p.html ?? "<p>You have a new notification from PACKPRO.</p>",
          });
        }
      } catch {
        // Email lib may not export a generic sendEmail — skip silently
      }
      break;
    }

    case "UPDATE_STATUS": {
      const newStatus = p.status;
      if (!newStatus) break;

      if (context.leadId) {
        await db.lead.update({ where: { id: context.leadId }, data: { status: newStatus } });
      } else if (context.quoteId) {
        await db.quote.update({ where: { id: context.quoteId }, data: { status: newStatus } });
      } else if (context.invoiceId) {
        await db.invoice.update({ where: { id: context.invoiceId }, data: { status: newStatus } });
      }
      break;
    }

    case "SEND_WHATSAPP": {
      // WhatsApp is URL-based; log activity if we have a leadId
      if (context.leadId && context.userId) {
        await db.activity.create({
          data: {
            type: "WHATSAPP",
            subject: p.subject ?? "WhatsApp message (automated)",
            notes: p.message ?? "",
            leadId: context.leadId,
            userId: context.userId,
          },
        });
      }
      break;
    }

    default:
      break;
  }
}

export async function triggerAutomation(
  trigger: string,
  context: Record<string, any>
): Promise<void> {
  try {
    const rules = await db.automationRule.findMany({
      where: { trigger, isActive: true },
    });

    for (const rule of rules) {
      try {
        const conditions = rule.conditions as unknown as AutomationCondition[] | null;
        if (!checkConditions(conditions, context)) continue;

        const actions = rule.actions as unknown as AutomationAction[];
        let actionsExecuted = 0;

        for (const action of actions) {
          try {
            await executeAction(action, context);
            actionsExecuted++;
          } catch {
            // Non-fatal: continue with next action
          }
        }

        // Update rule stats
        await db.automationRule.update({
          where: { id: rule.id },
          data: {
            lastRunAt: new Date(),
            runCount: { increment: 1 },
          },
        });
      } catch {
        // Non-fatal: continue with next rule
      }
    }
  } catch {
    // Non-fatal: automation must never break the primary operation
  }
}
