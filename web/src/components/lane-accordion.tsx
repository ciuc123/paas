"use client";

import { type KeyboardEvent, useEffect, useRef, useState } from "react";

import {
  type Lane,
  type Task,
  statusLabels,
  getContentUrl,
  loadEditableRoadmap,
  saveEditableRoadmap,
  serializeRoadmapLanes,
  hydrateRoadmapLanes,
} from "@/lib/roadmap";

const statusColors: Record<Task["status"], string> = {
  done: "border-emerald-200 bg-emerald-50 text-emerald-800",
  in_progress: "border-amber-200 bg-amber-50 text-amber-800",
  blocked: "border-red-200 bg-red-50 text-red-800",
  not_started: "border-[#312a22]/15 bg-white/60 text-[#5f584f]",
};

const statusOptions: Task["status"][] = [
  "not_started",
  "in_progress",
  "blocked",
  "done",
];

type TaskDraft = {
  task: string;
  notes: string;
  status: Task["status"];
  contentPath: string;
};

function getActiveLaneIndex(lanes: Lane[]): number {
  const idx = lanes.findIndex((lane) => lane.aggregateStatus !== "done");
  return idx === -1 ? 0 : idx;
}

function getRawContentUrl(contentPath: string): string {
  return getContentUrl(contentPath);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || crypto.randomUUID();
}

function getEmptyDraft(): TaskDraft {
  return {
    task: "",
    notes: "",
    status: "not_started",
    contentPath: "",
  };
}

async function persistRoadmap(lanes: Lane[]): Promise<Lane[]> {
  const response = await fetch("/api/roadmap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lanes: serializeRoadmapLanes(lanes) }),
  });

  if (!response.ok) {
    throw new Error(`Failed to save roadmap (${response.status})`);
  }

  const data = (await response.json()) as {
    lanes?: ReturnType<typeof serializeRoadmapLanes>;
  };

  const normalized = hydrateRoadmapLanes(
    data.lanes ?? serializeRoadmapLanes(lanes),
  );
  saveEditableRoadmap(normalized);
  return normalized;
}

function TaskDraftEditor({
  draft,
  onChange,
  onSubmit,
  onCancel,
}: {
  draft: TaskDraft;
  onChange: (draft: TaskDraft) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const handleTitleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onSubmit();
    }

    if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
    }
  };

  return (
    <article className="rounded-xl border border-dashed border-[#245c4f]/35 bg-white/80 p-4">
      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
        <input
          autoFocus
          value={draft.task}
          onChange={(event) =>
            onChange({ ...draft, task: event.target.value })
          }
          onKeyDown={handleTitleKeyDown}
          placeholder="Task title"
          className="w-full rounded-lg border border-[#245c4f]/25 bg-white px-3 py-2 text-sm font-semibold text-[#1d1a17] outline-none focus:border-[#245c4f]/45 focus:ring-2 focus:ring-[#245c4f]/20"
        />
        <select
          value={draft.status}
          onChange={(event) =>
            onChange({
              ...draft,
              status: event.target.value as Task["status"],
            })
          }
          className={`rounded-full border px-3 py-2 text-xs uppercase tracking-[0.08em] ${statusColors[draft.status]}`}
        >
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {statusLabels[status]}
            </option>
          ))}
        </select>
      </div>

      <textarea
        value={draft.notes}
        onChange={(event) =>
          onChange({ ...draft, notes: event.target.value })
        }
        rows={3}
        placeholder="Task notes"
        className="mt-3 w-full rounded-lg border border-[#312a22]/15 bg-white px-3 py-2 text-sm text-[#5f584f] outline-none focus:border-[#245c4f]/40 focus:ring-2 focus:ring-[#245c4f]/20"
      />

      <input
        value={draft.contentPath}
        onChange={(event) =>
          onChange({ ...draft, contentPath: event.target.value })
        }
        placeholder="Optional content path"
        className="mt-3 w-full rounded-lg border border-[#312a22]/15 bg-white px-3 py-2 text-sm text-[#1d1a17] outline-none focus:border-[#245c4f]/40 focus:ring-2 focus:ring-[#245c4f]/20"
      />

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onSubmit}
          className="rounded-full bg-[#245c4f] px-4 py-2 text-sm font-semibold text-[#fff8f2] transition hover:bg-[#1f4f44]"
        >
          Save task
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-[#312a22]/15 bg-white px-4 py-2 text-sm text-[#1d1a17] transition hover:bg-[#f8f3eb]"
        >
          Cancel
        </button>
        <span className="self-center text-xs text-[#5f584f]">
          Press Enter in the title field to add the task.
        </span>
      </div>
    </article>
  );
}

export function LaneAccordion({ lanes: initialLanes }: { lanes: Lane[] }) {
  const [lanes, setLanes] = useState<Lane[]>(initialLanes);
  const [openIndex, setOpenIndex] = useState<number | null>(
    getActiveLaneIndex(initialLanes),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [taskDrafts, setTaskDrafts] = useState<Record<string, TaskDraft | null>>(
    {},
  );
  const [showResetModal, setShowResetModal] = useState(false);
  const resetConfirmRef = useRef<HTMLButtonElement | null>(null);
  const resetCancelRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const saved = loadEditableRoadmap();
    const nextLanes = saved.length > 0 ? saved : initialLanes;
    setLanes(nextLanes);
    setOpenIndex(getActiveLaneIndex(nextLanes));
  }, [initialLanes]);

  const save = async (nextLanes: Lane[]) => {
    setLanes(nextLanes);
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const normalized = await persistRoadmap(nextLanes);
      setLanes(normalized);
      setSaveMessage("Saved");
    } catch (error) {
      setSaveMessage(
        error instanceof Error ? error.message : "Failed to save roadmap",
      );
    } finally {
      setIsSaving(false);
      window.setTimeout(() => setSaveMessage(null), 1800);
    }
  };

  const applyLaneUpdate = async (
    laneId: string,
    updater: (lane: Lane) => Lane,
    options?: { persist?: boolean },
  ) => {
    const nextLanes = lanes.map((lane) =>
      lane.id === laneId ? updater(lane) : lane,
    );

    setLanes(nextLanes);

    if (options?.persist ?? false) {
      await save(nextLanes);
    }
  };

  const updateLaneLocally = (laneId: string, updater: (lane: Lane) => Lane) => {
    void applyLaneUpdate(laneId, updater);
  };

  const commitLane = async (laneId: string, updater: (lane: Lane) => Lane) => {
    await applyLaneUpdate(laneId, updater, { persist: true });
  };

  const updateTaskDraft = (laneId: string, draft: TaskDraft | null) => {
    setTaskDrafts((current) => ({ ...current, [laneId]: draft }));
  };

  const submitTaskDraft = async (lane: Lane) => {
    const draft = taskDrafts[lane.id];
    if (!draft) return;

    const taskName = draft.task.trim();
    if (!taskName) {
      setSaveMessage("Task title is required");
      return;
    }

    // Clear the draft immediately so the form disappears right away
    updateTaskDraft(lane.id, null);

    await commitLane(lane.id, (current) => ({
      ...current,
      tasks: [
        ...current.tasks,
        {
          id: `task-${current.tasks.length + 1}-${slugify(taskName)}`,
          task: taskName,
          status: draft.status,
          notes: draft.notes.trim(),
          ...(draft.contentPath.trim()
            ? { contentPath: draft.contentPath.trim() }
            : {}),
        },
      ],
    }));
  };

  const removeTask = async (laneId: string, taskIndex: number) => {
    await commitLane(laneId, (current) => ({
      ...current,
      tasks: current.tasks.filter((_, index) => index !== taskIndex),
    }));
  };

  const addLane = async () => {
    const nextLanes: Lane[] = [
      ...lanes,
      {
        id: `custom-${slugify(`lane-${lanes.length + 1}`)}`,
        label: `New lane ${lanes.length + 1}`,
        path: `custom/roadmap/lane-${lanes.length + 1}.md`,
        tasks: [],
        aggregateStatus: "not_started",
      },
    ];
    setOpenIndex(nextLanes.length - 1);
    await save(nextLanes);
  };

  // Open reset modal (kept as a named function so it's easy to instrument/debug)
  const openResetModal = () => {
    // Debug: show a console marker so we can confirm the click handler runs
    // eslint-disable-next-line no-console
    console.log("LaneAccordion: openResetModal called");
    setShowResetModal(true);
  };

  // Accessibility: focus the confirm button and close on Escape while modal is open
  useEffect(() => {
    if (!showResetModal) return;

    // Focus the Reset button for keyboard users
    const timer = setTimeout(() => {
      resetConfirmRef.current?.focus();
    }, 0);

    function handleKey(e: KeyboardEvent) {
      // Close on Escape
      // @ts-ignore - using KeyboardEvent from DOM
      if (e.key === "Escape") {
        setShowResetModal(false);
      }
    }

    window.addEventListener("keydown", handleKey as any);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKey as any);
    };
  }, [showResetModal]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#312a22]/15 bg-[#fffaf2]/88 px-5 py-4 shadow-[0_4px_16px_rgba(68,49,31,0.08)]">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[#245c4f]">
            editable roadmap
          </p>
          <p className="mt-1 text-sm text-[#5f584f]">
            Edit lane names, task copy, notes, and statuses. New projects will snapshot the current roadmap state.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saveMessage && (
            <span className="text-xs text-[#5f584f]">{saveMessage}</span>
          )}
          <button
            type="button"
            onClick={openResetModal}
            disabled={isSaving}
            className="rounded-full border border-[#312a22]/15 bg-white px-4 py-2 text-sm text-[#1d1a17] transition hover:bg-[#f8f3eb] disabled:opacity-60"
          >
            Reset lanes & tasks
          </button>

          <button
            type="button"
            onClick={() => void addLane()}
            disabled={isSaving}
            className="rounded-full bg-[#245c4f] px-4 py-2 text-sm font-semibold text-[#fff8f2] transition hover:bg-[#1f4f44] disabled:opacity-60"
          >
            + Add lane
          </button>
        </div>
      </div>

      {showResetModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowResetModal(false)} />
          <div role="dialog" aria-modal="true" aria-labelledby="reset-title" className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-lg">
            <h3 id="reset-title" className="text-lg font-semibold text-[#1d1a17]">Reset roadmap to defaults</h3>
            <p className="mt-2 text-sm text-[#5f584f]">This will restore all lanes and tasks from the instruction files in <code className="rounded bg-[#f3f2ef] px-1 py-0.5 text-xs">.github/instructions</code> and overwrite any edits saved in your browser. This action cannot be undone.</p>
            <div className="mt-4 flex justify-end gap-3">
              <button
                ref={resetCancelRef}
                type="button"
                onClick={() => setShowResetModal(false)}
                className="rounded-full border border-[#312a22]/15 bg-white px-4 py-2 text-sm text-[#1d1a17] transition hover:bg-[#f8f3eb]"
              >
                Cancel
              </button>
              <button
                ref={resetConfirmRef}
                type="button"
                onClick={async () => {
                  setShowResetModal(false);
                  try {
                    setIsSaving(true);
                    setSaveMessage(null);
                    setLanes(initialLanes);
                    setOpenIndex(getActiveLaneIndex(initialLanes));
                    await save(initialLanes);
                    setSaveMessage("Reset to defaults");
                  } catch (e) {
                    setSaveMessage(e instanceof Error ? e.message : "Failed to reset roadmap");
                  } finally {
                    setIsSaving(false);
                    window.setTimeout(() => setSaveMessage(null), 1800);
                  }
                }}
                className="rounded-full bg-[#cf2f2f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b82727]"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {lanes.map((lane, index) => {
        const isOpen = openIndex === index;
        const activeLaneIndex = getActiveLaneIndex(lanes);
        const isActive = index === activeLaneIndex;
        const allDone = lane.aggregateStatus === "done";
        const taskDraft = taskDrafts[lane.id];

        return (
          <div
            key={lane.id}
            className={`overflow-hidden rounded-2xl border shadow-[0_4px_16px_rgba(68,49,31,0.08)] transition-all ${
              isActive
                ? "border-[#245c4f]/30 bg-[#fffaf2]/98"
                : "border-[#312a22]/15 bg-[#fffaf2]/88"
            }`}
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex w-full items-center justify-between gap-4 p-5 text-left"
              aria-expanded={isOpen}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                    isActive
                      ? "bg-[#245c4f]"
                      : allDone
                        ? "bg-emerald-400"
                        : "bg-[#312a22]/20"
                  }`}
                />
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#245c4f]">
                    {isActive ? "active lane" : `lane ${index + 1}`}
                  </p>
                  <h2 className="mt-0.5 truncate text-lg text-[#1d1a17]">
                    {lane.label}
                  </h2>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="rounded-full border border-[#312a22]/15 bg-white/65 px-3 py-1 text-xs uppercase tracking-[0.08em] text-[#1d1a17]">
                  {statusLabels[lane.aggregateStatus]}
                </span>
                <svg
                  className={`h-4 w-4 shrink-0 text-[#5f584f] transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
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
              <div className="space-y-4 border-t border-[#312a22]/10 px-5 pb-5 pt-4">
                <input
                  value={lane.label}
                  onChange={(event) =>
                    updateLaneLocally(lane.id, (current) => ({
                      ...current,
                      label: event.target.value,
                    }))
                  }
                  onBlur={() => void commitLane(lane.id, (current) => current)}
                  placeholder="Lane name"
                  className="w-full rounded-xl border border-[#312a22]/15 bg-white px-3 py-2 text-sm font-semibold text-[#1d1a17] outline-none focus:border-[#245c4f]/40 focus:ring-2 focus:ring-[#245c4f]/20"
                />

                <div className="space-y-3">
                  {lane.tasks.map((task, taskIndex) => (
                    <article
                      key={task.id ?? `${lane.id}-${taskIndex}`}
                      className="rounded-xl border border-[#312a22]/15 bg-white/60 p-4"
                    >
                      <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-start">
                        <input
                          value={task.task}
                          onChange={(event) =>
                            updateLaneLocally(lane.id, (current) => ({
                              ...current,
                              tasks: current.tasks.map((entry, entryIndex) =>
                                entryIndex === taskIndex
                                  ? { ...entry, task: event.target.value }
                                  : entry,
                              ),
                            }))
                          }
                          onBlur={() =>
                            void commitLane(lane.id, (current) => current)
                          }
                          placeholder="Task title"
                          className="w-full rounded-lg border border-[#312a22]/15 bg-white px-3 py-2 text-sm font-semibold text-[#1d1a17] outline-none focus:border-[#245c4f]/40 focus:ring-2 focus:ring-[#245c4f]/20"
                        />
                        <select
                          value={task.status}
                          onChange={(event) => {
                            const nextStatus = event.target.value as Task["status"];
                            void commitLane(lane.id, (current) => ({
                               ...current,
                               tasks: current.tasks.map((entry, entryIndex) =>
                                 entryIndex === taskIndex
                                   ? { ...entry, status: nextStatus }
                                   : entry,
                               ),
                            }));
                           }}
                          className={`rounded-full border px-3 py-2 text-xs uppercase tracking-[0.08em] ${statusColors[task.status]}`}
                        >
                          {statusOptions.map((status) => (
                            <option key={status} value={status}>
                              {statusLabels[status]}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => void removeTask(lane.id, taskIndex)}
                          className="rounded-full border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-100"
                        >
                          Remove
                        </button>
                      </div>

                      <textarea
                        value={task.notes}
                        onChange={(event) =>
                          updateLaneLocally(lane.id, (current) => ({
                            ...current,
                            tasks: current.tasks.map((entry, entryIndex) =>
                              entryIndex === taskIndex
                                ? { ...entry, notes: event.target.value }
                                : entry,
                            ),
                          }))
                        }
                        onBlur={() => void commitLane(lane.id, (current) => current)}
                        rows={3}
                        placeholder="Task notes"
                        className="mt-3 w-full rounded-lg border border-[#312a22]/15 bg-white px-3 py-2 text-sm text-[#5f584f] outline-none focus:border-[#245c4f]/40 focus:ring-2 focus:ring-[#245c4f]/20"
                      />

                      <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                        <input
                          value={task.contentPath ?? ""}
                          onChange={(event) =>
                            updateLaneLocally(lane.id, (current) => ({
                              ...current,
                              tasks: current.tasks.map((entry, entryIndex) =>
                                entryIndex === taskIndex
                                  ? {
                                      ...entry,
                                      contentPath:
                                        event.target.value.trim() || undefined,
                                    }
                                  : entry,
                              ),
                            }))
                          }
                          onBlur={() => void commitLane(lane.id, (current) => current)}
                          placeholder="Optional content path"
                          className="w-full rounded-lg border border-[#312a22]/15 bg-white px-3 py-2 text-sm text-[#1d1a17] outline-none focus:border-[#245c4f]/40 focus:ring-2 focus:ring-[#245c4f]/20"
                        />
                        {task.contentPath ? (
                          <a
                            href={getRawContentUrl(task.contentPath)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#245c4f] underline-offset-2 hover:underline"
                          >
                            View output
                          </a>
                        ) : (
                          <span className="text-xs text-[#5f584f]">
                            No linked content
                          </span>
                        )}
                      </div>
                    </article>
                  ))}

                  {taskDraft && (
                    <TaskDraftEditor
                      draft={taskDraft}
                      onChange={(draft) => updateTaskDraft(lane.id, draft)}
                      onSubmit={() => void submitTaskDraft(lane)}
                      onCancel={() => updateTaskDraft(lane.id, null)}
                    />
                  )}
                </div>

                {!taskDraft && (
                  <button
                    type="button"
                    onClick={() => updateTaskDraft(lane.id, getEmptyDraft())}
                    className="rounded-full border border-[#312a22]/15 bg-white/70 px-4 py-2 text-sm text-[#1d1a17] transition hover:bg-white"
                  >
                    + Add task
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
