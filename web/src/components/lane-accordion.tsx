"use client";

import { type KeyboardEvent, useEffect, useState } from "react";

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

type LaneLabelEdit = {
  laneId: string;
  value: string;
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
  const [laneLabelEdit, setLaneLabelEdit] = useState<LaneLabelEdit | null>(null);

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

  const startLaneLabelEdit = (lane: Lane) => {
    setLaneLabelEdit({ laneId: lane.id, value: lane.label });
    setOpenIndex(null);
  };

  const saveLaneLabelEdit = async (lane: Lane) => {
    if (laneLabelEdit?.laneId !== lane.id) return;

    const nextLabel = laneLabelEdit.value.trim();
    if (!nextLabel) {
      setSaveMessage("Lane name is required");
      return;
    }

    await commitLane(lane.id, (current) => ({
      ...current,
      label: nextLabel,
    }));
    setLaneLabelEdit(null);
  };

  const cancelLaneLabelEdit = () => {
    setLaneLabelEdit(null);
  };

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
            onClick={() => void addLane()}
            disabled={isSaving}
            className="rounded-full bg-[#245c4f] px-4 py-2 text-sm font-semibold text-[#fff8f2] transition hover:bg-[#1f4f44] disabled:opacity-60"
          >
            + Add lane
          </button>
        </div>
      </div>

      {lanes.map((lane, index) => {
        const isOpen = openIndex === index;
        const activeLaneIndex = getActiveLaneIndex(lanes);
        const isActive = index === activeLaneIndex;
        const allDone = lane.aggregateStatus === "done";
        const taskDraft = taskDrafts[lane.id];
        const isEditingLaneLabel = laneLabelEdit?.laneId === lane.id;
        const currentLaneLabelEdit = isEditingLaneLabel ? laneLabelEdit : null;
        const showTaskPanel = isOpen && !isEditingLaneLabel;

        return (
          <div
            key={lane.id}
            className={`overflow-hidden rounded-2xl border shadow-[0_4px_16px_rgba(68,49,31,0.08)] transition-all ${
              isActive
                ? "border-[#245c4f]/30 bg-[#fffaf2]/98"
                : "border-[#312a22]/15 bg-[#fffaf2]/88"
            }`}
          >
            <div className="flex items-center justify-between gap-4 p-5">
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
                aria-expanded={isOpen}
                aria-controls={`lane-panel-${lane.id}`}
              >
                <span
                  className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                    isActive
                      ? "bg-[#245c4f]"
                      : allDone
                        ? "bg-emerald-400"
                        : "bg-[#312a22]/20"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#245c4f]">
                    {isActive ? "active lane" : `lane ${index + 1}`}
                  </p>
                  <p className="mt-0.5 truncate text-lg text-[#1d1a17]">
                    {lane.label}
                  </p>
                </div>
              </button>

              <div className="flex shrink-0 items-center gap-3">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    startLaneLabelEdit(lane);
                  }}
                  aria-label={`Edit ${lane.label}`}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#312a22]/15 bg-white/75 text-[#5f584f] transition hover:bg-white hover:text-[#1d1a17] focus:outline-none focus:ring-2 focus:ring-[#245c4f]/40"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.166 2.5a1.768 1.768 0 0 1 2.5 2.5l-8.75 8.75L4.167 15.833l2.083-3.75 7.916-7.583Z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M11.667 5l3.333 3.333"
                    />
                  </svg>
                </button>
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
            </div>

            {isEditingLaneLabel ? (
              <div className="border-t border-[#312a22]/10 px-5 pb-5 pt-4">
                <div className="flex gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={currentLaneLabelEdit?.value ?? ""}
                    onChange={(e) =>
                      currentLaneLabelEdit &&
                      setLaneLabelEdit({
                        ...currentLaneLabelEdit,
                        value: e.target.value,
                      })
                    }
                    onKeyDown={(e) => {
                      if (!currentLaneLabelEdit) return;

                      if (e.key === "Enter") {
                        e.preventDefault();
                        void saveLaneLabelEdit(lane);
                      }
                      if (e.key === "Escape") {
                        e.preventDefault();
                        cancelLaneLabelEdit();
                      }
                    }}
                    placeholder="Lane name"
                    className="flex-1 rounded-xl border border-[#245c4f]/40 bg-white px-3 py-2 text-sm font-semibold text-[#1d1a17] outline-none focus:ring-2 focus:ring-[#245c4f]/20"
                  />
                  <button
                    type="button"
                    onClick={() => void saveLaneLabelEdit(lane)}
                    className="rounded-full bg-[#245c4f] px-4 py-2 text-sm font-semibold text-[#fff8f2] transition hover:bg-[#1f4f44]"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={cancelLaneLabelEdit}
                    className="rounded-full border border-[#312a22]/15 bg-white px-4 py-2 text-sm text-[#1d1a17] transition hover:bg-[#f8f3eb]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}

            {showTaskPanel && (
              <div
                id={`lane-panel-${lane.id}`}
                className="space-y-4 border-t border-[#312a22]/10 px-5 pb-5 pt-4"
              >
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
