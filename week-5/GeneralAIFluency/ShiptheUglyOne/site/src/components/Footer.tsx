import Link from 'next/link';

const links = [
  { href: '/', label: 'Home' },
  { href: '/work', label: 'Work' },
  { href: '/asset-guard', label: 'Asset Guard' },
  { href: '/contact', label: 'Contact' },
];

export default function Footer() {
  return (
    <footer>
      <div className="fnav">
        {links.map((l) => (
          <Link key={l.href} href={l.href}>{l.label}</Link>
        ))}
      </div>
      Muhamad Jamaludin &middot; Surabaya, Indonesia &middot; 2026
    </footer>
  );
}