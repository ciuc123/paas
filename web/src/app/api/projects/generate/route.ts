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
  const apiKey = (globalThis as any).process?.env?.OPENAI_API_KEY;
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
  const idx = (task.length + laneLabel.length) % templates.length;
  return templates[idx];
}

function encodeSSE(data: object): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

// Hard limits to protect OpenAI quota and server resources
const MAX_REQUEST_BYTES = 50_000; // reject bodies larger than ~50KB
const MAX_LANES = 15;
const MAX_TASKS_PER_LANE = 20;
const MAX_TASK_TEXT_LEN = 500; // task title
const MAX_NOTES_LEN = 2000; // task notes

// Simple in-memory rate limiting (MVP): per-IP and per-user token buckets.
// NOTE: This is best-effort for a single-instance deployment. For multi-instance/prod, replace with Redis or a shared store.
const IP_RATE_LIMIT_PER_MINUTE = 30; // requests per minute per IP
const USER_RATE_LIMIT_PER_MINUTE = 60; // requests per minute per user

type Bucket = { tokens: number; lastRefill: number };
const ipBuckets: Map<string, Bucket> = new Map();
const userBuckets: Map<string, Bucket> = new Map();

function getClientIp(req: NextRequest): string {
  const headers = (req as any).headers;
  // common proxy headers
  const forwarded = headers?.get?.('x-forwarded-for') || headers?.get?.('x-real-ip') || headers?.get?.('cf-connecting-ip');
  if (forwarded && typeof forwarded === 'string') {
    // x-forwarded-for can be a list
    return forwarded.split(',')[0].trim();
  }
  return 'unknown';
}

function allowRequest(bucketMap: Map<string, Bucket>, key: string, capacityPerMinute: number): boolean {
  const now = Date.now();
  const windowMs = 60_000;
  const bucket = bucketMap.get(key) ?? { tokens: capacityPerMinute, lastRefill: now };

  // refill proportionally
  const elapsed = now - bucket.lastRefill;
  if (elapsed > 0) {
    const refill = (elapsed / windowMs) * capacityPerMinute;
    bucket.tokens = Math.min(capacityPerMinute, bucket.tokens + refill);
    bucket.lastRefill = now;
  }

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    bucketMap.set(key, bucket);
    return true;
  }

  // not allowed
  bucketMap.set(key, bucket);
  return false;
}

export async function POST(request: NextRequest) {
  // Authentication is not required for this endpoint. Anonymous users are allowed.
  // If a Clerk user ID is available in the runtime, it will be used for per-user
  // rate limiting; otherwise the request is rate-limited by IP only.
  let userId: string | null = null;

  // Rate limiting: per-IP and per-user
  try {
    const clientIp = getClientIp(request);
    if (!allowRequest(ipBuckets, clientIp, IP_RATE_LIMIT_PER_MINUTE)) {
      return new Response(JSON.stringify({ error: "Too many requests (ip)" }), {
        status: 429,
        headers: { "Content-Type": "application/json", "Retry-After": "60" },
      });
    }

    if (userId && !allowRequest(userBuckets, userId, USER_RATE_LIMIT_PER_MINUTE)) {
      return new Response(JSON.stringify({ error: "Too many requests (user)" }), {
        status: 429,
        headers: { "Content-Type": "application/json", "Retry-After": "60" },
      });
    }
  } catch (e) {
    // continue on unexpected rate-limit helper failures — don't block valid requests
    console.warn('Rate limit check failed', e);
  }

  // Quick fail on excessively large uploads. Prefer Content-Length header when present.
  const contentLength = (request as any).headers?.get("content-length");
  if (contentLength) {
    const parsed = Number(contentLength);
    if (!Number.isNaN(parsed) && parsed > MAX_REQUEST_BYTES) {
      return new Response(JSON.stringify({ error: "Request body too large" }), {
        status: 413,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // Read raw text so we can enforce a total size cap even when Content-Length is missing
  let raw: string;
  try {
    raw = await (request as any).text();
  } catch {
    return new Response(JSON.stringify({ error: "Could not read request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (raw.length > MAX_REQUEST_BYTES) {
    return new Response(JSON.stringify({ error: "Request body too large" }), {
      status: 413,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: GenerateRequest;
  try {
    body = JSON.parse(raw) as GenerateRequest;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { lanes } = body;
  if (!Array.isArray(lanes)) {
    return new Response(JSON.stringify({ error: "lanes must be an array" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Enforce lane/task limits
  if (lanes.length === 0) {
    return new Response(JSON.stringify({ error: "lanes must not be empty" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Only count lanes that contain at least one task when applying the MAX_LANES limit.
  const activeLanes = lanes.filter((l: any) => Array.isArray(l.tasks) && l.tasks.length > 0).length;
  if (activeLanes > MAX_LANES) {
    return new Response(JSON.stringify({ error: `Too many lanes with tasks (max ${MAX_LANES})` }), {
      status: 413,
      headers: { "Content-Type": "application/json" },
    });
  }

  const tasks: TaskRef[] = [];
  try {
    for (const lane of lanes) {
      if (!Array.isArray(lane.tasks)) {
        return new Response(JSON.stringify({ error: "each lane.tasks must be an array" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (lane.tasks.length > MAX_TASKS_PER_LANE) {
        return new Response(
          JSON.stringify({ error: `Too many tasks in lane '${lane.label ?? lane.id ?? "?"}' (max ${MAX_TASKS_PER_LANE})` }),
          { status: 413, headers: { "Content-Type": "application/json" } },
        );
      }

      for (let i = 0; i < lane.tasks.length; i++) {
        const t = lane.tasks[i] as any;
        if (typeof t.task !== "string" || typeof t.notes !== "string") {
          return new Response(JSON.stringify({ error: "task and notes must be strings" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
        if (t.task.length === 0 || t.task.length > MAX_TASK_TEXT_LEN) {
          return new Response(
            JSON.stringify({ error: `task length must be 1..${MAX_TASK_TEXT_LEN} characters` }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }
        if (t.notes.length > MAX_NOTES_LEN) {
          return new Response(
            JSON.stringify({ error: `notes length must be <= ${MAX_NOTES_LEN} characters` }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }

        tasks.push({
          laneId: lane.id,
          laneLabel: lane.label,
          taskIndex: i,
          task: t.task,
          notes: t.notes,
        });
      }
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: "Invalid request structure" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();

      const send = (data: object) => {
        controller.enqueue(enc.encode(encodeSSE(data)));
      };

      try {
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
      } catch (err) {
        // If an error happens during streaming, surface a single error event then close
        console.error("Generation error:", err);
        send({ error: "Generation failed" });
        controller.close();
      }
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
