import Link from "next/link";
import { redirect } from "next/navigation";
import { marked } from "marked";

import { getCurrentAccess } from "@/lib/access";
import { getContentUrl } from "@/lib/roadmap";

export const dynamic = "force-dynamic";

type ContentPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ContentPage({ searchParams }: ContentPageProps) {
  const access = await getCurrentAccess();

  if (!access.hasPaidAccess) {
    redirect("/upgrade");
  }

  const params = await searchParams;
  const rawPath = params.path;
  const contentPath = typeof rawPath === "string" ? rawPath : null;

  if (!contentPath || !contentPath.endsWith(".md")) {
    redirect("/roadmap");
  }

  const url = getContentUrl(contentPath);
  let html: string;
  let title = contentPath.split("/").pop()?.replace(/\.md$/, "") ?? "Output";

  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to fetch content: ${response.status}`);
    }
    const markdown = await response.text();
    const firstHeading = markdown.match(/^#\s+(.+)$/m);
    if (firstHeading) {
      title = firstHeading[1];
    }
    html = await marked(markdown, { async: true });
  } catch {
    html = "<p>Could not load content. Please try again later.</p>";
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(217,108,63,0.18),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(36,92,79,0.18),_transparent_30%),linear-gradient(180deg,#fcf7ef_0%,#f4efe7_58%,#efe7db_100%)]">
      <div className="mx-auto max-w-2xl space-y-6 p-6">
        <section className="rounded-3xl border border-[#312a22]/15 bg-[#fffaf2]/90 p-8 shadow-[0_24px_60px_rgba(68,49,31,0.14)]">
          <p className="text-xs uppercase tracking-[0.18em] text-[#245c4f]">
            generated output
          </p>
          <h1 className="mt-3 text-4xl leading-tight text-[#1d1a17]">
            {title}
          </h1>
          <div className="mt-4 flex flex-wrap gap-3 text-sm text-[#1d1a17]">
            <span className="rounded-full border border-[#312a22]/15 bg-white/65 px-4 py-2">
              {contentPath}
            </span>
          </div>
          <div className="mt-6 flex gap-3">
            {/* Navigation is available in the global header */}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-full border border-[#312a22]/15 bg-white/70 px-5 py-2.5 text-sm text-[#1d1a17] transition hover:bg-white"
            >
              View raw
            </a>
          </div>
        </section>

        <article
          className="prose prose-stone max-w-none rounded-3xl border border-[#312a22]/15 bg-[#fffaf2]/90 p-8 shadow-[0_24px_60px_rgba(68,49,31,0.14)] [&_a]:text-[#245c4f] [&_code]:rounded [&_code]:bg-[#312a22]/8 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_h1]:text-[#1d1a17] [&_h2]:text-[#1d1a17] [&_h3]:text-[#1d1a17] [&_hr]:border-[#312a22]/15 [&_li]:text-[#5f584f] [&_p]:text-[#5f584f] [&_strong]:text-[#1d1a17]"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </main>
  );
}
