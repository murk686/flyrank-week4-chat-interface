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
import { scoreLead, scoreLeadInputSchema, sendInquiryInputSchema } from "@/lib/tools";

export const maxDuration = 30;

const TOOL_SYSTEM_ADDENDUM = `

You also help visitors who are reaching out about hiring or collaboration.
When a visitor explains why they're contacting Murk, use the scoreLead tool
to score them — you need their interest category, role/title, and timeline.
Ask a brief follow-up if any of those three are missing; don't guess at them.

After scoring a lead, if the visitor wants their inquiry actually sent to
Murk, use the sendInquiry tool with a one-sentence summary. This always
requires the visitor's explicit confirmation before anything is sent —
never say or imply it has already been sent.`;

export async function POST(req: Request) {
  const body = await req.json();

  const groq = createGroq({
    apiKey: process.env.GROQ_API_KEY,
  });

  const coreMessages = await convertToModelMessages(body.messages as UIMessage[]);

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
    },
  });

  return result.toUIMessageStreamResponse({
    onError: (error) => {
      // Surface real, user-facing error text (e.g. scoreLead's thrown
      // Error) instead of the SDK's default masked message.
      if (error instanceof Error) return error.message;
      return "Something went wrong running that tool.";
    },
  });
}
