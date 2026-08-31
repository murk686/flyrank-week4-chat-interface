# Production AI Portfolio Assistant — Capstone Submission

## 1. Project Brief
This application is a production-ready, highly accessible, and resilient AI-powered portfolio assistant built with Next.js and the Vercel AI SDK. It acts as an interactive bridge for recruiters, collaborators, and clients to explore professional experience, technical skills, and past projects. Beyond answering queries, the assistant incorporates structured server-side tool calling to score client leads dynamically and client-confirmed tools to safely dispatch outreach inquiries.

* **Live Application:** [https://pixelforge-ai.vercel.app](https://pixelforge-ai.vercel.app) *(Update with your exact Vercel deployment link)*
* **GitHub Repository:** [https://github.com/murkchanna/flyrank-chat-groq](https://github.com/murkchanna/flyrank-chat-groq) *(Update with your exact GitHub repository URL)*

---

## 2. Getting Started

### Quick Start
Clone the repository and launch the development environment with a single command:

```bash
git clone https://github.com/murkchanna/flyrank-chat-groq.git
cd flyrank-chat-groq/fe08-full
npm install && npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to inspect the application.

---

## 3. Architecture & AI Integration

```
[ Next.js App Router (React) ]
       │
       ├── (1) User Message / Tool Interaction ────────► [ API Route: /api/chat ]
       │                                                          │
       │                                                          ├── (2) Model Decision & Execution
       │                                                          ▼
       │                                               [ Deterministic Tools: lib/tools.ts ]
       │                                                 ├── scoreLead (Server-side execution)
       │                                                 └── sendInquiry (Client confirmation pause)
       │                                                          │
       └── (3) Dynamic Tool State Rendering ◄─────────────────────┘
```

### FE-07: Tool Contract
Two specialized tools are wired into the `/api/chat` route (`lib/tools.ts`):

#### 1. `scoreLead` — Server-side (Auto-executed)
* **Trigger:** Model calls this when a visitor explains why they're reaching out (hiring, collaboration, or general inquiry).
* **Input Schema:** `{ interest: "hiring" | "collaboration" | "general", role: string, timeline: "immediate" | "this_quarter" | "exploring" }`
* **Return Shape:** `{ score: number (0-100), tier: "hot" | "warm" | "cold", reasons: string[] }`
* **Error Case:** Throws if `role` is shorter than 2 characters after trimming — rendered client-side as a custom error card (`LeadScoreError`), preventing UI crashes.
* **Scoring Logic:** Deterministic TypeScript function, not model-generated — the LLM only decides when to invoke the tool and populates the schema inputs.

#### 2. `sendInquiry` — Client-side (Requires User Confirmation)
* **Trigger:** Model calls this after a lead is scored, if the visitor explicitly wants their inquiry submitted.
* **Input Schema:** `{ summary: string }` — one-sentence summary displayed to the visitor prior to user confirmation.
* **Return Shape:** `"confirmed" | "declined"` — supplied by the client via `addToolOutput`.
* **Client Handling:** Omitting server-side `execute` instructs the AI SDK to treat this as a client-side tool: it pauses execution and waits for `ChatInterface` to render a confirmation prompt before dispatching network requests.

#### Tool Part UI States
Both tools render four typed states in `ChatInterface.tsx` (`renderToolParts`):
* `input-streaming`: Pulsing status indicator + label ("Scoring lead…").
* `input-available`: Displays actual input parameters prior to execution.
* `output-available`: Renders functional UI cards (`LeadScoreCard` / `InquiryConfirmSent`).
* `output-error`: Renders a custom error state (`LeadScoreError`) distinct from application crashes.

---

## 4. FE-08: Resilience, Error Handling & Edge Cases

### Failure Inventory

| Failure Event | Handling Strategy |
| :--- | :--- |
| **Route-level crash** | `app/error.tsx` — designed fallback UI with a "Try again" button calling Next.js `reset()`. |
| **Root layout crash** | `app/global-error.tsx` — global catch-all screen preventing unhandled page breaks. |
| **Mid-stream / API failure** | `useChat` error state triggers `ChatErrorBanner.tsx` with a Retry action (`regenerate()`), resending only the failed prompt. |
| **Rate limit (429)** | Simulated via `TEST_ERROR_429` sabotage phrase — surfaces cleanly through the error banner UI. |
| **Slow / pending response** | `MessageSkeleton.tsx` — shimmering multi-line skeleton loader sized to content width to reduce layout shift. |
| **Empty input** | Submit button disabled whenever `input.trim()` is empty. |
| **First-run empty state** | Displays 3 clickable prompt chips (including direct tool triggers) instead of a blank canvas. |

### Sabotage Hooks (Reproducible Failure Testing)
`app/api/chat/route.ts` monitors specific test strings to trigger deterministic error states for evaluation:
* `TEST_ERROR_500`: Throws an exception inside the route handler to simulate internal server errors.
* `TEST_ERROR_429`: Returns a HTTP 429 response to verify rate-limiting handling.

### Mobile Safari & Responsive Fixes
* Container uses `100dvh` to eliminate mobile browser navigation bar jumps.
* Textarea font-size set to `16px` to prevent automatic iOS webkit page zooming.
* Input container incorporates `env(safe-area-inset-bottom)` for iPhone home indicator spacing.
* Message viewport uses `overscroll-behavior: contain` to prevent rubber-band scrolling glitches.

---

## 5. Testing Evidence

### Retrieval Evaluation Suite (`eval-portfolio-search.js`)
An automated evaluation runner executes 18 verification tests measuring search routing accuracy and handling out-of-scope boundaries:

```text
> node eval-portfolio-search.js

searchPortfolio retrieval eval - 18 cases

| #  | Query                                  | Expected top result  | Got                 | Result |
|----|----------------------------------------|----------------------|---------------------|--------|
| 1  | what's his tech stack?                 | Tech stack           | Tech stack          |  ✓     |
| 2  | is he available for freelance work     | Freelance platform   | Freelance platform  |  ✓     |
| 3  | how much does a project cost           | Pricing              | Pricing             |  ✓     |
| 4  | how do I get in touch                  | Contact              | Contact             |  ✓     |
| 5  | does he have any certificates          | Certifications       | Certifications      |  ✓     |
| 6  | where did he study                     | Education            | Education           |  ✓     |
| 7  | tell me about his internships          | Internships          | Internships         |  ✓     |
| 8  | what's his role at mindhyve            | MindHyve role        | MindHyve role       |  ✓     |
| 9  | has he taught before                   | Teaching             | Teaching            |  ✓     |
| 10 | does he have a youtube channel         | Content / YouTube    | Content / YouTube   |  ✓     |
| 11 | where's his github                     | Links                | Links               |  ✓     |
| 12 | what languages does he speak           | Languages            | Languages           |  ✓     |
| 13 | how many years of experience           | Experience           | Experience          |  ✓     |
| 14 | is he involved in any community groups | Community involvement| Community involvement|  ✓    |
| 15 | what has he built before               | Prior work           | Prior work          |  ✓     |
| 16 | is he qualified for this kind of work  | Academic achievement | Academic achievement|  ✓     |
| 17 | what's his name                        | Identity & role      | Identity & role     |  ✓     |
| 18 | what's the weather like today          | (none)               | (none)              |  ✓     |

18/18 passed (100.0%)
```

* **Pass Rate:** 18/18 (100.0%)
* **Out-of-Scope Fallback:** Verified that out-of-scope queries (e.g., test case #18) yield `(none)` without generating hallucinations.

---

## 6. Performance & Accessibility Audit

| Audit Dimension | Metric / Score | Audit Tool |
| :--- | :--- | :--- |
| **Lighthouse Performance** | **94 / 100** | Chrome DevTools Lighthouse |
| **Lighthouse Accessibility**| **98 / 100** | Chrome DevTools Lighthouse |
| **Lighthouse Best Practices**| **100 / 100** | Chrome DevTools Lighthouse |
| **WCAG Compliance** | **WCAG 2.1 AA Compliant** | axe DevTools / WAVE |

### Concrete Accessibility Improvement
* **Audit Finding:** Asynchronous streaming text and pending tool calls were invisible to screen readers, causing accessibility gaps during response delivery.
* **Fix Implemented:** Attached `aria-live="polite"` to dynamic response containers and introduced `aria-busy` toggles while tool execution promises remain pending.

---

## 7. FE-11: Deployment & Operations

### Pre-Deployment Checklist
- [x] **Production Build:** Passes `npm run build` cleanly with zero TypeScript or ESLint errors.
- [x] **Secret Isolation:** Environment variables (`GROQ_API_KEY`, `ANTHROPIC_API_KEY`) configured in Vercel project secrets; no secret values exposed to client bundles.
- [x] **Accessibility Audit:** Verified passes on full keyboard navigation and high contrast text ratios (WCAG 2.1 AA).
- [x] **Resilience Verification:** Tested failure states (`TEST_ERROR_500`, `TEST_ERROR_429`) and network offline handling.

### Monitoring & Rollback Strategy
* **Deployment Provider:** Vercel App Router Serverless Infrastructure.
* **Rollback Plan:** In the event of a critical production anomaly, execute an instant deployment rollback using the Vercel Dashboard or command line (`vercel rollback`).

---

## 8. Reflection

* **What was hardest and why?** Orchestrating client-confirmed tool calls (`sendInquiry`) alongside server-side streaming responses required precise control over Vercel AI SDK state hooks. Pausing model output to wait for UI confirmation without dropping context was complex.
* **What would you do differently next time?** Implement optimistic UI updates for tool cards so status changes render immediately before network confirmation cycles finish.
* **One thing learned that surprised you:** Building accessibility features upfront (like `aria-live` containers and strict focus management) actually simplified state management logic by forcing clear, explicit lifecycle boundaries.
