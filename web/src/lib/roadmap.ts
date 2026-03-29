type InstructionFile = {
  id: string;
  label: string;
  path: string;
};

type Task = {
  task: string;
  status: "done" | "in_progress" | "blocked" | "not_started";
  notes: string;
};

export type Lane = {
  id: string;
  label: string;
  path: string;
  tasks: Task[];
  aggregateStatus: Task["status"];
};

const instructionFiles: InstructionFile[] = [
  {
    id: "research",
    label: "Research & Product",
    path: ".github/instructions/01-product-research.instructions.md",
  },
  {
    id: "architecture",
    label: "Framework & Architecture",
    path: ".github/instructions/02-product-architecture.instructions.md",
  },
  {
    id: "coachux",
    label: "Coach UX",
    path: ".github/instructions/03-coach-ux.instructions.md",
  },
  {
    id: "questionnaire",
    label: "Questionnaire & Rules",
    path: ".github/instructions/04-questionnaire-wizard.instructions.md",
  },
  {
    id: "backend",
    label: "Backend & Infra",
    path: ".github/instructions/05-backend-infrastructure.instructions.md",
  },
  {
    id: "frontend",
    label: "Frontend & UI",
    path: ".github/instructions/06-frontend-ui.instructions.md",
  },
  {
    id: "ai",
    label: "AI & Content",
    path: ".github/instructions/07-ai-content.instructions.md",
  },
  {
    id: "security",
    label: "Security & Privacy",
    path: ".github/instructions/08-security-privacy.instructions.md",
  },
  {
    id: "billing",
    label: "Monetization & Billing",
    path: ".github/instructions/09-monetization-billing.instructions.md",
  },
  {
    id: "analytics",
    label: "Analytics & Feedback",
    path: ".github/instructions/10-analytics-feedback.instructions.md",
  },
  {
    id: "pilot",
    label: "Pilot & Iteration",
    path: ".github/instructions/11-pilot-iterations.instructions.md",
  },
  {
    id: "gtm",
    label: "Go-To-Market",
    path: ".github/instructions/12-go-to-market.instructions.md",
  },
];

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
    .map(([task, status, notes]) => ({
      task,
      status: normalizeStatus(status),
      notes,
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

export async function loadRoadmapLanes(): Promise<Lane[]> {
  return Promise.all(
    instructionFiles.map(async (file) => {
      const response = await fetch(getRawUrl(file.path), {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Failed to load ${file.path}`);
      }

      const markdown = await response.text();
      const tasks = parseTaskTable(markdown);

      return {
        ...file,
        tasks,
        aggregateStatus: aggregateStatus(tasks),
      };
    }),
  );
}