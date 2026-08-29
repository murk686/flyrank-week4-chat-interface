/**
 * lib/tools.ts
 * ─────────────────────────────────────────────────────────────
 * FE-07 tool definitions.
 *
 * scoreLead   — server-side tool (has `execute`). Runs automatically,
 *               no client round-trip. Scores a site visitor as a lead
 *               using plain deterministic code, not model output — the
 *               LLM only decides *when* to call it and *what* to pass.
 *
 * sendInquiry — client-side tool (NO `execute`). Because it has no
 *               execute function, the AI SDK stops and waits for the
 *               client to supply a result. ChatInterface renders a
 *               confirm/cancel prompt and calls addToolOutput once the
 *               visitor decides — this is FE-07's required
 *               "confirmation before an action runs" tool.
 * ─────────────────────────────────────────────────────────────
 */

import { z } from "zod";

export const scoreLeadInputSchema = z.object({
  interest: z
    .enum(["hiring", "collaboration", "general"])
    .describe(
      "Why the visitor is reaching out. 'hiring' = evaluating for a role, " +
        "'collaboration' = project/partnership interest, 'general' = other."
    ),
  role: z
    .string()
    .min(1, "role must not be empty")
    .describe("The visitor's role or title, e.g. 'Engineering Manager', 'Recruiter', 'Founder'."),
  timeline: z
    .enum(["immediate", "this_quarter", "exploring"])
    .describe(
      "How soon they'd act. 'immediate' = deciding now, 'this_quarter' = within ~3 months, " +
        "'exploring' = no set timeline."
    ),
});

export type ScoreLeadInput = z.infer<typeof scoreLeadInputSchema>;

export interface LeadScoreResult {
  score: number; // 0-100
  tier: "hot" | "warm" | "cold";
  reasons: string[];
}

/**
 * Deterministic scoring logic — same input always produces the same
 * output, so results are auditable and not subject to model drift.
 */
export function scoreLead(input: ScoreLeadInput): LeadScoreResult {
  const { interest, role, timeline } = input;

  // Designed failure path for FE-07's required "output-error" state.
  const trimmedRole = role.trim();
  if (trimmedRole.length < 2) {
    throw new Error(
      "Role is too short to score meaningfully — ask for a bit more detail (e.g. their title)."
    );
  }

  let score = 0;
  const reasons: string[] = [];

  if (interest === "hiring") {
    score += 50;
    reasons.push("Reached out specifically about hiring — highest-intent category.");
  } else if (interest === "collaboration") {
    score += 30;
    reasons.push("Interested in collaboration — solid but not a hiring-track lead.");
  } else {
    score += 10;
    reasons.push("General interest — lowest-priority category by default.");
  }

  if (timeline === "immediate") {
    score += 35;
    reasons.push("Timeline is immediate — treat as time-sensitive.");
  } else if (timeline === "this_quarter") {
    score += 20;
    reasons.push("Timeline is this quarter — worth following up soon.");
  } else {
    score += 5;
    reasons.push("No set timeline — lower urgency.");
  }

  const decisionMakerTitles = ["manager", "director", "founder", "ceo", "cto", "lead", "head"];
  if (decisionMakerTitles.some((t) => trimmedRole.toLowerCase().includes(t))) {
    score += 15;
    reasons.push(`Role ("${trimmedRole}") suggests decision-making authority.`);
  }

  score = Math.min(100, score);
  const tier: LeadScoreResult["tier"] = score >= 70 ? "hot" : score >= 40 ? "warm" : "cold";

  return { score, tier, reasons };
}

export const sendInquiryInputSchema = z.object({
  summary: z
    .string()
    .describe("One-sentence summary of the inquiry, shown to the visitor before they confirm sending it."),
});

export type SendInquiryInput = z.infer<typeof sendInquiryInputSchema>;
