"use client";

import { useCallback, useSyncExternalStore } from "react";
import Link from "next/link";

import { subscribeProjects, loadProjects } from "@/lib/projects";
import { ProjectBoard } from "@/components/project-board";

type Props = {
  projectId: string;
};

export function ProjectLoader({ projectId }: Props) {
  const getSnapshot = useCallback(
    () => loadProjects().find((p) => p.id === projectId) ?? null,
    [projectId],
  );

  const project = useSyncExternalStore(
    subscribeProjects,
    getSnapshot,
    () => null,
  );

  if (project === null) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-[#312a22]/15 bg-[#fffaf2]/90 p-8 text-center">
        <p className="text-sm text-[#5f584f]">Project not found.</p>
        <Link
          href="/projects"
          className="mt-4 inline-flex rounded-full bg-[#245c4f] px-5 py-2.5 text-sm font-semibold text-[#fff8f2] transition hover:bg-[#1f4f44]"
        >
          Back to projects
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Project header — shown client-side so we can read name from localStorage */}
      <div className="mx-auto max-w-2xl rounded-3xl border border-[#312a22]/15 bg-[#fffaf2]/90 p-8 shadow-[0_24px_60px_rgba(68,49,31,0.14)]">
        <p className="text-xs uppercase tracking-[0.18em] text-[#245c4f]">
          project roadmap
        </p>
        <h1 className="mt-2 text-4xl leading-[0.95] text-[#1d1a17]">
          {project.name}
        </h1>
        {project.description && (
          <p className="mt-3 text-[#5f584f]">{project.description}</p>
        )}
        <div className="mt-5">
          <Link
            href="/projects"
            className="inline-flex rounded-full border border-[#312a22]/15 bg-white/70 px-5 py-2.5 text-sm text-[#1d1a17] transition hover:bg-white"
          >
            ← All projects
          </Link>
        </div>
      </div>

      <ProjectBoard project={project} />
    </div>
  );
}
