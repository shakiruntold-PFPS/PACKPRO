// src/lib/scoring.ts
// Rule-based lead scoring (0–100 points)

export interface LeadScoreInput {
  value?: number | null;
  priority: string;
  status: string;
  activityCount?: number;
  createdAt: Date;
  phone?: string | null;
  email?: string | null;
}

export interface LeadScoreResult {
  score: number;
  grade: "A" | "B" | "C" | "D";
  reasons: string[];
}

export function calculateLeadScore(lead: LeadScoreInput): LeadScoreResult {
  let score = 0;
  const reasons: string[] = [];

  // ── Lead value (0–20 pts) ────────────────────────────────────────────────────
  const value = lead.value ?? 0;
  if (value >= 200_000) {
    score += 20;
    reasons.push("High value (≥ ₹2L) +20");
  } else if (value >= 50_000) {
    score += 15;
    reasons.push("Good value (₹50K–₹2L) +15");
  } else if (value >= 10_000) {
    score += 10;
    reasons.push("Moderate value (₹10K–₹50K) +10");
  } else if (value > 0) {
    score += 5;
    reasons.push("Low value (< ₹10K) +5");
  }

  // ── Priority (0–20 pts) ──────────────────────────────────────────────────────
  switch (lead.priority) {
    case "URGENT":
      score += 20;
      reasons.push("Priority: URGENT +20");
      break;
    case "HIGH":
      score += 15;
      reasons.push("Priority: HIGH +15");
      break;
    case "MEDIUM":
      score += 5;
      reasons.push("Priority: MEDIUM +5");
      break;
    case "LOW":
    default:
      // 0 pts
      break;
  }

  // ── Status (0–30 pts) ────────────────────────────────────────────────────────
  switch (lead.status) {
    case "NEGOTIATION":
      score += 30;
      reasons.push("Status: NEGOTIATION +30");
      break;
    case "PROPOSAL":
      score += 25;
      reasons.push("Status: PROPOSAL +25");
      break;
    case "QUALIFIED":
      score += 20;
      reasons.push("Status: QUALIFIED +20");
      break;
    case "CONTACTED":
      score += 10;
      reasons.push("Status: CONTACTED +10");
      break;
    case "NEW":
      score += 5;
      reasons.push("Status: NEW +5");
      break;
    case "WON":
    case "LOST":
    default:
      // 0 pts — terminal states don't score for pipeline purposes
      break;
  }

  // ── Activity count (0–15 pts) ────────────────────────────────────────────────
  const activities = lead.activityCount ?? 0;
  if (activities > 5) {
    score += 15;
    reasons.push("High engagement (>5 activities) +15");
  } else if (activities >= 3) {
    score += 10;
    reasons.push("Good engagement (3–5 activities) +10");
  } else if (activities >= 1) {
    score += 5;
    reasons.push("Some engagement (1–2 activities) +5");
  }

  // ── Recency penalty ──────────────────────────────────────────────────────────
  const daysSinceCreated = Math.floor(
    (Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSinceCreated > 60) {
    score -= 20;
    reasons.push("Stale lead (>60 days) -20");
  } else if (daysSinceCreated > 30) {
    score -= 10;
    reasons.push("Aging lead (>30 days) -10");
  }

  // ── Contact completeness (+5 each) ──────────────────────────────────────────
  if (lead.phone && lead.phone.trim()) {
    score += 5;
    reasons.push("Has phone +5");
  }
  if (lead.email && lead.email.trim()) {
    score += 5;
    reasons.push("Has email +5");
  }

  // ── Clamp to 0–100 ──────────────────────────────────────────────────────────
  score = Math.max(0, Math.min(100, score));

  // ── Grade ────────────────────────────────────────────────────────────────────
  let grade: "A" | "B" | "C" | "D";
  if (score >= 75) {
    grade = "A";
  } else if (score >= 50) {
    grade = "B";
  } else if (score >= 25) {
    grade = "C";
  } else {
    grade = "D";
  }

  return { score, grade, reasons };
}
