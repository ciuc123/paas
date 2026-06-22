import fs from "fs";
import path from "path";

import { LaneAccordion } from "@/components/lane-accordion";
import { lanesManifest, loadRoadmapLanes } from "@/lib/roadmap";

export const dynamic = "force-dynamic";

function readLocalInstructions(): Record<string, string> {
  const result: Record<string, string> = {};
  // Try a few candidate repository roots — some dev environments run the server
  // with different current working directories. Read local instruction files
  // when available so `loadRoadmapLanes` can parse task tables without remote
  // fetches. If none are found, we silently fall back to remote raw.github URLs.
  const candidates = [
    process.cwd(),
    path.resolve(process.cwd(), ".."),
    path.resolve(process.cwd(), "..", ".."),
  ];

  // Allow an explicit override via environment variable for non-standard setups
  const envRoot = process.env.ROADMAP_REPO_ROOT || process.env.PAAS_REPO_ROOT;
  if (envRoot) {
    candidates.unshift(envRoot);
  }

  for (const entry of lanesManifest) {
    for (const repoRoot of candidates) {
      try {
        const fullPath = path.join(repoRoot, entry.path);
        const content = fs.readFileSync(fullPath, "utf-8");
        result[entry.path] = content;
        break; // found it for this entry, move to next entry
      } catch {
        // try next candidate
      }
    }
  }

  if (Object.keys(result).length === 0) {
    // eslint-disable-next-line no-console
    console.warn(
      "readLocalInstructions: no local instruction files found; falling back to remote fetches"
    );
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
