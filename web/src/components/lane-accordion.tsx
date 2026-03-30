"use client";

import { useState } from "react";

import { type Lane, type Task, statusLabels, getContentUrl } from "@/lib/roadmap";

const statusColors: Record<Task["status"], string> = {
  done: "border-emerald-200 bg-emerald-50 text-emerald-800",
  in_progress: "border-amber-200 bg-amber-50 text-amber-800",
  blocked: "border-red-200 bg-red-50 text-red-800",
  not_started: "border-[#312a22]/15 bg-white/60 text-[#5f584f]",
};

function getActiveLaneIndex(lanes: Lane[]): number {
  const idx = lanes.findIndex((lane) => lane.aggregateStatus !== "done");
  return idx === -1 ? 0 : idx;
}

function getRawContentUrl(contentPath: string): string {
  return getContentUrl(contentPath);
}

export function LaneAccordion({ lanes }: { lanes: Lane[] }) {
  const activeLaneIndex = getActiveLaneIndex(lanes);
  const [openIndex, setOpenIndex] = useState<number | null>(activeLaneIndex);

  return (
    <div className="space-y-2">
      {lanes.map((lane, index) => {
        const isOpen = openIndex === index;
        const isActive = index === activeLaneIndex;
        const allDone = lane.aggregateStatus === "done";

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
                    {isActive ? "active lane" : `lane ${index}`}
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
              <div className="space-y-2.5 border-t border-[#312a22]/10 px-5 pb-5 pt-4">
                {lane.tasks.map((task) => (
                  <article
                    key={`${lane.id}-${task.task}`}
                    className="rounded-xl border border-[#312a22]/15 bg-white/60 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-sm font-semibold text-[#1d1a17]">
                        {task.task}
                      </h3>
                      <span
                        className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.08em] ${statusColors[task.status]}`}
                      >
                        {statusLabels[task.status]}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-[#5f584f]">
                      {task.notes}
                    </p>
                    {task.contentPath && (
                      <div className="mt-2.5 flex flex-wrap items-center gap-3">
                        <a
                          href={getRawContentUrl(task.contentPath)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#245c4f] underline-offset-2 hover:underline"
                        >
                          <svg
                            className="h-3.5 w-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                            />
                          </svg>
                          View output
                        </a>
                        {task.contentPath.endsWith(".md") && (
                          <a
                            href={`/roadmap/content?path=${encodeURIComponent(task.contentPath)}`}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#245c4f] underline-offset-2 hover:underline"
                          >
                            <svg
                              className="h-3.5 w-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                            Read content
                          </a>
                        )}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
