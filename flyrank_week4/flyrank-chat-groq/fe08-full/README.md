# FlyRank Chat — Streaming AI Assistant with Tool-Calling

A Next.js chat interface that streams AI responses token-by-token and can act as a lightweight lead-qualification agent for site visitors — it scores hiring/collaboration inquiries automatically, and asks for explicit human confirmation before sending anything to Murk.

**Demo video:** https://youtu.be/qFHN2KvmD5o
**Live demo:** `<add your deployed Vercel URL here once the redeploy is fixed>` — shown running locally in the demo video above in the meantime.
**Who it's for:** recruiters, clients, or collaborators visiting the portfolio site who want to ask questions and, if relevant, get evaluated as a lead and have their inquiry forwarded — without needing a contact form.

---

## Setup (from scratch, no prior context needed)

**Requirements:** Node.js 18+, and a free [Groq API key](https://console.groq.com) (no credit card required).

```bash
git clone <repo-url>
cd flyrank-chat
npm install
```

Create a file named `.env` in the project root with:

```
GROQ_API_KEY=your_key_here
```

Then run:

```bash
npm run dev
```

Open `http://localhost:3000` — the chat interface loads immediately, no further config needed.

> ⚠️ `.env` holds a real secret. Make sure your `.gitignore` excludes plain `.env` (not just `.env.local`) before you ever push — otherwise the key ends up public on GitHub.

---

## Usage

- Type a message and hit **Enter** or **⌘/Ctrl+Enter** to send. Responses stream in token-by-token.
- Click the **stop button** (square icon) mid-response to abort generation — the partial reply stays in the conversation instead of vanishing.
- Say something like *"I'm a hiring manager evaluating you for a role, I need someone in the next few weeks"* — the assistant will ask any missing details (role/timeline/interest) and then call the `scoreLead` tool automatically, showing a scored result card (hot/warm/cold + reasons).
- After being scored, say *"yes, send that to Murk"* — the assistant prepares a one-line summary and shows a **confirm/decline prompt**. Nothing is sent until you explicitly click confirm.
- To see the error/retry flow without waiting for a real outage, type exactly `TEST_ERROR_500` or `TEST_ERROR_429` — these are built-in test hooks (see Architecture) that trigger a real failure response so the error banner + retry button can be demonstrated reliably.

---

## Architecture

```
app/api/chat/route.ts     Server route. Receives the message history,
                           calls Groq (llama-3.3-70b-versatile) via the
                           Vercel AI SDK's streamText(), streams the
                           response back as SSE. Registers two tools
                           (below) that the model can call mid-stream.
                           Also hosts two hardcoded "sabotage hooks" —
                           magic strings that trigger a real 429 or 500
                           on purpose, for reliable demo/testing of the
                           failure path.

lib/ai-config.ts          Single source of truth for model name, system
                           prompt, temperature, max tokens.

lib/tools.ts               scoreLead   — server-side tool, runs automatically.
                                         Deterministic scoring function
                                         (not model output) — same input
                                         always gives the same score.
                            sendInquiry — client-side tool, NO execute
                                         function on purpose. This makes
                                         the AI SDK pause and wait for the
                                         browser to supply a result, which
                                         is what forces the human-confirm
                                         step below.

components/
  ChatInterface.tsx        useChat() hook — streaming state, stop/retry,
                           auto-scroll, renders tool-call cards inline
                           with the conversation.
  ChatErrorBanner.tsx      Shown when a request/stream fails. Retry calls
                           regenerate(), which re-sends only the last
                           user message, not the whole conversation.
  ToolParts.tsx            Visual states for the two tools: pending,
                           scored result, confirm/decline prompt, sent/
                           declined outcome.
```

**Data flow for a lead:** visitor message → model decides to call `scoreLead` → server runs deterministic scoring → result card renders in chat → if visitor wants to proceed → model calls `sendInquiry` (no execute) → SDK pauses → confirm/decline UI renders → visitor clicks → `addToolOutput()` resumes the model with the visitor's choice → model responds accordingly. Nothing is ever sent without that click.

---

## Eval results (v2)

`scoreLead` is deterministic (plain code, not model output), so it's directly unit-testable. `eval-scorelead.js` runs 10 cases against it — category weighting, exact tier boundaries (40/70 cutoffs), case-insensitive decision-maker detection, the 100-point clamp, and the two designed failure paths (empty/too-short role).

**Result: 10/10 passed (100%)**

```bash
node eval-scorelead.js   # reproduces the table below
```

| Case | Result |
|---|---|
| Hiring + immediate + decision-maker title → 100, hot | ✅ |
| Hiring + immediate + non-decision-maker title → 85, hot | ✅ |
| Collaboration + this_quarter + Founder → 65, warm | ✅ |
| General + exploring → 15, cold | ✅ |
| Exact tier boundary at 70 → hot | ✅ |
| Exact tier boundary at 40 → warm | ✅ |
| Case-insensitive title match ("ceo" lowercase) | ✅ |
| Too-short role (1 char) → throws as designed | ✅ |
| Whitespace-only role → throws as designed | ✅ |
| Score clamps at 100, never exceeds | ✅ |

This eval covers the deterministic tool logic, not the LLM's judgment calls (e.g. *when* it decides to call the tool, or how it phrases follow-up questions) — those are harder to pin to an exact expected output and weren't scored here.

---

## Limitations

- **The `/api/chat` route has no authentication or rate limiting of its own** — anyone with the URL can send requests and consume the Groq API quota. Groq's free tier has its own rate limits, but nothing in this app stops abuse before that. A production version would need per-IP or per-session rate limiting on the route itself.
- **No persistent chat history** — conversation state lives only in the browser tab; refreshing the page loses it. There's no database or session store.
- **Model choice is cost-driven, not capability-driven** — Groq's `llama-3.3-70b-versatile` was chosen because it has a genuinely free tier (Anthropic/Google's free tiers were either paid-only or quota-restricted in testing). This is a real quality trade-off: Llama 3.3 70B is capable but generally reasons less reliably than Claude/GPT-4-class models, especially on ambiguous tool-calling decisions.
- **Vercel's 30-second function timeout** (`maxDuration = 30`) caps how long a single response can stream — very long generations could get cut off mid-stream.
- **The `sendInquiry` tool has no actual send implementation wired up yet** — the confirm/decline UI and state machine are fully built, but confirming currently just marks the tool call "confirmed" client-side rather than dispatching a real email/webhook. The guardrail (never send without confirmation) is real; the send action itself is a stub.

---

## Built with AI

This project was built with **Claude** and **Cursor (Composer)** as coding assistants across several weekly iterations (streaming chat, tool-calling, error states). I made the architectural calls — which tools to add, that `sendInquiry` should require explicit confirmation rather than auto-sending, and the Groq-over-Anthropic provider decision — and tested the app manually myself each week. Claude also helped me write this README and build the `eval-scorelead.js` test harness, and caught a real security issue while reviewing the code: `.gitignore` wasn't actually excluding my `.env` file, which I've since fixed.
