// portfolio-search-core.js — JS port of lib/portfolio-data.ts
// (TS types stripped only; logic copied verbatim, nothing changed)

const PORTFOLIO_KB = [
    { topic: "Identity & role", keywords: ["name","who","channa","murk","role","title","genai","developer"], content: "Murk Sikandar Channa — GenAI Developer, Python Engineer, and IT Educator, based in Naushahro Feroze, Sindh, Pakistan." },
    { topic: "Experience", keywords: ["experience","years","freelance","since","how long","background"], content: "Freelancing as an AI & Python developer since 2022 — roughly 3+ years of hands-on experience." },
    { topic: "Freelance platform", keywords: ["upwork","freelance","hire","available","platform","gig"], content: "Available for freelance work — takes on projects via Upwork." },
    { topic: "Academic achievement", keywords: ["medal","silver","qualified","award","achievement","school","academic"], content: "Silver Medalist academically." },
    { topic: "Certifications", keywords: ["certificate","certification","google","it support","credential"], content: "Holds a Google IT Support Professional Certificate." },
    { topic: "Education", keywords: ["university","sindh","study","studied","degree","college"], content: "Studied at the University of Sindh." },
    { topic: "Prior work / what's been built", keywords: ["built","made","projects","portfolio","document","assistant","demo"], content: "Has built AI-powered document assistants and this portfolio site." },
    { topic: "Tech stack", keywords: ["stack","tech","langchain","tools","technologies","framework"], content: "Python, LangChain, React, Next.js, TypeScript." },
    { topic: "Internships", keywords: ["internship","intern","flyrank","experience","company","worked at"], content: "AI Frontend Engineering internship at FlyRank Corp." },
    { topic: "MindHyve role", keywords: ["mindhyve","ambassador","agentic","role"], content: "Agentic AI Ambassador at MindHyve." },
    { topic: "Teaching", keywords: ["teach","teaching","trainer","instructor","navttc","student","taught"], content: "Taught / trained others through NAVTTC." },
    { topic: "Community involvement", keywords: ["community","she plus tech","women in tech","group","involved"], content: "Involved with She Plus Tech." },
    { topic: "Content / YouTube", keywords: ["youtube","channel","content","videos","pynerd"], content: "Runs YouTube channel PyNerd." },
    { topic: "Languages", keywords: ["language","speak","urdu","communicate"], content: "Speaks Urdu." },
    { topic: "Pricing", keywords: ["price","cost","budget","how much","rate","fee"], content: "Project pricing starts around $250." },
    { topic: "Contact", keywords: ["contact","email","reach","get in touch","message"], content: "murkchanna26@gmail.com" },
    { topic: "Links", keywords: ["github","linkedin","resume","cv","profile","code"], content: "GitHub/LinkedIn in the footer." },
  ];
  
  function searchPortfolio(query, maxResults = 2) {
    const q = query.toLowerCase();
    const scored = PORTFOLIO_KB.map((entry) => {
      let score = 0;
      for (const kw of entry.keywords) if (q.includes(kw)) score += 1;
      if (q.includes(entry.topic.toLowerCase())) score += 1;
      return { entry, score };
    }).filter((s) => s.score > 0);
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, maxResults).map((s) => s.entry);
  }
  
  module.exports = { searchPortfolio, PORTFOLIO_KB };