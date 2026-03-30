import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import type { ProjectLane } from "@/lib/projects";

type GenerateRequest = {
  lanes: ProjectLane[];
};

type TaskRef = {
  laneId: string;
  laneLabel: string;
  taskIndex: number;
  task: string;
  notes: string;
};

function buildPrompt(task: string, laneLabel: string, notes: string): string {
  return `You are an expert coaching platform product advisor.

Lane: "${laneLabel}"
Task: "${task}"
Current notes: "${notes}"

In 2-3 concise sentences, describe the most important action to complete this task for a coaching platform. Be specific and actionable. Focus on what the coach needs to do next.`;
}

async function callOpenAI(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return "";

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
      temperature: 0.7,
    }),
  });

  if (!response.ok) return "";

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

function simulateOutput(task: string, laneLabel: string): string {
  const templates = [
    `To complete "${task}" in the ${laneLabel} lane, identify the specific deliverable, assign a clear owner, and set a concrete deadline with measurable success criteria.`,
    `For "${task}", start by auditing what already exists, then draft a minimal implementation that satisfies the core requirement before expanding scope.`,
    `Completing "${task}" requires a focused sprint: gather existing inputs, define the output format, and schedule a review checkpoint to confirm quality before marking done.`,
  ];
  // Select a template deterministically so the same task always gets the same template
  // across multiple renders, avoiding flickering in simulated responses.
  const idx =
    (task.length + laneLabel.length) % templates.length;
  return templates[idx];
}

function encodeSSE(data: object): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  let body: GenerateRequest;
  try {
    body = (await request.json()) as GenerateRequest;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
    });
  }

  const { lanes } = body;
  if (!Array.isArray(lanes)) {
    return new Response(JSON.stringify({ error: "lanes must be an array" }), {
      status: 400,
    });
  }

  const tasks: TaskRef[] = [];
  for (const lane of lanes) {
    lane.tasks.forEach((t, i) => {
      tasks.push({
        laneId: lane.id,
        laneLabel: lane.label,
        taskIndex: i,
        task: t.task,
        notes: t.notes,
      });
    });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();

      const send = (data: object) => {
        controller.enqueue(enc.encode(encodeSSE(data)));
      };

      for (const ref of tasks) {
        // Mark in_progress
        send({
          laneId: ref.laneId,
          taskIndex: ref.taskIndex,
          status: "in_progress",
          aiOutput: null,
        });

        // Small delay for realistic streaming feel
        await new Promise((r) => setTimeout(r, 200));

        // Call AI or simulate
        const prompt = buildPrompt(ref.task, ref.laneLabel, ref.notes);
        let output = await callOpenAI(prompt);
        if (!output) {
          output = simulateOutput(ref.task, ref.laneLabel);
        }

        // Mark done with output
        send({
          laneId: ref.laneId,
          taskIndex: ref.taskIndex,
          status: "done",
          aiOutput: output,
        });

        // Small delay between tasks
        await new Promise((r) => setTimeout(r, 100));
      }

      // Signal completion
      send({ done: true });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
