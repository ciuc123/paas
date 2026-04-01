import {
  DEFAULT_ROADMAP_ID,
  buildProjectSnapshotFromRoadmap,
  type Lane,
  loadEditableRoadmap,
  loadRoadmapLanesById,
} from "@/lib/roadmap";

export type ProjectTask = {
  id?: string;
  task: string;
  status: "done" | "in_progress" | "blocked" | "not_started";
  notes: string;
  contentPath?: string;
  aiOutput?: string;
};

export type ProjectLane = {
  id: string;
  label: string;
  path?: string;
  tasks: ProjectTask[];
};

export type Project = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  roadmapId: string;
  lanes: ProjectLane[];
  generateStatus: "idle" | "generating" | "done";
};

const STORAGE_KEY = "paas_projects";

let projectsCache: Project[] | null = null;
const subscribers = new Set<() => void>();

const STOP_WORDS = new Set([
  "with", "that", "this", "from", "have", "will", "your", "their",
  "what", "when", "where", "which", "about", "into", "through",
  "before", "after", "each", "more", "also", "both", "some", "such",
  "than", "then", "these", "those", "very", "want", "need", "make",
  "like", "just", "would", "could", "should", "build", "create",
]);

type RawTask = {
  id?: string;
  task: string;
  notes: string;
  contentPath?: string;
};

type RawLane = {
  id: string;
  label: string;
  path?: string;
  tasks: RawTask[];
};

function notifySubscribers(): void {
  for (const cb of subscribers) cb();
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || crypto.randomUUID();
}

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w))
    .filter((w, i, arr) => arr.indexOf(w) === i)
    .slice(0, 6);
}

function toProjectLanes(lanes: Array<RawLane | Lane>, preserveStatus = false): ProjectLane[] {
  return lanes.map((lane) => ({
    id: lane.id,
    label: lane.label,
    ...(lane.path ? { path: lane.path } : {}),
    tasks: lane.tasks.map((task, index): ProjectTask => {
      const normalizedTask: ProjectTask = {
        id: task.id ?? `task-${index + 1}-${slugify(task.task)}`,
        task: task.task,
        status:
          preserveStatus && "status" in task
            ? task.status
            : "not_started",
        notes: task.notes,
      };

      if (task.contentPath) {
        normalizedTask.contentPath = task.contentPath;
      }

      if ("aiOutput" in task && typeof task.aiOutput === "string") {
        normalizedTask.aiOutput = task.aiOutput;
      }

      return normalizedTask;
    }),
  }));
}

function buildExtraProjectLanes(name: string, keywords: string[]): RawLane[] {
  const primary = keywords[0] ?? "coach";
  const offer = keywords[1] ?? "program";

  return [
    {
      id: `project-setup-${slugify(name)}`,
      label: "Project Setup Extras",
      tasks: [
        {
          task: `Create a demo checklist for the ${name} kickoff`,
          notes: "Fake project-specific task for validating the first coach walkthrough and handoff steps.",
        },
        {
          task: `List the top 3 assumptions behind the ${primary} experience`,
          notes: "Capture the riskiest product assumptions before implementation expands.",
        },
      ],
    },
    {
      id: `launch-assets-${slugify(name)}`,
      label: "Launch Assets & Experiments",
      tasks: [
        {
          task: `Draft a sample invitation email for the ${offer} beta`,
          notes: "Fake project-specific task to help the coach start outreach quickly.",
        },
        {
          task: `Prepare a lightweight success scorecard for ${name}`,
          notes: "Track activation, engagement, and coach feedback during the pilot.",
        },
      ],
    },
  ];
}

function buildBaseRoadmapSnapshot(roadmapId: string): ProjectLane[] {
  if (roadmapId !== DEFAULT_ROADMAP_ID) return [];
  const editableRoadmap = loadEditableRoadmap();
  if (editableRoadmap.length === 0) return [];
  return toProjectLanes(buildProjectSnapshotFromRoadmap(editableRoadmap), true);
}

function normalizeProject(project: Project): Project {
  if (!project.roadmapId) {
    throw new Error("Project is missing roadmapId");
  }

  return {
    ...project,
    lanes: project.lanes.map((lane) => ({
      ...lane,
      tasks: lane.tasks.map((task, index) => ({
        ...task,
        id: task.id ?? `task-${index + 1}-${slugify(task.task || lane.id)}`,
        status: task.status ?? "not_started",
      })),
    })),
  };
}

export function subscribeProjects(callback: () => void): () => void {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}

export function loadProjects(): Project[] {
  if (typeof window === "undefined") return [];
  if (projectsCache !== null) return projectsCache;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    projectsCache = raw
      ? (JSON.parse(raw) as Project[]).map((p) =>
          normalizeProject({ ...p, roadmapId: p.roadmapId ?? DEFAULT_ROADMAP_ID }),
        )
      : [];
  } catch {
    projectsCache = [];
  }

  return projectsCache;
}

export function saveProjects(projects: Project[]): void {
  if (typeof window === "undefined") return;
  const normalized = projects.map(normalizeProject);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  projectsCache = normalized;
}

export function getProject(id: string): Project | null {
  return loadProjects().find((p) => p.id === id) ?? null;
}

export function upsertProject(project: Project): void {
  const projects = loadProjects();
  const normalizedProject = normalizeProject(project);
  const idx = projects.findIndex((p) => p.id === normalizedProject.id);
  const newProjects =
    idx === -1
      ? [normalizedProject, ...projects]
      : projects.map((p, i) => (i === idx ? normalizedProject : p));
  saveProjects(newProjects);
  notifySubscribers();
}

export function deleteProject(id: string): void {
  saveProjects(loadProjects().filter((p) => p.id !== id));
  notifySubscribers();
}

export async function generateProjectFromPrompt(
  name: string,
  description: string,
  roadmapId = DEFAULT_ROADMAP_ID,
): Promise<Project> {
  const keywords = extractKeywords(`${name} ${description}`);

  const editableSnapshot = buildBaseRoadmapSnapshot(roadmapId);
  const roadmapLanes =
    editableSnapshot.length > 0
      ? editableSnapshot
      : toProjectLanes(await loadRoadmapLanesById(roadmapId), true);

  const extraLanes = toProjectLanes(buildExtraProjectLanes(name, keywords));

  return normalizeProject({
    id: crypto.randomUUID(),
    name,
    description,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    roadmapId,
    lanes: [...roadmapLanes, ...extraLanes],
    generateStatus: "idle",
  });
}
