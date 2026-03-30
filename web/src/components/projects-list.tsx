"use client";

import { useSyncExternalStore, useState } from "react";
import Link from "next/link";

import {
  type Project,
  subscribeProjects,
  loadProjects,
  deleteProject,
  generateProjectFromPrompt,
  upsertProject,
} from "@/lib/projects";

export function ProjectsList() {
  const projects = useSyncExternalStore(
    subscribeProjects,
    loadProjects,
    (): Project[] => [],
  );
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [nameError, setNameError] = useState("");
  const [preview, setPreview] = useState<Project | null>(null);

  const handleGenerate = () => {
    const name = newName.trim();
    if (!name) {
      setNameError("Please enter a project name.");
      return;
    }
    setNameError("");
    setPreview(generateProjectFromPrompt(name, newDescription.trim()));
  };

  const handleCreate = () => {
    if (!preview) return;
    upsertProject(preview);
    setNewName("");
    setNewDescription("");
    setPreview(null);
    setCreating(false);
  };

  const handleCancelCreate = () => {
    setCreating(false);
    setNewName("");
    setNewDescription("");
    setNameError("");
    setPreview(null);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") handleCancelCreate();
  };

  const handleDescriptionKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (e.key === "Escape") handleCancelCreate();
  };

  const handleDelete = (id: string) => {
    deleteProject(id);
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
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          New project
        </button>
      ) : (
        <div className="rounded-2xl border border-[#312a22]/15 bg-[#fffaf2]/90 p-5 shadow-[0_4px_16px_rgba(68,49,31,0.08)]">
          <p className="text-sm font-semibold text-[#1d1a17]">
            Describe your project
          </p>
          <p className="mt-1 text-xs text-[#5f584f]">
            Give it a name and describe what you&apos;re building. We&apos;ll
            generate a custom roadmap of lanes and tasks tailored to your idea.
          </p>

          <div className="mt-3 space-y-3">
            <div>
              <input
                type="text"
                autoFocus
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  setNameError("");
                  setPreview(null);
                }}
                onKeyDown={handleNameKeyDown}
                placeholder="Project name — e.g. Fitness coaching portal"
                className="w-full rounded-xl border border-[#312a22]/20 bg-white px-4 py-2.5 text-sm text-[#1d1a17] outline-none placeholder:text-[#5f584f]/60 focus:border-[#245c4f]/50 focus:ring-2 focus:ring-[#245c4f]/20"
              />
              {nameError && (
                <p className="mt-1 text-xs text-red-600">{nameError}</p>
              )}
            </div>

            <textarea
              rows={3}
              value={newDescription}
              onChange={(e) => {
                setNewDescription(e.target.value);
                setPreview(null);
              }}
              onKeyDown={handleDescriptionKeyDown}
              placeholder="Describe your project… e.g. A platform for life coaches to deliver AI-powered programs to their clients, including onboarding, PDF resources, and a Q&A chatbot."
              className="w-full resize-none rounded-xl border border-[#312a22]/20 bg-white px-4 py-2.5 text-sm text-[#1d1a17] outline-none placeholder:text-[#5f584f]/60 focus:border-[#245c4f]/50 focus:ring-2 focus:ring-[#245c4f]/20"
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {!preview ? (
              <button
                type="button"
                onClick={handleGenerate}
                className="flex items-center gap-1.5 rounded-xl bg-[#245c4f] px-4 py-2.5 text-sm font-semibold text-[#fff8f2] transition hover:bg-[#1f4f44]"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Generate roadmap
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCreate}
                className="rounded-xl bg-[#245c4f] px-4 py-2.5 text-sm font-semibold text-[#fff8f2] transition hover:bg-[#1f4f44]"
              >
                ✓ Start project
              </button>
            )}
            <button
              type="button"
              onClick={handleCancelCreate}
              className="rounded-xl border border-[#312a22]/15 bg-white/70 px-4 py-2.5 text-sm text-[#1d1a17] transition hover:bg-white"
            >
              Cancel
            </button>
          </div>

          {/* Preview of generated roadmap */}
          {preview && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#245c4f]">
                Generated roadmap preview — {preview.lanes.length} lanes,{" "}
                {preview.lanes.reduce((s, l) => s + l.tasks.length, 0)} tasks
              </p>
              {preview.lanes.map((lane) => (
                <details
                  key={lane.id}
                  className="rounded-xl border border-[#312a22]/10 bg-white/60"
                >
                  <summary className="cursor-pointer select-none px-4 py-2.5 text-sm font-semibold text-[#1d1a17] marker:content-none">
                    <span className="flex items-center justify-between gap-2">
                      <span>{lane.label}</span>
                      <span className="text-xs font-normal text-[#5f584f]">
                        {lane.tasks.length} tasks
                      </span>
                    </span>
                  </summary>
                  <ul className="space-y-1.5 border-t border-[#312a22]/10 px-4 py-2">
                    {lane.tasks.map((task, i) => (
                      <li key={i} className="text-sm text-[#1d1a17]">
                        <span className="mr-2 text-[#5f584f]">·</span>
                        {task.task}
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Projects list */}
      {projects.length === 0 && !creating && (
        <div className="rounded-2xl border border-[#312a22]/10 bg-white/40 py-12 text-center">
          <p className="text-sm text-[#5f584f]">
            No projects yet. Create one to get started.
          </p>
        </div>
      )}

      {projects.map((project) => {
        const totalTasks = project.lanes.reduce(
          (s, l) => s + l.tasks.length,
          0,
        );
        const doneTasks = project.lanes.reduce(
          (s, l) => s + l.tasks.filter((t) => t.status === "done").length,
          0,
        );

        return (
          <div
            key={project.id}
            className="flex items-start gap-4 rounded-2xl border border-[#312a22]/15 bg-[#fffaf2]/90 p-5 shadow-[0_4px_16px_rgba(68,49,31,0.08)]"
          >
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-base font-semibold text-[#1d1a17]">
                {project.name}
              </h2>
              {project.description && (
                <p className="mt-0.5 line-clamp-2 text-xs text-[#5f584f]">
                  {project.description}
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
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
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
