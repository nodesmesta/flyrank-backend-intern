import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Muhamad Jamaludin — Let's Build The Future",
  description:
    "Muhamad Jamaludin — Backend AI Engineer building agents, agentic APIs, and security-first tooling. Surabaya, Indonesia.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
