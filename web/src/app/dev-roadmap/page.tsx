import fs from "fs";
import path from "path";

import { LaneAccordion } from "@/components/lane-accordion";
import { lanesManifest, loadRoadmapLanes } from "@/lib/roadmap";

export const dynamic = "force-dynamic";

function readLocalInstructions(): Record<string, string> {
  const result: Record<string, string> = {};
  const repoRoot = path.resolve(process.cwd(), "..");
  for (const entry of lanesManifest) {
    try {
      const fullPath = path.join(repoRoot, entry.path);
      result[entry.path] = fs.readFileSync(fullPath, "utf-8");
    } catch {
      // file not found — will fall back to remote fetch
    }
  }
  return result;
}

export default async function DevRoadmapPage() {
  const lanes = await loadRoadmapLanes(readLocalInstructions());

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold mb-4">Dev: Roadmap (no access checks)</h1>
        <LaneAccordion lanes={lanes} />
      </div>
    </main>
  );
}

