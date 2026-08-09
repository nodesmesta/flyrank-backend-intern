// Hero section — the first thing a visitor sees on the landing page.
export default function Hero() {
  return (
    <section className="hero">
      <h1>Muhamad Jamaludin</h1>
      <p className="claim">Let&apos;s Build The Future</p>
      <p className="roles">
        Backend AI Engineer &middot; AI Research &amp; Innovation &middot; Security
        Compliance &amp; Audits &middot; Blockchain Architecture
      </p>
      <p className="elevator">
        I build AI that ships — agents, agentic APIs, and security-first tooling,
        proven by global hackathon awards and competitive security research.
      </p>
      <p className="highlights">
        Global hackathon wins (2,300+ participants) &middot; 11 competitive
        security audit payouts
      </p>
      <p style={{ marginTop: 26 }}>
        <a className="btn" href="/work">See the Work</a>{' '}
        <a className="btn secondary" href="/contact">Contact Me</a>
      </p>
    </section>
  );
}