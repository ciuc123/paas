import Link from "next/link";

import { HamburgerMenu } from "@/components/hamburger-menu";

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(217,108,63,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(36,92,79,0.18),_transparent_28%),linear-gradient(180deg,#fcf7ef_0%,#f4efe7_52%,#efe7db_100%)] p-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col justify-between rounded-3xl border border-[#312a22]/15 bg-[#fffaf2]/90 p-10 shadow-[0_24px_60px_rgba(68,49,31,0.14)]">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs uppercase tracking-[0.18em] text-[#245c4f]">
            PaaS paid product
          </p>
          <div className="flex items-center gap-2">
            <HamburgerMenu />
          </div>
        </header>

        <section className="max-w-3xl">
          <h1 className="text-6xl leading-[0.92] text-[#1d1a17]">
            Turn this roadmap into a paid access product.
          </h1>
          <p className="mt-6 text-lg text-[#5f584f]">
            Migration complete: this app now runs with Clerk auth, Stripe
            subscriptions, a protected roadmap route, and an upgrade paywall.
          </p>
        </section>

        {/* Navigation is provided in the global header */}
      </div>
    </main>
  );
}
