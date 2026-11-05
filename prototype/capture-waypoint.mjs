/**
 * Capture harness for the WAYPOINT COMPANION demo mockup.
 * 1) waypoint-docked.png + waypoint-thinking.png from ?hold= settles
 * 2) the full 52 s show recorded silent (black bar flashes at show
 *    t=0..0.35 after a 0.9 s preroll, so the trim can find show-zero)
 * 3) window.__trace (50 ms geometry samples) dumped to
 *    waypoint-trace.json for the clearance audit.
 * Run: flock ~/workspace/.e2e.lock node prototype/capture-waypoint.mjs
 */
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require("playwright")); }
catch { ({ chromium } = require("/home/hatch/workspace/meridian-home-ship/node_modules/playwright")); }

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PAGE = "file://" + path.join(HERE, "waypoint-demo.html");
const EVIDENCE = "/home/hatch/workspace/meridian-detective-evidence";
const REC_DIR = "/home/hatch/workspace/.waypoint-rec"; // persistent disk: /tmp is wiped by service restarts (it ate the first recording)
const CHROME = "/home/hatch/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome";
const SHOW_MS = 54500;

fs.mkdirSync(EVIDENCE, { recursive: true });
fs.mkdirSync(REC_DIR, { recursive: true });
const browser = await chromium.launch({ executablePath: CHROME });

// probe screen height
const probe = await browser.newPage({ viewport: { width: 480, height: 900 } });
await probe.goto(PAGE + "?hold=docked");
const H = await probe.evaluate(() => document.getElementById("screen").offsetHeight);
await probe.close();
console.log("screen height:", H);

for (const hold of ["docked", "thinking"]) {
  const page = await browser.newPage({ viewport: { width: 480, height: H } });
  await page.goto(PAGE + "?hold=" + hold);
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(EVIDENCE, "waypoint-" + hold + ".png") });
  await page.close();
  console.log("still saved:", hold);
}

const ctx = await browser.newContext({ viewport: { width: 480, height: H }, recordVideo: { dir: REC_DIR, size: { width: 480, height: H } } });
const page = await ctx.newPage();
await page.goto(PAGE);
await page.waitForTimeout(SHOW_MS);
const trace = await page.evaluate(() => window.__trace);
fs.writeFileSync(path.join(EVIDENCE, "waypoint-trace.json"), JSON.stringify(trace));
console.log("trace samples:", trace.length);
const video = page.video();
await ctx.close();
const webm = await video.path();
console.log("recorded:", webm);
await browser.close();
console.log(JSON.stringify({ height: H, webm }));
