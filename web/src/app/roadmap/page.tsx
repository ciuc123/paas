import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentAccess } from "@/lib/access";
import { loadRoadmapLanes, statusLabels } from "@/lib/roadmap";
import { grantAccessFromCheckoutSession } from "@/lib/stripe-access";

export const dynamic = "force-dynamic";

type RoadmapPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

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

  const lanes = await loadRoadmapLanes();

  return (
    <main className="min-h-screen overflow-x-auto overflow-y-hidden bg-[radial-gradient(circle_at_top_left,_rgba(217,108,63,0.18),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(36,92,79,0.18),_transparent_30%),linear-gradient(180deg,#fcf7ef_0%,#f4efe7_58%,#efe7db_100%)] p-6">
      <div className="flex min-h-[calc(100vh-3rem)] w-max gap-5">
        <section className="w-[min(90vw,580px)] rounded-3xl border border-[#312a22]/15 bg-[#fffaf2]/90 p-8 shadow-[0_24px_60px_rgba(68,49,31,0.14)]">
          <p className="text-xs uppercase tracking-[0.18em] text-[#245c4f]">
            paid roadmap access
          </p>
          <h1 className="mt-3 text-5xl leading-[0.95] text-[#1d1a17]">
            Product swimlanes for members.
          </h1>
          <p className="mt-4 text-[#5f584f]">
            Live roadmap statuses are read from instruction files on every load.
            Your subscription unlocks this private view and future paid modules.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm text-[#1d1a17]">
            <span className="rounded-full border border-[#312a22]/15 bg-white/65 px-4 py-2">
              Source: .github/instructions
            </span>
            <span className="rounded-full border border-[#312a22]/15 bg-white/65 px-4 py-2">
              Status: {access.stripeStatus ?? "active"}
            </span>
          </div>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex rounded-full border border-[#312a22]/15 bg-white/70 px-5 py-2.5 text-sm text-[#1d1a17] transition hover:bg-white"
            >
              Back to home
            </Link>
          </div>
        </section>

        {lanes.map((lane) => (
          <section
            key={lane.id}
            className="w-[min(90vw,460px)] rounded-3xl border border-[#312a22]/15 bg-[#fffaf2]/88 p-6 shadow-[0_24px_60px_rgba(68,49,31,0.14)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#245c4f]">
                  lane
                </p>
                <h2 className="mt-2 text-2xl text-[#1d1a17]">{lane.label}</h2>
              </div>
              <span className="rounded-full border border-[#312a22]/15 bg-white/65 px-3 py-1.5 text-xs uppercase tracking-[0.08em] text-[#1d1a17]">
                {statusLabels[lane.aggregateStatus]}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {lane.tasks.map((task) => (
                <article
                  key={`${lane.id}-${task.task}`}
                  className="rounded-2xl border border-[#312a22]/15 bg-white/60 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-semibold text-[#1d1a17]">
                      {task.task}
                    </h3>
                    <span className="rounded-full border border-[#312a22]/15 px-2.5 py-1 text-[11px] uppercase tracking-[0.08em] text-[#5f584f]">
                      {statusLabels[task.status]}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[#5f584f]">{task.notes}</p>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}