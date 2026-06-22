import fs from "fs";
import path from "path";
import assert from "assert";

import { loadRoadmapLanes, lanesManifest } from "../src/lib/roadmap";

async function run() {
  // Select a manifest entry we know exists in the repo
  const entry = lanesManifest.find((e) => e.id === "coachux");
  if (!entry) throw new Error("Expected lane manifest entry 'coachux' not found");

  const filePath = path.resolve(__dirname, "..", "..", entry.path);
  console.log("Reading instruction file:", filePath);

  const content = fs.readFileSync(filePath, "utf-8");

  const localContent: Record<string, string> = {};
  localContent[entry.path] = content;

  const lanes = await loadRoadmapLanes(localContent);

  const lane = lanes.find((l) => l.id === entry.id || l.path === entry.path);
  if (!lane) throw new Error("Lane missing after loadRoadmapLanes");

  console.log(`Parsed ${lane.tasks.length} tasks for lane '${lane.label}'`);

  // Basic assertions (adjust expectations if you change the file)
  assert(lane.tasks.length > 0, "Expected at least 1 task parsed from the instruction file");

  // Check a known task is present
  const expected = "Map the full coach user journey.";
  const found = lane.tasks.some((t) => t.task.includes("Map the full coach user journey"));
  assert(found, `Expected to find task containing: ${expected}`);

  console.log("Success: roadmap parsing produced tasks as expected");
}

run().catch((err) => {
  // Make sure script exits non-zero on failure for CI
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

