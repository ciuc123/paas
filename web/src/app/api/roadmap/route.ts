import { NextRequest, NextResponse } from "next/server";

import {
  DEFAULT_ROADMAP_ID,
  type EditableLaneInput,
  hasRoadmap,
  hydrateRoadmapLanes,
  listRoadmaps,
  loadRoadmapLanesById,
  serializeRoadmapLanes,
} from "@/lib/roadmap";

type RoadmapPayload = {
  roadmapId?: string;
  lanes: EditableLaneInput[];
};

export async function GET(request: NextRequest) {
  const roadmapId = request.nextUrl.searchParams.get("roadmapId") ?? DEFAULT_ROADMAP_ID;

  if (!hasRoadmap(roadmapId)) {
    return NextResponse.json({ error: `Unknown roadmapId: ${roadmapId}` }, { status: 400 });
  }

  const lanes = await loadRoadmapLanesById(roadmapId);

  return NextResponse.json({
    roadmapId,
    roadmaps: listRoadmaps().map((r) => ({ id: r.id, label: r.label })),
    lanes: serializeRoadmapLanes(lanes),
  });
}

export async function POST(request: Request) {
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

  const roadmapId = body.roadmapId ?? DEFAULT_ROADMAP_ID;
  if (!hasRoadmap(roadmapId)) {
    return NextResponse.json(
      { error: `Unknown roadmapId: ${roadmapId}` },
      { status: 400 },
    );
  }

  const normalized = hydrateRoadmapLanes(body.lanes);

  return NextResponse.json({
    roadmapId,
    lanes: serializeRoadmapLanes(normalized),
  });
}
