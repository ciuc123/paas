"use client";

import Link from "next/link";
import { useEffect } from "react";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ProjectError({ error, reset }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(217,108,63,0.18),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(36,92,79,0.18),_transparent_30%),linear-gradient(180deg,#fcf7ef_0%,#f4efe7_58%,#efe7db_100%)] p-6">
      <div className="mx-auto max-w-2xl rounded-3xl border border-[#312a22]/15 bg-[#fffaf2]/90 p-8 shadow-[0_24px_60px_rgba(68,49,31,0.14)]">
        <p className="text-xs uppercase tracking-[0.18em] text-red-600">
          Something went wrong
        </p>
        <h1 className="mt-3 text-4xl leading-[0.95] text-[#1d1a17]">
          Project couldn&apos;t load
        </h1>
        <p className="mt-4 text-[#5f584f]">
          An error occurred while loading this project. Your data is safe — try
          refreshing or go back to your projects list.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex rounded-full bg-[#245c4f] px-5 py-2.5 text-sm font-semibold text-[#fff8f2] transition hover:bg-[#1f4f44]"
          >
            Try again
          </button>
          <Link
            href="/projects"
            className="inline-flex rounded-full border border-[#312a22]/15 bg-white/70 px-5 py-2.5 text-sm text-[#1d1a17] transition hover:bg-white"
          >
            All projects
          </Link>
        </div>
      </div>
    </main>
  );
}
