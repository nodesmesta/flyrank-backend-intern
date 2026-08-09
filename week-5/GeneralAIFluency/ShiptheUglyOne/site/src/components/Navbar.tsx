'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Home' },
  { href: '/work', label: 'Work' },
  { href: '/asset-guard', label: 'Asset Guard' },
  { href: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="nav">
      <Link className="brand" href="/">
        <Image src="/img/logo.png" alt="Monogram logo" width={30} height={30} priority />
        Muhamad Jamaludin
      </Link>
      <div className="links">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={pathname === l.href ? 'active' : undefined}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}