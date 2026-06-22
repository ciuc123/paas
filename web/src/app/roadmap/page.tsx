import fs from "fs";
import path from "path";

import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentAccess } from "@/lib/access";
import { lanesManifest, loadRoadmapLanes } from "@/lib/roadmap";
import { grantAccessFromCheckoutSession } from "@/lib/stripe-access";
import { LaneAccordion } from "@/components/lane-accordion";

export const dynamic = "force-dynamic";

type RoadmapPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readLocalInstructions(): Record<string, string> {
  const result: Record<string, string> = {};
  const repoRoot = path.resolve(process.cwd(), "..");
  for (const entry of lanesManifest) {
    try {
      const fullPath = path.join(repoRoot, entry.path);
      result[entry.path] = fs.readFileSync(fullPath, "utf-8");
    } catch {
      // file not found — will fall back to remote fetch
    }
  }
  return result;
}

export default async function RoadmapPage({ searchParams }: RoadmapPageProps) {
  let access = await getCurrentAccess();

  if (!access.hasPaidAccess && access.userId) {
    const params = await searchParams;
    const checkout = params.checkout;
    const sessionId = params.session_id;
    const isCheckoutSuccess = checkout === "success";
    const singleSessionId =
      typeof sessionId === "string" ? sessionId : null;

    if (isCheckoutSuccess && singleSessionId) {
      const granted = await grantAccessFromCheckoutSession({
        clerkUserId: access.userId,
        sessionId: singleSessionId,
      });

      if (granted) {
        access = await getCurrentAccess();
      }
    }
  }

  if (!access.hasPaidAccess) {
    redirect("/upgrade");
  }

  const lanes = await loadRoadmapLanes(readLocalInstructions());

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(217,108,63,0.18),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(36,92,79,0.18),_transparent_30%),linear-gradient(180deg,#fcf7ef_0%,#f4efe7_58%,#efe7db_100%)]">
      <div className="mx-auto max-w-2xl space-y-6 p-6">
        <section className="rounded-3xl border border-[#312a22]/15 bg-[#fffaf2]/90 p-8 shadow-[0_24px_60px_rgba(68,49,31,0.14)]">
          <p className="text-xs uppercase tracking-[0.18em] text-[#245c4f]">
            Roadmap
          </p>
          <h1 className="mt-3 text-5xl leading-[0.95] text-[#1d1a17]">
            Build your product swimlanes
          </h1>
          <p className="mt-4 text-[#5f584f]">
            Live roadmap statuses are read from instruction files on every load.
            Your subscription unlocks this private view and future paid modules.
            The highest-priority active lane is expanded by default.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm text-[#1d1a17]">
            <span className="rounded-full border border-[#312a22]/15 bg-white/65 px-4 py-2">
              Source: .github/instructions
            </span>
            <span className="rounded-full border border-[#312a22]/15 bg-white/65 px-4 py-2">
              Status: {access.stripeStatus ?? "active"}
            </span>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex rounded-full border border-[#312a22]/15 bg-white/70 px-5 py-2.5 text-sm text-[#1d1a17] transition hover:bg-white"
            >
              Back to home
            </Link>
            <Link
              href="/projects"
              className="inline-flex rounded-full bg-[#245c4f] px-5 py-2.5 text-sm font-semibold text-[#fff8f2] transition hover:bg-[#1f4f44]"
            >
              My projects
            </Link>
          </div>
        </section>

        <LaneAccordion lanes={lanes} />
      </div>
    </main>
  );
}