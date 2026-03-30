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
      <div className="rounded-2xl border border-[#312a22]/15 bg-[#fffaf2]/90 p-8 text-center">
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

  return <ProjectBoard project={project} />;
}
