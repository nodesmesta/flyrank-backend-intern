import type { Metadata } from 'next';
import Image from 'next/image';
import Features from '../../components/Features';
import Orchestration from '../../components/Orchestration';
import Pricing from '../../components/Pricing';
import CtaBanner from '../../components/CtaBanner';

export const metadata: Metadata = {
  title: 'Asset Guard — Muhamad Jamaludin',
  description: 'Asset Guard — detect stuck assets, get a transparent 0–100 productivity score and concrete next steps.',
};

export default function AssetGuardPage() {
  return (
    <>
      <section className="hero" style={{ paddingBottom: 12 }}>
        <h1>Asset Guard</h1>
        <p className="claim">Every asset has a number. Every number has a next step.</p>
        <p className="elevator">
          One dashboard to track every asset you own. No spreadsheets. No guesswork.
          Just numbers and next steps.
        </p>
        <Image
          src="/img/hero.png"
          alt="Abstract data visualization in Asset Guard purple"
          width={1200}
          height={655}
          className="hero-art"
          sizes="(max-width: 1000px) 92vw, 920px"
        />
      </section>
      <Features />
      <Orchestration />
      <Pricing />
      <CtaBanner />
    </>
  );
}