import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import AccountArea from "@/components/account-area";
import Link from "next/link";
import { HamburgerMenu } from "@/components/hamburger-menu";
import { Spectral, IBM_Plex_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import "./globals.css";

const spectral = Spectral({
  variable: "--font-spectral",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: { title: string; description: string } = {
  title: "PaaS Roadmap",
  description: "Roadmap product with Clerk auth and Stripe billing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${spectral.variable} ${plexMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <ClerkProvider>
          {/* Global top navigation available on all pages */}
          <header className="w-full border-b border-[#312a22]/10 bg-transparent">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 p-4">
              <div className="flex items-center gap-3">
                {/* Mobile: hamburger menu */}
                <HamburgerMenu />
                {/* Site title / logo */}
                <Link href="/" className="text-sm font-semibold text-[#1d1a17]">
                  Product as a Service
                </Link>
              </div>

              {/* Desktop navigation */}
              <nav className="hidden md:flex items-center gap-3">
                <Link
                  href="/roadmap"
                  className="rounded-full bg-[#245c4f] px-4 py-2 text-sm font-semibold text-[#fff8f2] transition hover:bg-[#1f4f44]"
                >
                  Roadmap
                </Link>
                <Link
                  href="/projects"
                  className="rounded-full border border-[#312a22]/15 bg-white/75 px-4 py-2 text-sm text-[#1d1a17] transition hover:bg-white"
                >
                  My projects
                </Link>
              </nav>

              {/* Account area (already a fixed element in AccountArea) */}
              <AccountArea />
            </div>
          </header>

          {children}
        </ClerkProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
