type LaneManifestEntry = {
  id: string;
  label: string;
  path: string;
  defaultTasks?: Task[];
};

export type Task = {
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

const lanesManifestPath = ".github/instructions/lanes.json";

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

function parseTaskTable(markdown: string): Task[] {
  const match = markdown.match(/## Task Status\s+([\s\S]*?)(?:\n##\s|$)/);
  if (!match) {
    throw new Error("Missing Task Status section");
  }

  const rows = match[1]
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|"));

  return rows
    .slice(2)
    .map((line) => line.split("|").slice(1, -1).map((cell) => cell.trim()))
    .filter((cells) => cells.length >= 3)
    .map(([task, status, notes, content]) => ({
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

async function loadLanesManifest(): Promise<LaneManifestEntry[]> {
  const response = await fetch(getRawUrl(lanesManifestPath), {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to load lanes manifest: ${lanesManifestPath}`);
  }

  try {
    return (await response.json()) as LaneManifestEntry[];
  } catch {
    throw new Error(
      `Invalid JSON in lanes manifest: ${lanesManifestPath}`,
    );
  }
}

export async function loadRoadmapLanes(): Promise<Lane[]> {
  const manifest = await loadLanesManifest();

  return Promise.all(
    manifest.map(async (entry) => {
      const response = await fetch(getRawUrl(entry.path), {
        cache: "no-store",
      });

      if (!response.ok) {
        const tasks = entry.defaultTasks ?? [];
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

      return {
        id: entry.id,
        label: entry.label,
        path: entry.path,
        tasks,
        aggregateStatus: aggregateStatus(tasks),
      };
    }),
  );
}