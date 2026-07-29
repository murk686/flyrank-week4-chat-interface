import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlyRank AI — Streaming Chat",
  description: "FE-06 capstone: streaming AI chat built with Next.js, AI SDK, and Claude",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased overflow-hidden">{children}</body>
    </html>
  );
}
