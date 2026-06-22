import { NextResponse } from "next/server";

import {
  type EditableLaneInput,
  hydrateRoadmapLanes,
  serializeRoadmapLanes,
} from "@/lib/roadmap";

type RoadmapPayload = {
  lanes: EditableLaneInput[];
};

// Simple in-memory IP rate limiter for public roadmap endpoint (MVP). Replace with Redis for prod.
const ROADMAP_IP_RATE_LIMIT_PER_MINUTE = 60;
type RoadmapBucket = { tokens: number; lastRefill: number };
const roadmapIpBuckets: Map<string, RoadmapBucket> = new Map();

function getClientIpFromRequest(req: Request): string {
  try {
    const headers = (req as any).headers;
    const forwarded = headers?.get?.("x-forwarded-for") || headers?.get?.("x-real-ip") || headers?.get?.("cf-connecting-ip");
    if (forwarded && typeof forwarded === "string") return forwarded.split(",")[0].trim();
  } catch {}
  return "unknown";
}

function allowRoadmapIp(key: string): boolean {
  const now = Date.now();
  const windowMs = 60_000;
  const bucket = roadmapIpBuckets.get(key) ?? { tokens: ROADMAP_IP_RATE_LIMIT_PER_MINUTE, lastRefill: now };
  const elapsed = now - bucket.lastRefill;
  if (elapsed > 0) {
    const refill = (elapsed / windowMs) * ROADMAP_IP_RATE_LIMIT_PER_MINUTE;
    bucket.tokens = Math.min(ROADMAP_IP_RATE_LIMIT_PER_MINUTE, bucket.tokens + refill);
    bucket.lastRefill = now;
  }
  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    roadmapIpBuckets.set(key, bucket);
    return true;
  }
  roadmapIpBuckets.set(key, bucket);
  return false;
}

export async function POST(request: Request) {
  // rate-limit public callers by IP
  try {
    const ip = getClientIpFromRequest(request);
    if (!allowRoadmapIp(ip)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
  } catch (e) {
    console.warn('Roadmap rate-limit check failed', e);
  }
  let body: RoadmapPayload;

  try {
    body = (await request.json()) as RoadmapPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!Array.isArray(body.lanes)) {
    return NextResponse.json(
      { error: "lanes must be an array" },
      { status: 400 },
    );
  }

  const normalized = hydrateRoadmapLanes(body.lanes);

  return NextResponse.json({
    lanes: serializeRoadmapLanes(normalized),
  });
}
