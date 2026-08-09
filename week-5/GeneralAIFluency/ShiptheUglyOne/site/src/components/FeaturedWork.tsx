// Featured Work — three cards linking into the Work and Asset Guard pages.
export default function FeaturedWork() {
  const cards = [
    {
      meta: 'Personal Agent',
      title: 'Asset Signal Scout',
      href: '/work',
      body: 'A scripted agent (TypeScript) that watches assets via Bright Data search, classifies signals, and writes a daily report — an MVP that ran end to end with a live data connection.',
      stack: 'TypeScript · Bright Data MCP',
    },
    {
      meta: 'Product Design',
      title: 'Asset Guard',
      href: '/asset-guard',
      body: 'A SaaS concept that makes stuck assets visible — upload a document, get a transparent 0–100 productivity score, concrete next steps.',
      stack: 'Design · Flow · Scoring',
    },
    {
      meta: 'Hackathons & Audits',
      title: 'Competitive Builds',
      href: '/work',
      body: '1st & 2nd place in global hackathons (2,300+ participants) and 11 competitive security audit payouts — TrademarkGuardAI, ClaimPilot.',
      stack: 'Hackathon · Security Research',
    },
  ];

  return (
    <section>
      <h2>Featured Work</h2>
      <div className="grid">
        {cards.map((c) => (
          <div className="card" key={c.title}>
            <span className="meta">{c.meta}</span>
            <h3><a href={c.href}>{c.title}</a></h3>
            <p>{c.body}</p>
            <span className="stack">{c.stack}</span>
          </div>
        ))}
      </div>
    </section>
  );
}