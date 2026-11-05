/**
 * Capture harness for the ANIMATED detective-moments build.
 * 1) animated-sheet.png from animated-sheet.html
 * 2) settled-pose stills (?hold=instr|clue|hook|give|win)
 * 3) the full 93.5 s show recorded silent (black-bar flash at t=0 marks
 *    show-time zero for the audio mux).
 * Run: flock ~/workspace/.e2e.lock node prototype/capture-animated.mjs
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
const PAGE = "file://" + path.join(HERE, "detective-moments-animated.html");
const SHEET = "file://" + path.join(HERE, "animated-sheet.html");
const EVIDENCE = "/home/hatch/workspace/meridian-detective-evidence";
const REC_DIR = "/tmp/detective-rec2";
const CHROME = "/home/hatch/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome";
const SHOW_MS = 96500;

fs.mkdirSync(EVIDENCE, { recursive: true });
fs.mkdirSync(REC_DIR, { recursive: true });
const browser = await chromium.launch({ executablePath: CHROME });

// sheet
{
  const page = await browser.newPage({ viewport: { width: 480, height: 900 } });
  await page.goto(SHEET);
  await page.waitForTimeout(400);
  const h = await page.evaluate(() => document.body.scrollHeight);
  await page.setViewportSize({ width: 480, height: h });
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(EVIDENCE, "animated-sheet.png") });
  await page.close();
  console.log("sheet saved, height", h);
}

// probe screen height
const probe = await browser.newPage({ viewport: { width: 480, height: 900 } });
await probe.goto(PAGE + "?hold=instr");
const H = await probe.evaluate(() => document.getElementById("screen").offsetHeight);
await probe.close();
console.log("screen height:", H);

for (const hold of ["instr", "clue", "hook", "give", "win"]) {
  const page = await browser.newPage({ viewport: { width: 480, height: H } });
  await page.goto(PAGE + "?hold=" + hold);
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(EVIDENCE, "anim-" + hold + "-still.png") });
  await page.close();
  console.log("still saved:", hold);
}

const ctx = await browser.newContext({ viewport: { width: 480, height: H }, recordVideo: { dir: REC_DIR, size: { width: 480, height: H } } });
const page = await ctx.newPage();
await page.goto(PAGE);
await page.waitForTimeout(SHOW_MS);
const video = page.video();
await ctx.close();
const webm = await video.path();
console.log("recorded:", webm);
await browser.close();
console.log(JSON.stringify({ height: H, webm }));
