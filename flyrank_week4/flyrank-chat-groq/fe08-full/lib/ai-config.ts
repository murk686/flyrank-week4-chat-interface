/**
 * ai-config.ts
 * ─────────────────────────────────────────────────────────────
 * Single source of truth for all AI model configuration.
 * Change the model, system prompt, or sampling parameters here
 * — nowhere else in the codebase.
 *
 * NOTE: This project uses Groq instead of Anthropic Claude.
 * Reason: the Anthropic API requires a paid plan with no free tier
 * available. Groq provides a genuinely free API tier via
 * console.groq.com, gated only by rate limits, with no credit card
 * required — making it accessible for internship/learning projects.
 * The streaming implementation, architecture, and all FE-06
 * requirements remain identical — only the model provider differs.
 *
 * MODEL HISTORY: originally "llama-3.3-70b-versatile". Groq
 * deprecated and removed that model entirely; requests to it now
 * fail with "model does not exist". Switched to "openai/gpt-oss-120b",
 * Groq's current recommended general-purpose replacement.
 * ─────────────────────────────────────────────────────────────
 */

/** The Groq model to use for all chat completions. */
export const AI_MODEL = "openai/gpt-oss-120b";

/**
 * Maximum tokens the model may generate per response.
 * Keep this reasonable so streaming stays snappy.
 */
export const AI_MAX_TOKENS = 1024;

/**
 * Temperature: 0 = deterministic, 1 = creative.
 * 0.7 is a good balance for helpful, varied responses.
 */
export const AI_TEMPERATURE = 0.7;

/**
 * System prompt injected at the top of every conversation.
 * Defines the assistant's persona, capabilities, and constraints.
 */
export const SYSTEM_PROMPT = `You are a helpful, concise AI assistant built as part of a FlyRank internship capstone project.

Your goals:
- Give clear, accurate answers
- Use markdown formatting when it improves readability (code blocks, lists, bold)
- Be conversational but professional
- Keep responses focused — don't pad unnecessarily

When writing code, always specify the language in fenced code blocks.
When referencing technical concepts, be precise but accessible.`;