import type { Lane } from "@/lib/roadmap";

export type ProjectTask = {
  task: string;
  status: "done" | "in_progress" | "blocked" | "not_started";
  notes: string;
  contentPath?: string;
  aiOutput?: string;
};

export type ProjectLane = {
  id: string;
  label: string;
  tasks: ProjectTask[];
};

export type Project = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  lanes: ProjectLane[];
  generateStatus: "idle" | "generating" | "done";
};

const STORAGE_KEY = "paas_projects";

// In-process subscriber set — triggers useSyncExternalStore re-reads
const subscribers = new Set<() => void>();

export function subscribeProjects(callback: () => void): () => void {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}

function notifySubscribers(): void {
  for (const cb of subscribers) cb();
}

export function loadProjects(): Project[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Project[]) : [];
  } catch {
    return [];
  }
}

export function saveProjects(projects: Project[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function getProject(id: string): Project | null {
  return loadProjects().find((p) => p.id === id) ?? null;
}

export function upsertProject(project: Project): void {
  const projects = loadProjects();
  const idx = projects.findIndex((p) => p.id === project.id);
  if (idx === -1) {
    projects.unshift(project);
  } else {
    projects[idx] = project;
  }
  saveProjects(projects);
  notifySubscribers();
}

export function deleteProject(id: string): void {
  saveProjects(loadProjects().filter((p) => p.id !== id));
  notifySubscribers();
}

export function seedProjectFromLanes(
  name: string,
  lanes: Lane[],
): Project {
  return {
    id: crypto.randomUUID(),
    name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    generateStatus: "idle",
    lanes: lanes.map((lane) => ({
      id: lane.id,
      label: lane.label,
      tasks: lane.tasks.map((t) => ({
        task: t.task,
        status: t.status,
        notes: t.notes,
        ...(t.contentPath ? { contentPath: t.contentPath } : {}),
      })),
    })),
  };
}
