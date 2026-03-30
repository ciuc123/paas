import { NextResponse } from "next/server";

import {
  type EditableLaneInput,
  hydrateRoadmapLanes,
  serializeRoadmapLanes,
} from "@/lib/roadmap";

type RoadmapPayload = {
  lanes: EditableLaneInput[];
};

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

  const normalized = hydrateRoadmapLanes(body.lanes);

  return NextResponse.json({
    lanes: serializeRoadmapLanes(normalized),
  });
}

