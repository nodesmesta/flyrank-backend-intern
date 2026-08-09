import type { Metadata } from 'next';
import Hero from '../components/Hero';
import FeaturedWork from '../components/FeaturedWork';
import CtaBanner from '../components/CtaBanner';

export const metadata: Metadata = {
  title: 'Muhamad Jamaludin — Let\'s Build The Future',
  description: 'Backend AI Engineer building agents, agentic APIs, and security-first tooling. Surabaya, Indonesia.',
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedWork />
      <CtaBanner />
    </>
  );
}