import type { Metadata } from 'next';
import { WorkList } from '../../components/WorkList';
import CtaBanner from '../../components/CtaBanner';

export const metadata: Metadata = {
  title: 'Work — Muhamad Jamaludin',
  description: 'Cases and projects: Asset Signal Scout, polite scraping pipeline, hackathon builds, security audits.',
};

export default function WorkPage() {
  return (
    <>
      <section className="hero" style={{ paddingBottom: 12 }}>
        <h1>Real Work</h1>
        <p className="elevator">
          Every project below is real and in this repository — no placeholder slots.
        </p>
      </section>
      <section>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          <WorkList />
        </div>
      </section>
      <CtaBanner />
    </>
  );
}