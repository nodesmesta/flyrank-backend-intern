import type { Metadata } from 'next';
import CtaBanner from '../../components/CtaBanner';

export const metadata: Metadata = {
  title: 'Contact — Muhamad Jamaludin',
  description: 'Reach Muhamad Jamaludin: LinkedIn, GitHub, resume, and booking.',
};

const rows = [
  { label: 'LinkedIn', value: 'linkedin.com/in/muhamad-jamaludin-42178830a', href: 'https://www.linkedin.com/in/muhamad-jamaludin-42178830a' },
  { label: 'GitHub', value: 'github.com/nodesmesta', href: 'https://github.com/nodesmesta' },
  { label: 'Resume', value: 'Google Drive', href: 'https://drive.google.com/file/d/1NyTV_cdbgiDt7fYmJxQ1TV-iZiIbq3Ey/view?usp=sharing' },
  { label: 'Booking', value: 'calendly.com/muhamadjamaludin', href: 'https://calendly.com/muhamadjamaludin' },
];

export default function ContactPage() {
  return (
    <>
      <section className="hero" style={{ paddingBottom: 12 }}>
        <h1>Let&apos;s talk</h1>
        <p className="elevator">
          Open to backend AI work, agentic systems, security audits, and
          collaborations. Reach me anywhere below.
        </p>
      </section>
      <section>
        <div className="contact-list">
          {rows.map((r) => (
            <div className="row" key={r.label}>
              <span className="label">{r.label}</span>
              <a className="val" href={r.href} target="_blank" rel="noopener noreferrer">{r.value}</a>
            </div>
          ))}
        </div>
      </section>
      <CtaBanner />
    </>
  );
}