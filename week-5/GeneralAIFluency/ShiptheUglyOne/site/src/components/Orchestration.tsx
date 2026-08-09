// Asset Guard — the orchestration flow from the content map.
const steps = [
  { title: 'Upload', body: 'Drag and drop an asset PDF — no lengthy forms.' },
  { title: 'Analyze', body: 'The system reads, extracts, and runs the scoring engine.' },
  { title: 'Score', body: 'A transparent 0–100 productivity score with the why behind it.' },
  { title: 'Act', body: 'Specific improvement steps — the exact next move.' },
  { title: 'Monitor', body: 'Continuous scraping, alerts on new opportunities or risks.' },
];

export default function Orchestration() {
  return (
    <section>
      <h2>How It Works</h2>
      <div className="steps">
        {steps.map((s) => (
          <div className="step" key={s.title}>
            <h3>{s.title}</h3>
            <p>{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}