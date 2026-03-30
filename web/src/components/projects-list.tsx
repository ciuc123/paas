"use client";

import { useSyncExternalStore, useState } from "react";
import Link from "next/link";

import {
  type Project,
  subscribeProjects,
  loadProjects,
  deleteProject,
  seedProjectFromLanes,
  upsertProject,
} from "@/lib/projects";
import type { Lane } from "@/lib/roadmap";

type Props = {
  lanes: Lane[];
};

export function ProjectsList({ lanes }: Props) {
  const projects = useSyncExternalStore(
    subscribeProjects,
    loadProjects,
    (): Project[] => [],
  );
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [nameError, setNameError] = useState("");

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) {
      setNameError("Please enter a project name.");
      return;
    }
    const project = seedProjectFromLanes(name, lanes);
    upsertProject(project);
    setNewName("");
    setNameError("");
    setCreating(false);
  };

  const handleDelete = (id: string) => {
    deleteProject(id);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewName(e.target.value);
    setNameError("");
  };

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleCreate();
    } else if (e.key === "Escape") {
      setCreating(false);
      setNewName("");
      setNameError("");
    }
  };

  const handleCancelCreate = () => {
    setCreating(false);
    setNewName("");
    setNameError("");
  };

  return (
    <div className="space-y-4">
      {/* Create button / form */}
      {!creating ? (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#312a22]/20 bg-white/40 py-5 text-sm font-medium text-[#5f584f] transition hover:border-[#245c4f]/40 hover:text-[#245c4f]"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New project
        </button>
      ) : (
        <div className="rounded-2xl border border-[#312a22]/15 bg-[#fffaf2]/90 p-5 shadow-[0_4px_16px_rgba(68,49,31,0.08)]">
          <p className="text-sm font-semibold text-[#1d1a17]">Name your project</p>
          <p className="mt-1 text-xs text-[#5f584f]">
            The roadmap lanes and tasks will be seeded as your starting point.
          </p>
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              autoFocus
              value={newName}
              onChange={handleNameChange}
              onKeyDown={handleNameKeyDown}
              placeholder="e.g. Life coaching platform, Q1 product…"
              className="flex-1 rounded-xl border border-[#312a22]/20 bg-white px-4 py-2.5 text-sm text-[#1d1a17] outline-none placeholder:text-[#5f584f]/60 focus:border-[#245c4f]/50 focus:ring-2 focus:ring-[#245c4f]/20"
            />
            <button
              type="button"
              onClick={handleCreate}
              className="rounded-xl bg-[#245c4f] px-4 py-2.5 text-sm font-semibold text-[#fff8f2] transition hover:bg-[#1f4f44]"
            >
              Create
            </button>
            <button
              type="button"
              onClick={handleCancelCreate}
              className="rounded-xl border border-[#312a22]/15 bg-white/70 px-4 py-2.5 text-sm text-[#1d1a17] transition hover:bg-white"
            >
              Cancel
            </button>
          </div>
          {nameError && <p className="mt-2 text-xs text-red-600">{nameError}</p>}
        </div>
      )}

      {/* Projects list */}
      {projects.length === 0 && !creating && (
        <div className="rounded-2xl border border-[#312a22]/10 bg-white/40 py-12 text-center">
          <p className="text-sm text-[#5f584f]">No projects yet. Create one to get started.</p>
        </div>
      )}

      {projects.map((project) => {
        const totalTasks = project.lanes.reduce((s, l) => s + l.tasks.length, 0);
        const doneTasks = project.lanes.reduce(
          (s, l) => s + l.tasks.filter((t) => t.status === "done").length,
          0,
        );

        return (
          <div
            key={project.id}
            className="flex items-center gap-4 rounded-2xl border border-[#312a22]/15 bg-[#fffaf2]/90 p-5 shadow-[0_4px_16px_rgba(68,49,31,0.08)]"
          >
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-base font-semibold text-[#1d1a17]">{project.name}</h2>
              <div className="mt-1 flex flex-wrap gap-2">
                <span className="rounded-full border border-[#312a22]/15 bg-white/65 px-2.5 py-0.5 text-xs text-[#5f584f]">
                  {project.lanes.length} lanes
                </span>
                <span className="rounded-full border border-[#312a22]/15 bg-white/65 px-2.5 py-0.5 text-xs text-[#5f584f]">
                  {totalTasks} tasks
                </span>
                {doneTasks > 0 && (
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs text-emerald-800">
                    {doneTasks} done
                  </span>
                )}
                {project.generateStatus === "done" && (
                  <span className="rounded-full border border-[#245c4f]/20 bg-[#245c4f]/10 px-2.5 py-0.5 text-xs text-[#245c4f]">
                    Generated
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-[#5f584f]">
                Updated {new Date(project.updatedAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href={`/projects/${project.id}`}
                className="rounded-xl bg-[#245c4f] px-4 py-2 text-sm font-semibold text-[#fff8f2] transition hover:bg-[#1f4f44]"
              >
                Open
              </Link>
              <button
                type="button"
                onClick={() => handleDelete(project.id)}
                aria-label={`Delete ${project.name}`}
                className="rounded-xl border border-[#312a22]/15 bg-white/70 p-2 text-[#5f584f] transition hover:bg-red-50 hover:text-red-700"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
