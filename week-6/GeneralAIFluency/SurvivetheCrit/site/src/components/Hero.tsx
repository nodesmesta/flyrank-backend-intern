// Hero section — the first thing a visitor sees on the landing page.
export default function Hero() {
  return (
    <section className="hero">
      <h1>Muhamad Jamaludin</h1>
      <p className="claim">
        I turn vague product ideas into AI prototypes you can test.
      </p>
      <p className="elevator">
        For product teams at early-stage startups: bring the idea, get a
        working MVP in five days.
      </p>
      <p className="highlights">
        Global hackathon wins (2,300+ participants) &middot; 11 competitive
        security audit payouts
      </p>
      <p style={{ marginTop: 26 }}>
        <a className="btn" href="/contact">Contact Me</a>{' '}
        <a className="btn secondary" href="/work">See the Work</a>
      </p>
    </section>
  );
}
