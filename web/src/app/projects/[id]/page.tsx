import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentAccess } from "@/lib/access";
import { ProjectLoader } from "@/components/project-loader";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ProjectPage({ params }: Props) {
  const access = await getCurrentAccess();

  if (!access.hasPaidAccess) {
    redirect("/upgrade");
  }

  const { id } = await params;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(217,108,63,0.18),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(36,92,79,0.18),_transparent_30%),linear-gradient(180deg,#fcf7ef_0%,#f4efe7_58%,#efe7db_100%)]">
      <div className="space-y-6 p-6">
        <section className="mx-auto max-w-2xl rounded-3xl border border-[#312a22]/15 bg-[#fffaf2]/90 p-8 shadow-[0_24px_60px_rgba(68,49,31,0.14)]">
          <p className="text-xs uppercase tracking-[0.18em] text-[#245c4f]">
            project roadmap
          </p>
          <h1 className="mt-3 text-4xl leading-[0.95] text-[#1d1a17]">
            Your project
          </h1>
          <p className="mt-3 text-[#5f584f]">
            Edit task names inline by clicking them. Use Generate to run AI
            across all lanes and publish after each task.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/projects"
              className="inline-flex rounded-full border border-[#312a22]/15 bg-white/70 px-5 py-2.5 text-sm text-[#1d1a17] transition hover:bg-white"
            >
              ← All projects
            </Link>
          </div>
        </section>

        <div className="mx-auto max-w-full px-0 md:px-6">
          <ProjectLoader projectId={id} />
        </div>
      </div>
    </main>
  );
}
