import {
  buildProjectSnapshotFromRoadmap,
  type Lane,
  loadEditableRoadmap,
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
    tasks: lane.tasks.map((task, index) => ({
      id: task.id ?? `task-${index + 1}-${slugify(task.task)}`,
      task: task.task,
      status: preserveStatus && "status" in task ? task.status : "not_started",
      notes: task.notes,
      ...(task.contentPath ? { contentPath: task.contentPath } : {}),
      ...("aiOutput" in task && task.aiOutput ? { aiOutput: task.aiOutput } : {}),
    })),
  }));
}

function buildLanes(name: string, keywords: string[]): RawLane[] {
  const primary = keywords[0] ?? "product";
  const secondary = keywords[1] ?? "platform";
  const audience = keywords[2] ?? "users";

  return [
    {
      id: "discovery",
      label: "Research & Discovery",
      tasks: [
        {
          task: `Define target audience for ${primary}`,
          notes: `Identify who benefits most from ${name} and what they need from this solution.`,
        },
        {
          task: `Research existing ${primary} solutions and market gaps`,
          notes: "Map competitors and substitutes to find your differentiation angle.",
        },
        {
          task: `Conduct 5 user interviews about ${secondary} needs`,
          notes: `Talk directly to potential ${audience}. Capture pain points in their own words.`,
        },
        {
          task: `Synthesize findings into a ${primary} opportunity brief`,
          notes: "Distill interview notes into the top 3 opportunities worth building.",
        },
      ],
    },
    {
      id: "strategy",
      label: "Strategy & Planning",
      tasks: [
        {
          task: `Write a core value statement for ${name}`,
          notes: "One sentence: who it helps, what it does, and why it matters.",
        },
        {
          task: `Select the first 3 use cases for ${primary}`,
          notes: "Keep scope narrow. Pick the use cases with highest impact and lowest complexity.",
        },
        {
          task: `Decide the pricing model for ${secondary}`,
          notes: "Choose between per-seat, per-use, subscription, or one-time payment before building.",
        },
        {
          task: "Draft the technical blueprint and stack",
          notes: "Document hosting, auth, storage, and AI provider choices before writing any code.",
        },
      ],
    },
    {
      id: "design",
      label: "Design & UX",
      tasks: [
        {
          task: `Map the end-to-end ${primary} user journey`,
          notes: "Trace every step from landing page through the first value moment.",
        },
        {
          task: `Create wireframes for the main ${name} screens`,
          notes: "Cover dashboard, onboarding, and the core product flow.",
        },
        {
          task: `Define tone of voice and copy guidelines for ${audience}`,
          notes: "Establish non-technical, friendly language that matches your audience.",
        },
        {
          task: `Validate wireframes with 2–3 real ${primary} users`,
          notes: "Collect feedback early before investing in development.",
        },
      ],
    },
    {
      id: "build",
      label: "Build & Develop",
      tasks: [
        {
          task: `Set up the ${name} repository and environments`,
          notes: "Configure dev, staging, and production environments from the start.",
        },
        {
          task: `Build auth, onboarding, and the ${primary} dashboard`,
          notes: "Get users signed in and to their first action as fast as possible.",
        },
        {
          task: `Implement the core ${secondary} feature`,
          notes: "The one thing the product must do well on day one.",
        },
        {
          task: `Integrate AI or automation for ${primary} workflows`,
          notes: "Add the smart layer that saves users time on repetitive tasks.",
        },
      ],
    },
    {
      id: "review",
      label: "Test & Review",
      tasks: [
        {
          task: `Run a ${primary} pilot with 3–5 real ${audience}`,
          notes: "Observe them using the product without guiding them. Capture friction points.",
        },
        {
          task: `Fix critical ${name} bugs from pilot feedback`,
          notes: "Prioritize bugs that block the core user journey.",
        },
        {
          task: `Validate pricing and willingness to pay for ${secondary}`,
          notes: "Ask directly: would they pay? At what price? What would stop them?",
        },
      ],
    },
    {
      id: "launch",
      label: "Launch & Grow",
      tasks: [
        {
          task: `Create the ${name} landing page and positioning`,
          notes: "Make the value proposition concrete with examples and outcomes, not just features.",
        },
        {
          task: `Execute outreach to the first 10 ${primary} customers`,
          notes: "Direct outreach beats ads at this stage. Be specific about the problem you solve.",
        },
        {
          task: `Set up analytics and feedback loops for ${secondary}`,
          notes: "Track only metrics that drive decisions. Add in-product feedback capture.",
        },
      ],
    },
  ];
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

function buildBaseRoadmapSnapshot(): ProjectLane[] {
  const editableRoadmap = loadEditableRoadmap();
  if (editableRoadmap.length > 0) {
    return toProjectLanes(buildProjectSnapshotFromRoadmap(editableRoadmap), true);
  }

  return [];
}

function normalizeProject(project: Project): Project {
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
    projectsCache = raw ? (JSON.parse(raw) as Project[]).map(normalizeProject) : [];
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

export function generateProjectFromPrompt(
  name: string,
  description: string,
): Project {
  const keywords = extractKeywords(`${name} ${description}`);
  const snapshotLanes = buildBaseRoadmapSnapshot();
  const extraLanes = toProjectLanes(buildExtraProjectLanes(name, keywords));
  const generatedFallbackLanes = toProjectLanes(buildLanes(name, keywords));
  const lanes =
    snapshotLanes.length > 0
      ? [...snapshotLanes, ...extraLanes]
      : [...generatedFallbackLanes, ...extraLanes];

  return normalizeProject({
    id: crypto.randomUUID(),
    name,
    description,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    generateStatus: "idle",
    lanes,
  });
}
