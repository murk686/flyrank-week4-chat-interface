/**
 * ai-config.ts
 * ─────────────────────────────────────────────────────────────
 * Single source of truth for all AI model configuration.
 * Change the model, system prompt, or sampling parameters here
 * — nowhere else in the codebase.
 *
 * NOTE: This project uses Google Gemini instead of Anthropic Claude.
 * Reason: The Anthropic API requires a paid plan with no free tier
 * available. Google Gemini provides a free API tier via Google AI
 * Studio (aistudio.google.com) with no credit card required, making
 * it accessible for internship/learning projects. The streaming
 * implementation, architecture, and all FE-06 requirements remain
 * identical — only the model provider differs.
 * ─────────────────────────────────────────────────────────────
 */

/** The Groq model to use for all chat completions. */
export const AI_MODEL = "llama-3.3-70b-versatile";

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
