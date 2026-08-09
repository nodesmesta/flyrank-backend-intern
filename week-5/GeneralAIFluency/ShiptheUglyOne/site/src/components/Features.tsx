// Asset Guard — features from the week-3 content map.
const features = [
  {
    title: 'Upload & Analyze',
    body: 'Upload any asset document (PDF) — the system reads, extracts, and structures the data automatically.',
  },
  {
    title: 'Productivity Score',
    body: 'Every asset gets a transparent 0–100 score with a clear breakdown of what is driving it.',
  },
  {
    title: 'Improvement Steps',
    body: 'Specific, actionable next steps per asset — not generic advice.',
  },
  {
    title: 'Live Monitoring',
    body: 'Automated scraping using asset names as keywords — detects new opportunities or risks continuously.',
  },
  {
    title: 'All-in-One Dashboard',
    body: 'Every asset, every score, every alert — one view.',
  },
];

export default function Features() {
  return (
    <section>
      <h2>Features</h2>
      {features.map((f) => (
        <div className="feature" key={f.title}>
          <h3>{f.title}</h3>
          <p>{f.body}</p>
        </div>
      ))}
    </section>
  );
}