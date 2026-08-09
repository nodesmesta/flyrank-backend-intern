import type { Metadata } from 'next';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './globals.css';

export const metadata: Metadata = {
  title: 'Muhamad Jamaludin — Let\'s Build The Future',
  description: 'Backend AI Engineer building agents, agentic APIs, and security-first tooling. Surabaya, Indonesia.',
  icons: { icon: '/img/logo.png' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}