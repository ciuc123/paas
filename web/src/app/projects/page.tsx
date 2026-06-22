import { ProjectsList } from "@/components/projects-list";
import { getCurrentAccess } from "@/lib/access";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  // Access object still available for UI, but auth is optional so we don't redirect.
  const access = await getCurrentAccess();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(217,108,63,0.18),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(36,92,79,0.18),_transparent_30%),linear-gradient(180deg,#fcf7ef_0%,#f4efe7_58%,#efe7db_100%)]">
      <div className="mx-auto max-w-2xl space-y-6 p-6">
        <section className="rounded-3xl border border-[#312a22]/15 bg-[#fffaf2]/90 p-8 shadow-[0_24px_60px_rgba(68,49,31,0.14)]">
          <p className="text-xs uppercase tracking-[0.18em] text-[#245c4f]">
            your workspace
          </p>
          <h1 className="mt-3 text-5xl leading-[0.95] text-[#1d1a17]">
            Projects
          </h1>
          <p className="mt-4 text-[#5f584f]">
            Describe your project idea and we&apos;ll generate a custom roadmap
            of swimlanes and tasks as your starting point. Edit tasks inline,
            then hit Generate to run AI across your entire roadmap.
          </p>
          {/* Navigation is available in the global header */}
        </section>

        <ProjectsList />
      </div>
    </main>
  );
}
