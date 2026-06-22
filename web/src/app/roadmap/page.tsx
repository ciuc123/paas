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

  // Try a few candidate repository roots — some dev environments run the server
  // with different current working directories. Read local instruction files
  // when available so `loadRoadmapLanes` can parse task tables without remote
  // fetches. If none are found, we silently fall back to remote raw.github URLs.
  const candidates = [
    process.cwd(),
    path.resolve(process.cwd(), ".."),
    path.resolve(process.cwd(), "..", ".."),
  ];

  // Allow an explicit override via environment variable for non-standard setups
  const envRoot = process.env.ROADMAP_REPO_ROOT || process.env.PAAS_REPO_ROOT;
  if (envRoot) {
    candidates.unshift(envRoot);
  }

  for (const entry of lanesManifest) {
    for (const repoRoot of candidates) {
      try {
        const fullPath = path.join(repoRoot, entry.path);
        const content = fs.readFileSync(fullPath, "utf-8");
        result[entry.path] = content;
        break; // found it for this entry, move to next entry
      } catch {
        // try next candidate
      }
    }
  }

  if (Object.keys(result).length === 0) {
    // Helpful server-side log to aid debugging when local instruction files
    // aren't being discovered in development.
    // eslint-disable-next-line no-console
    console.warn(
      "readLocalInstructions: no local instruction files found; falling back to remote fetches"
    );
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
          {/* Navigation is available in the global header */}
        </section>

        <LaneAccordion lanes={lanes} />
      </div>
    </main>
  );
}