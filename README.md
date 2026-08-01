This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
## FE-07: Tool Contract

Two tools are wired into the `/api/chat` route (`lib/tools.ts`).

### `scoreLead` — server-side (auto-executed)

| | |
|---|---|
| **Trigger** | Model calls this when a visitor explains why they're reaching out (hiring / collaboration / general). |
| **Input schema** | `{ interest: "hiring" \| "collaboration" \| "general", role: string, timeline: "immediate" \| "this_quarter" \| "exploring" }` |
| **Return shape** | `{ score: number (0-100), tier: "hot" \| "warm" \| "cold", reasons: string[] }` |
| **Error case** | Throws if `role` is shorter than 2 characters after trimming — rendered client-side as a designed error card, not a crash. |

Scoring logic is plain deterministic code (`lib/tools.ts`), not model-generated — the LLM only decides *when* to call the tool and *what* to pass in.

### `sendInquiry` — client-side (requires user confirmation)

| | |
|---|---|
| **Trigger** | Model calls this after a lead is scored, if the visitor wants their inquiry sent. |
| **Input schema** | `{ summary: string }` — one-sentence summary shown to the visitor before they confirm. |
| **Return shape** | `"confirmed" \| "declined"` — supplied by the client via `addToolOutput`, not the server. |
| **Why no `execute`** | Omitting `execute` on the server is what makes the AI SDK treat this as a client-side tool: it pauses and waits for `ChatInterface` to render a Yes/No prompt and call `addToolOutput` once the visitor decides. Nothing is sent until that confirmation happens. |

### Tool part states

Both tools render all four typed states distinctly in `ChatInterface.tsx` (see `renderToolParts`):

- **input-streaming** — pulsing dot + label ("Scoring lead…")
- **input-available** — same pending treatment, now showing the actual input the model is about to send
- **output-available** — the real result component (`LeadScoreCard` / `InquiryConfirmSent`)
- **output-error** — a designed error card (`LeadScoreError`), distinct from a crash or raw JSON

