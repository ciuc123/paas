import lanesManifest from "./lanes.json";

export { lanesManifest };

type LaneManifestEntry = {
  id: string;
  label: string;
  path: string;
  defaultTasks?: Task[];
};

export type Task = {
  id?: string;
  task: string;
  status: "done" | "in_progress" | "blocked" | "not_started";
  notes: string;
  contentPath?: string;
};

export type Lane = {
  id: string;
  label: string;
  path: string;
  tasks: Task[];
  aggregateStatus: Task["status"];
};

export const ROADMAP_STORAGE_KEY = "paas_roadmap";

export type EditableTaskInput = {
  id?: string;
  task: string;
  status: Task["status"];
  notes: string;
  contentPath?: string;
};

export type EditableLaneInput = {
  id: string;
  label: string;
  path: string;
  tasks: EditableTaskInput[];
};

const statusOrder: Task["status"][] = [
  "blocked",
  "in_progress",
  "not_started",
  "done",
];

export const statusLabels: Record<Task["status"], string> = {
  done: "Done",
  in_progress: "In Progress",
  blocked: "Blocked",
  not_started: "Not Started",
};

function normalizeStatus(value: string): Task["status"] {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, "_");
  if (
    normalized !== "done" &&
    normalized !== "in_progress" &&
    normalized !== "blocked" &&
    normalized !== "not_started"
  ) {
    throw new Error(`Unsupported status value: ${value}`);
  }

  return normalized;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || crypto.randomUUID();
}

function ensureTaskId(task: EditableTaskInput, index: number): EditableTaskInput {
  return {
    ...task,
    id: task.id ?? `task-${index + 1}-${slugify(task.task || task.notes || "task")}`,
  };
}

function normalizeTask(task: EditableTaskInput, index: number): Task {
  const contentPath = task.contentPath?.trim();

  return {
    id: task.id ?? `task-${index + 1}-${slugify(task.task || task.notes || "task")}`,
    task: task.task.trim(),
    status: task.status,
    notes: task.notes.trim(),
    ...(contentPath ? { contentPath } : {}),
  };
}

function normalizeLane(entry: EditableLaneInput, index: number): Lane {
  const tasks = (entry.tasks ?? []).map((task, taskIndex) =>
    normalizeTask(task, taskIndex),
  );

  return {
    id: entry.id || `lane-${index + 1}`,
    label: entry.label.trim() || `Lane ${index + 1}`,
    path: entry.path,
    tasks,
    aggregateStatus: aggregateStatus(tasks),
  };
}

function parseTaskTable(markdown: string): Task[] {
  const match = markdown.match(/##\s+Task Status\s+([\s\S]*?)(?:\n##\s|$)/i);
  if (!match) {
    // Fallback: try to find any markdown table that looks like a task/status table
    const lines = markdown
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    // Find a header row that contains Task and Status (case-insensitive)
    let headerIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.startsWith("|")) continue;
      const cells = line.split("|").slice(1, -1).map((c) => c.trim().toLowerCase());
      if (cells.length >= 2 && cells[0].includes("task") && cells[1].includes("status")) {
        headerIndex = i;
        break;
      }
    }

    if (headerIndex === -1) {
      throw new Error("Missing Task Status section");
    }

    const tableLines: string[] = [];
    for (let i = headerIndex; i < lines.length; i++) {
      const line = lines[i];
      if (!line.startsWith("|")) break;
      tableLines.push(line);
    }

    const rows = tableLines
      .map((line) => line.split("|").slice(1, -1).map((cell) => cell.trim()))
      .filter((cells) => cells.length >= 2)
      .filter((cells) => {
        const first = (cells[0] ?? "").toLowerCase();
        const second = (cells[1] ?? "").toLowerCase();
        return first !== "task" && second !== "status" && !/^[-:\s]+$/.test(cells.join(""));
      });

    return rows.map(([task, status, notes, content], index) => ({
      id: `task-${index + 1}-${slugify(task)}`,
      task,
      status: normalizeStatus(status),
      notes: notes ?? "",
      ...(content && content.length > 0 ? { contentPath: content } : {}),
    }));
  }

  const lines = match[1]
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|"));

  const rows = lines
    .map((line) => line.split("|").slice(1, -1).map((cell) => cell.trim()))
    .filter((cells) => cells.length >= 3)
    .filter((cells) => {
      const first = (cells[0] ?? "").toLowerCase();
      const second = (cells[1] ?? "").toLowerCase();
      return first !== "task" && second !== "status" && !/^[-:\s]+$/.test(cells.join(""));
    });

  return rows.map(([task, status, notes, content], index) => ({
    id: `task-${index + 1}-${slugify(task)}`,
    task,
    status: normalizeStatus(status),
    notes,
    ...(content && content.length > 0 ? { contentPath: content } : {}),
  }));
}

function aggregateStatus(tasks: Task[]): Task["status"] {
  const statuses = new Set(tasks.map((task) => task.status));

  for (const status of statusOrder) {
    if (statuses.has(status)) {
      return status;
    }
  }

  return "not_started";
}

function getRawUrl(path: string): string {
  return `https://raw.githubusercontent.com/ciuc123/paas/main/${path}`;
}

export function getContentUrl(contentPath: string): string {
  return getRawUrl(contentPath);
}

export async function loadRoadmapLanes(
  localContent?: Record<string, string>,
): Promise<Lane[]> {
  const manifest = lanesManifest as LaneManifestEntry[];

  return Promise.all(
    manifest.map(async (entry, index) => {
      // Use pre-loaded local content if provided (server-side)
      const local = localContent?.[entry.path];
      if (local !== undefined) {
        try {
          const tasks = parseTaskTable(local);
          return normalizeLane(
            { id: entry.id, label: entry.label, path: entry.path, tasks },
            index,
          );
        } catch {
          // fall through to remote fetch
        }
      }

      // Fall back to GitHub raw URL
      const response = await fetch(getRawUrl(entry.path), {
        cache: "no-store",
      });

      if (!response.ok) {
        const tasks = (entry.defaultTasks ?? []).map((task, taskIndex) =>
          normalizeTask(task, taskIndex),
        );
        return {
          id: entry.id,
          label: entry.label,
          path: entry.path,
          tasks,
          aggregateStatus: aggregateStatus(tasks),
        };
      }

      const markdown = await response.text();
      const tasks = parseTaskTable(markdown);

      return normalizeLane(
        {
          id: entry.id,
          label: entry.label,
          path: entry.path,
          tasks,
        },
        index,
      );
    }),
  );
}

export function serializeRoadmapLanes(lanes: Lane[]): EditableLaneInput[] {
  return lanes.map((lane) => ({
    id: lane.id,
    label: lane.label,
    path: lane.path,
    tasks: lane.tasks.map((task, index) => ensureTaskId(task, index)),
  }));
}

export function hydrateRoadmapLanes(input: EditableLaneInput[]): Lane[] {
  return input.map((lane, index) => normalizeLane(lane, index));
}

export function loadEditableRoadmap(): Lane[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(ROADMAP_STORAGE_KEY);
    if (!raw) return [];
    return hydrateRoadmapLanes(JSON.parse(raw) as EditableLaneInput[]);
  } catch {
    return [];
  }
}

export function saveEditableRoadmap(lanes: Lane[]): Lane[] {
  if (typeof window === "undefined") return lanes;
  const normalized = hydrateRoadmapLanes(serializeRoadmapLanes(lanes));
  localStorage.setItem(ROADMAP_STORAGE_KEY, JSON.stringify(serializeRoadmapLanes(normalized)));
  return normalized;
}

export function buildProjectSnapshotFromRoadmap(lanes: Lane[]): Lane[] {
  return hydrateRoadmapLanes(serializeRoadmapLanes(lanes));
}
