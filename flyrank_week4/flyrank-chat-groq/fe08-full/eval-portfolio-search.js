// eval-portfolio-search.js — v2 eval for the searchPortfolio tool
// Each case: a realistic visitor question + the topic it SHOULD
// surface as the top result. Checks retrieval precision, not the
// model's phrasing of the final answer (that part isn't
// deterministic and isn't what this tool is responsible for).
const { searchPortfolio } = require('./portfolio-search-core.js');

const cases = [
  ["what's his tech stack?", "Tech stack"],
  ["is he available for freelance work", "Freelance platform"],
  ["how much does a project cost", "Pricing"],
  ["how do I get in touch", "Contact"],
  ["does he have any certificates", "Certifications"],
  ["where did he study", "Education"],
  ["tell me about his internships", "Internships"],
  ["what's his role at mindhyve", "MindHyve role"],
  ["has he taught before", "Teaching"],
  ["does he have a youtube channel", "Content / YouTube"],
  ["where's his github", "Links"],
  ["what languages does he speak", "Languages"],
  ["how many years of experience", "Experience"],
  ["is he involved in any community groups", "Community involvement"],
  ["what has he built before", "Prior work / what's been built"],
  ["is he qualified for this kind of work", "Academic achievement"],
  ["what's his name", "Identity & role"],
  // Adversarial: no matching topic should surface (low-signal query)
  ["what's the weather like today", null],
];

let pass = 0;
console.log(`\nsearchPortfolio retrieval eval — ${cases.length} cases\n`);
console.log('| # | Query | Expected top result | Got | Result |');
console.log('|---|-------|---------------------|-----|--------|');
cases.forEach(([q, expectedTopic], i) => {
  const results = searchPortfolio(q, 2);
  const top = results[0]?.topic ?? null;
  const ok = expectedTopic === null ? results.length === 0 : top === expectedTopic;
  if (ok) pass++;
  console.log(`| ${i+1} | ${q} | ${expectedTopic ?? '(none)'} | ${top ?? '(none)'} | ${ok ? '✅' : '❌'} |`);
});
console.log(`\n${pass}/${cases.length} passed (${((pass/cases.length)*100).toFixed(1)}%)\n`);