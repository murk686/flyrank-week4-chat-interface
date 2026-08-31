/**
 * app/api/chat/route.ts
 * ─────────────────────────────────────────────────────────────
 * Server-side route handler for streaming chat completions.
 *
 * NOTE: Using Groq instead of Anthropic Claude or Google Gemini.
 * Reason: Anthropic API requires a paid plan. Gemini free tier has
 * zero quota in some regions. Groq provides a genuinely free tier
 * with fast inference via console.groq.com — no credit card needed.
 * The streaming architecture is identical regardless of provider.
 *
 * FE-07 addition: two tools wired into streamText.
 *   - scoreLead: server-side, has `execute`, runs automatically.
 *   - sendInquiry: client-side, no `execute` — the client (ChatInterface)
 *     renders a confirm/cancel UI and supplies the result itself.
 *
 * FE-08 addition: reproducible sabotage hooks for failure-state
 * testing/demo recording. Typing one of these exact phrases as a
 * message triggers a specific failure path on purpose, so the mid-
 * stream error + retry flow can be demonstrated reliably instead of
 * hoping a real network blip happens on camera:
 *   "TEST_ERROR_500"  → throws mid-handler (generic server failure)
 *   "TEST_ERROR_429"  → returns a 429 rate-limit response
 * These are harmless magic strings, not a real backdoor — they don't
 * touch auth, data, or anything sensitive. Safe to leave in for the
 * portfolio; remove if it ever bothers a reviewer.
 *
 * FE-10 addition: real IP-based rate limiting. This closes a
 * limitation documented in the README (the route previously had no
 * abuse protection). Implementation is an in-memory sliding window —
 * deliberately simple, no new paid service required. Honest tradeoff:
 * because Vercel serverless functions aren't guaranteed to stay warm
 * or share memory across instances, this resets occasionally rather
 * than being perfectly distributed. That's an acceptable fit for a
 * portfolio chat widget's actual threat model (casual abuse), not a
 * high-security system. A fully distributed limiter would use
 * Upstash Redis — noted as a future improvement, not built here.
 * ─────────────────────────────────────────────────────────────
 */

import { createGroq } from "@ai-sdk/groq";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import {
  AI_MODEL,
  AI_MAX_TOKENS,
  AI_TEMPERATURE,
  SYSTEM_PROMPT,
} from "@/lib/ai-config";
import { scoreLead, scoreLeadInputSchema, sendInquiryInputSchema, searchPortfolioInputSchema } from "@/lib/tools";
import { searchPortfolio } from "@/lib/portfolio-data";

export const maxDuration = 30;

// ── Rate limiting ──
// Sliding window: max N requests per IP per WINDOW_MS.
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

// Module-level Map — persists for the lifetime of a warm serverless
// instance. Not shared across instances/cold starts (see note above).
const requestLog = new Map<string, number[]>();

function getClientIp(req: Request): string {
  // Vercel sets x-forwarded-for; first entry is the original client.
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const timestamps = (requestLog.get(ip) ?? []).filter((t) => t > windowStart);

  if (timestamps.length >= RATE_LIMIT_MAX) {
    requestLog.set(ip, timestamps); // prune even on reject
    return true;
  }
  timestamps.push(now);
  requestLog.set(ip, timestamps);
  return false;
}

// Occasionally prune old IPs entirely so the Map doesn't grow forever
// across a long-lived warm instance.
let lastPrune = Date.now();
function prunePeriodically() {
  const now = Date.now();
  if (now - lastPrune < RATE_LIMIT_WINDOW_MS) return;
  lastPrune = now;
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  for (const [ip, timestamps] of requestLog) {
    const kept = timestamps.filter((t) => t > cutoff);
    if (kept.length === 0) requestLog.delete(ip);
    else requestLog.set(ip, kept);
  }
}

const TOOL_SYSTEM_ADDENDUM = `

Whenever a visitor asks a specific factual question about Murk — background,
tech stack, pricing, certifications, experience, education, contact info,
etc. — use the searchPortfolio tool first rather than answering from
general knowledge or guessing. If it returns no match, say so honestly and
suggest emailing Murk directly rather than inventing an answer.

You also help visitors who are reaching out about hiring or collaboration.
When a visitor explains why they're contacting Murk, use the scoreLead tool
to score them — you need their interest category, role/title, and timeline.
Ask a brief follow-up if any of those three are missing; don't guess at them.

After scoring a lead, if the visitor wants their inquiry actually sent to
Murk, use the sendInquiry tool with a one-sentence summary. This always
requires the visitor's explicit confirmation before anything is sent —
never say or imply it has already been sent.`;

function getLastUserText(messages: UIMessage[]): string {
  const last = [...messages].reverse().find((m) => m.role === "user");
  if (!last) return "";
  return last.parts
    .filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
    .map((p) => p.text)
    .join("")
    .trim();
}

export async function POST(req: Request) {
  prunePeriodically();

  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return new Response(
      JSON.stringify({
        error: `Too many requests. Limit is ${RATE_LIMIT_MAX} messages per 5 minutes — please wait a bit and try again.`,
      }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  const body = await req.json();
  const messages = body.messages as UIMessage[];
  const lastUserText = getLastUserText(messages);

  // --- FE-08 sabotage hooks (see file header) ---
  if (lastUserText === "TEST_ERROR_429") {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded. Please wait and try again." }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }
  if (lastUserText === "TEST_ERROR_500") {
    throw new Error("Simulated server failure (FE-08 sabotage test).");
  }
  // --- end sabotage hooks ---

  const groq = createGroq({
    apiKey: process.env.GROQ_API_KEY,
  });

  const coreMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: groq(AI_MODEL),
    system: SYSTEM_PROMPT + TOOL_SYSTEM_ADDENDUM,
    messages: coreMessages,
    maxOutputTokens: AI_MAX_TOKENS,
    temperature: AI_TEMPERATURE,
    abortSignal: req.signal,
    tools: {
      scoreLead: {
        description:
          "Score a site visitor as a hiring/collaboration lead based on their interest, role, and timeline.",
        inputSchema: scoreLeadInputSchema,
        execute: async (input) => scoreLead(input),
      },
      sendInquiry: {
        description:
          "Ask the visitor to confirm before their inquiry is sent to Murk. Requires explicit user confirmation — no execute function on purpose.",
        inputSchema: sendInquiryInputSchema,
      },
      searchPortfolio: {
        description:
          "Look up a specific, real fact about Murk (background, tech stack, pricing, certifications, experience, etc.) before answering. Use this instead of guessing whenever the visitor asks something factual about Murk rather than making general conversation.",
        inputSchema: searchPortfolioInputSchema,
        execute: async ({ query }) => {
          const results = searchPortfolio(query);
          if (results.length === 0) {
            return { found: false, note: "No matching info found — answer generally and suggest they email Murk directly for specifics." };
          }
          return { found: true, results };
        },
      },
    },
  });

  return result.toUIMessageStreamResponse({
    onError: (error) => {
      // Surface real, user-facing error text (e.g. scoreLead's thrown
      // Error, or our simulated failure above) instead of the SDK's
      // default masked message.
      if (error instanceof Error) return error.message;
      return "Something went wrong running that tool.";
    },
  });
}