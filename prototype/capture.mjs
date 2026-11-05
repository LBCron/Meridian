/**
 * Capture harness for the detective-moments prototype.
 *
 * What it does:
 *   1. Measures the mock case screen's full height.
 *   2. Saves the three settled-pose stills (?hold=instr|hook|win) — these
 *      double as the reduced-motion still concept.
 *   3. Records the full 43s show as a silent webm. The show flashes a
 *      black bar for its first 0.12s so the mux step can find show-time
 *      zero in the recording and lay the six rendered voice lines on
 *      their exact cues (see REPORT.md / BRANCH_STATUS.md for the mux).
 *
 * Playwright is resolved from the sibling meridian-home-ship checkout —
 * this design branch carries no node_modules of its own, deliberately:
 * a prototype harness should not grow the repo's dependency tree.
 *
 * Run under the shared VM browser lock, like every browser run here:
 *   flock ~/workspace/.e2e.lock node prototype/capture.mjs
 */
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  ({ chromium } = require(
    "/home/hatch/workspace/meridian-home-ship/node_modules/playwright",
  ));
}

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PAGE = "file://" + path.join(HERE, "detective-moments.html");
const EVIDENCE = "/home/hatch/workspace/meridian-detective-evidence";
const REC_DIR = "/tmp/detective-rec";
const CHROME =
  "/home/hatch/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome";
const SHOW_MS = 46000; // 43s show + tail

fs.mkdirSync(EVIDENCE, { recursive: true });
fs.mkdirSync(REC_DIR, { recursive: true });

const browser = await chromium.launch({ executablePath: CHROME });

// Pass 1 — measure the screen height so every capture frames it exactly.
const probe = await browser.newPage({ viewport: { width: 480, height: 900 } });
await probe.goto(PAGE + "?hold=instr");
const H = await probe.evaluate(
  () => document.getElementById("screen").offsetHeight,
);
await probe.close();
console.log("screen height:", H);

// Pass 2 — settled-pose stills.
for (const hold of ["instr", "hook", "win"]) {
  const page = await browser.newPage({ viewport: { width: 480, height: H } });
  await page.goto(PAGE + "?hold=" + hold);
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(EVIDENCE, hold + "-still.png"),
  });
  await page.close();
  console.log("still saved:", hold);
}

// Pass 3 — the show, recorded silent; audio is muxed afterwards.
const ctx = await browser.newContext({
  viewport: { width: 480, height: H },
  recordVideo: { dir: REC_DIR, size: { width: 480, height: H } },
});
const page = await ctx.newPage();
await page.goto(PAGE);
await page.waitForTimeout(SHOW_MS);
const video = page.video();
await ctx.close();
const webm = await video.path();
console.log("recorded:", webm);
await browser.close();
console.log(JSON.stringify({ height: H, webm }));
