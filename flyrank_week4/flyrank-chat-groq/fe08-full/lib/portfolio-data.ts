/**
 * lib/portfolio-data.ts
 * ─────────────────────────────────────────────────────────────
 * FE-10 addition: lightweight, lexical (keyword-based) retrieval
 * over Murk's real portfolio facts — grounds the chat assistant's
 * answers in actual data instead of a hardcoded system-prompt
 * summary or (worse) the model guessing.
 *
 * Design decision: this is deliberately NOT vector-embedding RAG.
 * A real embedding pipeline needs an embeddings API call per query,
 * a vector store (Pinecone/Upstash Vector/pgvector), and ongoing
 * cost — meaningful overhead for what is, honestly, about a dozen
 * short facts. Keyword scoring over a small, hand-maintained array
 * gets the same practical outcome (answers grounded in real data,
 * not hallucinated) at zero infrastructure cost and zero latency
 * beyond a plain function call. If this knowledge base grew to
 * hundreds of entries, that tradeoff would flip — noted as a real
 * limitation, not hidden.
 * ─────────────────────────────────────────────────────────────
 */

export interface PortfolioEntry {
    topic: string;
    keywords: string[];
    content: string;
  }
  
  export const PORTFOLIO_KB: PortfolioEntry[] = [
    {
      topic: "Identity & role",
      keywords: ["name", "who", "channa", "murk", "role", "title", "genai", "developer"],
      content:
        "Murk Sikandar Channa — GenAI Developer, Python Engineer, and IT Educator, based in Naushahro Feroze, Sindh, Pakistan.",
    },
    {
      topic: "Experience",
      keywords: ["experience", "years", "freelance", "since", "how long", "background"],
      content:
        "Freelancing as an AI & Python developer since 2022 — roughly 3+ years of hands-on experience building AI-powered tools and applications.",
    },
    {
      topic: "Freelance platform",
      keywords: ["upwork", "freelance", "hire", "available", "platform", "gig"],
      content: "Available for freelance work — takes on projects via Upwork.",
    },
    {
      topic: "Academic achievement",
      keywords: ["medal", "silver", "qualified", "award", "achievement", "school", "academic"],
      content: "Silver Medalist academically — a recognized top performer in formal education.",
    },
    {
      topic: "Certifications",
      keywords: ["certificate", "certification", "google", "it support", "credential"],
      content: "Holds a Google IT Support Professional Certificate among other credentials.",
    },
    {
      topic: "Education",
      keywords: ["university", "sindh", "study", "studied", "degree", "college"],
      content: "Studied at the University of Sindh.",
    },
    {
      topic: "Prior work / what's been built",
      keywords: ["built", "made", "projects", "portfolio", "document", "assistant", "demo"],
      content:
        "Has built AI-powered document assistants and chatbots (e.g. RAG-style Q&A tools), plus this very portfolio site — custom WebGL shader background, a Three.js 3D hover-bot, and a streaming AI chat agent with tool-calling.",
    },
    {
      topic: "Tech stack",
      keywords: ["stack", "tech", "langchain", "tools", "technologies", "framework"],
      content:
        "Core stack centers on Python, LangChain for AI/agent tooling, and modern frontend work (React, Next.js, TypeScript) for shipping those AI features as real products.",
    },
    {
      topic: "Internships",
      keywords: ["internship", "intern", "flyrank", "experience", "company", "worked at"],
      content: "Completed an AI Frontend Engineering internship at FlyRank Corp.",
    },
    {
      topic: "MindHyve role",
      keywords: ["mindhyve", "ambassador", "agentic", "role"],
      content: "Serves as Agentic AI Ambassador at MindHyve.",
    },
    {
      topic: "Teaching",
      keywords: ["teach", "teaching", "trainer", "instructor", "navttc", "student", "taught"],
      content: "Has taught / trained others through NAVTTC.",
    },
    {
      topic: "Community involvement",
      keywords: ["community", "she plus tech", "women in tech", "group", "involved"],
      content: "Involved with She Plus Tech, a community supporting women in tech.",
    },
    {
      topic: "Content / YouTube",
      keywords: ["youtube", "channel", "content", "videos", "pynerd"],
      content: "Runs a YouTube channel, PyNerd, covering Python/AI content.",
    },
    {
      topic: "Languages",
      keywords: ["language", "speak", "urdu", "communicate"],
      content: "Speaks Urdu (alongside English for professional/technical communication).",
    },
    {
      topic: "Pricing",
      keywords: ["price", "cost", "budget", "how much", "rate", "fee"],
      content: "Project pricing starts around $250, scaling with scope — best discussed directly for an accurate quote.",
    },
    {
      topic: "Contact",
      keywords: ["contact", "email", "reach", "get in touch", "message"],
      content: "Best reached by email at murkchanna26@gmail.com, or via the contact form / chat on the portfolio site.",
    },
    {
      topic: "Links",
      keywords: ["github", "linkedin", "resume", "cv", "profile", "code"],
      content: "GitHub, LinkedIn, and other links are in the portfolio site's footer.",
    },
  ];
  
  /**
   * Lexical scoring: counts how many of an entry's keywords appear as
   * substrings of the (lowercased) query, plus a small bonus if the
   * topic name itself appears. Returns entries sorted best-first,
   * filtered to only those with at least one match.
   */
  export function searchPortfolio(query: string, maxResults = 2): PortfolioEntry[] {
    const q = query.toLowerCase();
    const scored = PORTFOLIO_KB.map((entry) => {
      let score = 0;
      for (const kw of entry.keywords) {
        if (q.includes(kw)) score += 1;
      }
      if (q.includes(entry.topic.toLowerCase())) score += 1;
      return { entry, score };
    }).filter((s) => s.score > 0);
  
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, maxResults).map((s) => s.entry);
  }