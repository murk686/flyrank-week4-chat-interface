/**
 * app/api/chat/route.ts
 * ─────────────────────────────────────────────────────────────
 * Server-side route handler for streaming chat completions.
 *
 * NOTE: Using Groq instead of Anthropic Claude or Google Gemini.
 * Reason: Anthropic API requires paid plan. Gemini free tier has
 * zero quota in some regions. Groq provides a genuinely free tier
 * with fast inference via console.groq.com — no credit card needed.
 * The streaming architecture is identical regardless of provider.
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

export const maxDuration = 30;

export async function POST(req: Request) {
  const body = await req.json();

  const groq = createGroq({
    apiKey: process.env.GROQ_API_KEY,
  });

  const coreMessages = await convertToModelMessages(body.messages as UIMessage[]);

  const result = streamText({
    model: groq(AI_MODEL),
    system: SYSTEM_PROMPT,
    messages: coreMessages,
    maxOutputTokens: AI_MAX_TOKENS,
    temperature: AI_TEMPERATURE,
    abortSignal: req.signal,
  });

  return result.toUIMessageStreamResponse();
}
