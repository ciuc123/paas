"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { statusLabels, type Task } from "@/lib/roadmap";
import {
  type Project,
  type ProjectLane,
  type ProjectTask,
  upsertProject,
} from "@/lib/projects";

const statusColors: Record<Task["status"], string> = {
  done: "border-emerald-200 bg-emerald-50 text-emerald-800",
  in_progress: "border-amber-200 bg-amber-50 text-amber-800",
  blocked: "border-red-200 bg-red-50 text-red-800",
  not_started: "border-[#312a22]/15 bg-white/60 text-[#5f584f]",
};

type GenerateEvent =
  | { laneId: string; taskIndex: number; status: Task["status"]; aiOutput: string | null }
  | { done: true };

function EditableTaskText({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onChange(trimmed);
    else setDraft(value);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setEditing(false);
            setDraft(value);
          }
        }}
        className="w-full rounded border border-[#245c4f]/40 bg-white px-2 py-0.5 text-sm font-semibold text-[#1d1a17] outline-none focus:ring-2 focus:ring-[#245c4f]/30"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
      title="Click to edit"
      className="group flex items-center gap-1.5 text-left text-sm font-semibold text-[#1d1a17]"
    >
      <span>{value}</span>
      <svg
        className="h-3 w-3 shrink-0 text-[#5f584f] opacity-0 transition-opacity group-hover:opacity-100"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15.232 5.232l3.536 3.536M9 11l6.586-6.586a2 2 0 112.828 2.828L11.828 13.828a2 2 0 01-1.414.586H9v-1.414a2 2 0 01.586-1.414z"
        />
      </svg>
    </button>
  );
}

function TaskCard({
  task,
  onTaskChange,
}: {
  task: ProjectTask;
  onTaskChange: (updated: ProjectTask) => void;
}) {
  return (
    <article className="rounded-xl border border-[#312a22]/15 bg-white/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <EditableTaskText
          value={task.task}
          onChange={(v) => onTaskChange({ ...task, task: v })}
        />
        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.08em] ${statusColors[task.status]}`}
        >
          {statusLabels[task.status]}
        </span>
      </div>
      <p className="mt-1.5 text-sm text-[#5f584f]">{task.notes}</p>
      {task.aiOutput && (
        <div className="mt-2.5 rounded-lg border border-[#245c4f]/20 bg-[#245c4f]/5 p-3">
          <p className="text-xs font-medium uppercase tracking-[0.1em] text-[#245c4f]">
            AI output
          </p>
          <p className="mt-1 text-sm text-[#1d1a17]">{task.aiOutput}</p>
        </div>
      )}
    </article>
  );
}

// Desktop: horizontal side-by-side swimlanes
function SwimlanesDesktop({
  lanes,
  onTaskChange,
}: {
  lanes: ProjectLane[];
  onTaskChange: (laneId: string, taskIndex: number, updated: ProjectTask) => void;
}) {
  return (
    <div
      role="region"
      aria-label="Project swimlanes"
      tabIndex={0}
      className="hidden md:flex gap-4 overflow-x-auto pb-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#245c4f]/40 rounded-xl"
    >
      {lanes.map((lane) => (
        <div
          key={lane.id}
          className="min-w-[280px] max-w-[320px] flex-shrink-0 rounded-2xl border border-[#312a22]/15 bg-[#fffaf2]/88 shadow-[0_4px_16px_rgba(68,49,31,0.08)]"
        >
          <div className="border-b border-[#312a22]/10 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-[#245c4f]">
              lane
            </p>
            <h2 className="mt-0.5 text-base font-semibold text-[#1d1a17]">
              {lane.label}
            </h2>
            <p className="mt-0.5 text-xs text-[#5f584f]">
              {lane.tasks.length} task{lane.tasks.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="space-y-2.5 p-3">
            {lane.tasks.length === 0 ? (
              <p className="text-center text-xs text-[#5f584f] py-4">
                No tasks
              </p>
            ) : (
              lane.tasks.map((task, i) => (
                <TaskCard
                  key={`${lane.id}-${i}`}
                  task={task}
                  onTaskChange={(updated) => onTaskChange(lane.id, i, updated)}
                />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Mobile: accordion (same pattern as existing lane-accordion)
function SwimlanesAccordion({
  lanes,
  onTaskChange,
}: {
  lanes: ProjectLane[];
  onTaskChange: (laneId: string, taskIndex: number, updated: ProjectTask) => void;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="block md:hidden space-y-2">
      {lanes.map((lane, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={lane.id}
            className="overflow-hidden rounded-2xl border border-[#312a22]/15 bg-[#fffaf2]/88 shadow-[0_4px_16px_rgba(68,49,31,0.08)]"
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex w-full items-center justify-between gap-4 p-5 text-left"
              aria-expanded={isOpen}
            >
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.18em] text-[#245c4f]">
                  lane {index + 1}
                </p>
                <h2 className="mt-0.5 truncate text-lg text-[#1d1a17]">
                  {lane.label}
                </h2>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="rounded-full border border-[#312a22]/15 bg-white/65 px-3 py-1 text-xs text-[#1d1a17]">
                  {lane.tasks.length}
                </span>
                <svg
                  className={`h-4 w-4 shrink-0 text-[#5f584f] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </button>
            {isOpen && (
              <div className="space-y-2.5 border-t border-[#312a22]/10 px-5 pb-5 pt-4">
                {lane.tasks.map((task, i) => (
                  <TaskCard
                    key={`${lane.id}-${i}`}
                    task={task}
                    onTaskChange={(updated) => onTaskChange(lane.id, i, updated)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

type ProjectBoardProps = {
  project: Project;
};

export function ProjectBoard({ project: initialProject }: ProjectBoardProps) {
  const [project, setProject] = useState<Project>(initialProject);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const persist = useCallback((updated: Project) => {
    setProject(updated);
    upsertProject({ ...updated, updatedAt: new Date().toISOString() });
  }, []);

  const handleTaskChange = useCallback(
    (laneId: string, taskIndex: number, updated: ProjectTask) => {
      setProject((prev) => {
        const lanes = prev.lanes.map((lane) => {
          if (lane.id !== laneId) return lane;
          const tasks = [...lane.tasks];
          tasks[taskIndex] = updated;
          return { ...lane, tasks };
        });
        const next = { ...prev, lanes, updatedAt: new Date().toISOString() };
        upsertProject(next);
        return next;
      });
    },
    [],
  );

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setGenerateError(null);

    // Reset all tasks to not_started before generating
    const reset: Project = {
      ...project,
      generateStatus: "generating",
      lanes: project.lanes.map((lane) => ({
        ...lane,
        tasks: lane.tasks.map((t) => ({
          ...t,
          status: "not_started" as Task["status"],
          aiOutput: undefined,
        })),
      })),
    };
    persist(reset);

    try {
      const response = await fetch("/api/projects/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lanes: reset.lanes }),
      });

      if (!response.ok) {
        throw new Error(`Server error ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (!json) continue;

          let event: GenerateEvent;
          try {
            event = JSON.parse(json) as GenerateEvent;
          } catch {
            continue;
          }

          if ("done" in event && event.done) break;

          const ev = event as Extract<GenerateEvent, { laneId: string }>;
          setProject((prev) => {
            const lanes = prev.lanes.map((lane) => {
              if (lane.id !== ev.laneId) return lane;
              const tasks = [...lane.tasks];
              const current = tasks[ev.taskIndex];
              if (!current) return lane;
              tasks[ev.taskIndex] = {
                ...current,
                status: ev.status,
                ...(ev.aiOutput !== null ? { aiOutput: ev.aiOutput } : {}),
              };
              return { ...lane, tasks };
            });
            const next = {
              ...prev,
              lanes,
              updatedAt: new Date().toISOString(),
            };
            // Persist after each task update
            upsertProject(next);
            return next;
          });
        }
      }

      setProject((prev) => {
        const next = { ...prev, generateStatus: "done" as const, updatedAt: new Date().toISOString() };
        upsertProject(next);
        return next;
      });
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "Generation failed");
      setProject((prev) => {
        const next = { ...prev, generateStatus: "idle" as const };
        upsertProject(next);
        return next;
      });
    } finally {
      setIsGenerating(false);
    }
  }, [project, persist]);

  const totalTasks = project.lanes.reduce((s, l) => s + l.tasks.length, 0);
  const doneTasks = project.lanes.reduce(
    (s, l) => s + l.tasks.filter((t) => t.status === "done").length,
    0,
  );
  const inProgressTasks = project.lanes.reduce(
    (s, l) => s + l.tasks.filter((t) => t.status === "in_progress").length,
    0,
  );

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#312a22]/15 bg-[#fffaf2]/90 px-5 py-4 shadow-[0_4px_16px_rgba(68,49,31,0.08)]">
        <div className="flex flex-wrap gap-2 text-xs text-[#5f584f]">
          <span className="rounded-full border border-[#312a22]/15 bg-white/65 px-3 py-1">
            {project.lanes.length} lanes
          </span>
          <span className="rounded-full border border-[#312a22]/15 bg-white/65 px-3 py-1">
            {totalTasks} tasks
          </span>
          {doneTasks > 0 && (
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-800">
              {doneTasks} done
            </span>
          )}
          {inProgressTasks > 0 && (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-800">
              {inProgressTasks} in progress
            </span>
          )}
          {project.generateStatus === "done" && (
            <span className="rounded-full border border-[#245c4f]/20 bg-[#245c4f]/10 px-3 py-1 text-[#245c4f]">
              Generated
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="flex items-center gap-2 rounded-full bg-[#245c4f] px-5 py-2.5 text-sm font-semibold text-[#fff8f2] transition hover:bg-[#1f4f44] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isGenerating ? (
            <>
              <svg
                className="h-4 w-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Generating…
            </>
          ) : (
            <>
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
              Generate
            </>
          )}
        </button>
      </div>

      {generateError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {generateError}
        </div>
      )}

      {/* Desktop side-by-side swimlanes */}
      <SwimlanesDesktop lanes={project.lanes} onTaskChange={handleTaskChange} />

      {/* Mobile accordion */}
      <SwimlanesAccordion lanes={project.lanes} onTaskChange={handleTaskChange} />
    </div>
  );
}
