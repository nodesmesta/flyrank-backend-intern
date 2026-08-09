// Work page — real cases, each opens from a card. No placeholders.
const cases = [
  {
    meta: 'Personal Agent · MVP',
    title: 'Asset Signal Scout',
    tagline: 'Agent that watches assets and writes a daily signal report.',
    body: 'A scripted TypeScript agent: Bright Data MCP client for live search, a classifier that turns raw SERPs into opportunity/risk signals, and a report generator. Ran end to end with a real data connection — reports, run log, and terminal capture included in the repo.',
    stack: 'TypeScript · Bright Data MCP · Node',
  },
  {
    meta: 'Backend · Week 5',
    title: 'Polite Scraper Pipeline',
    tagline: 'A rate-limited crawler with a clean corpus.',
    body: 'Express API that crawls a book catalogue politely (delayed requests, retries), extracts with cheerio selectors, and stores a cleaned JSONL + SQLite corpus — an honest pipelined gather→clean→store flow.',
    stack: 'Express · Cheerio · SQLite',
  },
  {
    meta: 'Hackathons · Global',
    title: 'TrademarkGuardAI · ClaimPilot · BIM-Forge',
    tagline: '1st and 2nd place, 2,300+ participants.',
    body: 'AI products built under global hackathon pressure — trademark monitoring, automated insurance claims, and BIM tooling. Awarded first and second place across competitions.',
    stack: 'AI · Rapid Build',
  },
  {
    meta: 'Security Research',
    title: 'Competitive Audits — 11 Payouts',
    tagline: 'Top 10 and Top 25 finishes.',
    body: 'Competitive security auditing on Cantina TELECOM and Sherlock contests — 11 payouts from real finding reports on blockchain and application security.',
    stack: 'Auditing · Blockchain',
  },
];

export default function WorkCard({ c }: { c: (typeof cases)[number] }) {
  return (
    <div className="card">
      <span className="meta">{c.meta}</span>
      <h3>{c.title}</h3>
      <p><em>{c.tagline}</em></p>
      <p>{c.body}</p>
    </div>
  );
}

export function WorkList() {
  return (
    <>
      {cases.map((c) => (
        <WorkCard key={c.title} c={c} />
      ))}
    </>
  );
}