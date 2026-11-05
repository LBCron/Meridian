/**
 * Capture harness for the WAYPOINT COMPANION — REAL-PAGE mockup.
 *
 * Serves the REAL built app (main `7b04f28`, build-meta verified) the
 * way the repo's own E2E does (tests/e2e/helpers.ts serveBuiltArtifact
 * model), drives the real GeoDetective loop to the Henderson case via
 * the app's `?loop-puzzle=137` seam, injects the Holmes overlay
 * (prototype/waypoint-overlay.js — overlay only, no app source is
 * touched), and stages the council's waypoint behaviours with a REAL
 * pointer: real mouse exploration, a real map pan (drag), and the
 * app's real bottom sheet (search -> fly-to -> sheet -> "Not this
 * one"). Tiles: Chromium cannot tunnel to the tile host from this VM
 * (ERR_TUNNEL_CONNECTION_FAILED, measured), so the harness fetches the
 * real Esri tiles itself and fulfills them (tileMode "proxy").
 *
 * Recording goes to persistent disk (~/workspace/.waypoint-rec) —
 * /tmp is wiped by service restarts. A 0.5 s full-screen black flash
 * marks show-zero for the ffmpeg trim.
 *
 * Run: flock ~/workspace/.e2e.lock node prototype/capture-waypoint-realpage.mjs
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  BASE_URL,
  CHROME,
  DIST,
  LAUNCH_ARGS,
  installHarnessInitScripts,
  loadPlaywright,
  serveRealArtifact,
} from "./realpage-serve.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EVIDENCE = "/home/hatch/workspace/meridian-detective-evidence";
const REC_DIR = "/home/hatch/workspace/.waypoint-rec";
const OVERLAY_JS = fs.readFileSync(path.join(HERE, "waypoint-overlay.js"), "utf8");

fs.mkdirSync(EVIDENCE, { recursive: true });
fs.mkdirSync(REC_DIR, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log("[realpage]", ...a);

const buildMeta = JSON.parse(fs.readFileSync(path.join(DIST, "build-meta.json"), "utf8"));
log("serving dist buildId:", buildMeta.buildId);

const { chromium } = loadPlaywright();
const browser = await chromium.launch({ executablePath: CHROME, args: LAUNCH_ARGS });
const ctx = await browser.newContext({
  viewport: { width: 480, height: 950 },
  recordVideo: { dir: REC_DIR, size: { width: 480, height: 950 } },
});
await installHarnessInitScripts(ctx);
await serveRealArtifact(ctx, { tileMode: "proxy" });
const page = await ctx.newPage();
page.on("pageerror", (e) => log("pageerror:", e.message.slice(0, 160)));

/* ---------------- setup: drive the REAL loop to Henderson ---------------- */
await page.goto(`${BASE_URL}?loop-puzzle=137`);
await page.getByRole("button", { name: "GeoDetective: Solve a mystery" }).click();
await page.getByRole("heading", { name: "GeoDetective" }).waitFor({ timeout: 30_000 });
await page.getByRole("article", { name: /Clue 1: Geography/ }).waitFor({ timeout: 30_000 });
await page.getByTestId("loop-map").waitFor({ timeout: 30_000 });
log("loop screen up");

async function mapIdle(timeoutMs = 25_000) {
  await page.evaluate(
    (ms) =>
      new Promise((resolve) => {
        const el = document.querySelector('[data-testid="loop-map"]');
        const m = el && el.__loopMap;
        if (!m) return resolve("no-map");
        let done = false;
        const fin = (v) => { if (!done) { done = true; resolve(v); } };
        m.once("idle", () => fin("idle"));
        setTimeout(() => fin("timeout"), ms);
      }),
    timeoutMs,
  );
}
await mapIdle();

// Pre-warm the 11 MB name index (first-focus parse) before the show.
{
  const box = page.getByRole("combobox", { name: "Search the map" });
  await box.click();
  await box.fill("las");
  await page.getByRole("option").first().waitFor({ timeout: 30_000 });
  await box.press("Escape");
  await box.fill("");
  log("name index warmed");
}

// Frame the case region with the app's own E2E camera seam.
await page.evaluate(() => {
  const el = document.querySelector('[data-testid="loop-map"]');
  el.__loopMap.jumpTo({ center: [-114.98194, 36.0397], zoom: 9.5 });
});
await mapIdle();
await sleep(1500);
await page.screenshot({ path: path.join(REC_DIR, "setup.png") });

const proof = await page.evaluate(() => {
  const store = JSON.parse(localStorage.getItem("meridian.loop.v2") || "null");
  const el = document.querySelector('[data-testid="loop-map"]');
  return {
    index: store?.current?.index,
    status: store?.current?.status,
    guesses: store?.current?.guesses?.length,
    hasLoopMap: !!el?.__loopMap,
  };
});
log("proof:", JSON.stringify(proof));

/* ---------------- inject the Holmes overlay ---------------- */
await page.addScriptTag({ content: OVERLAY_JS });
const size = await page.evaluate(() => window.__wp.mapSize());
log("map size:", JSON.stringify(size));
const SX = size.w / 440, SY = size.h / 494;
const P = (x, y) => ({ x: Math.round(x * SX), y: Math.round(y * SY) });
const DOCK = P(8, 362);
const SPOT_A = P(110, 190), VIA = P(260, 290), BERTH_A = P(180, 40);
const STIR = P(235, 300), DRAG_TO = P(180, 355), HURRY_VIA = P(28, 210);
const SPOT_B = P(300, 170), BERTH_B = P(150, 25);

const wp = (fn, ...args) => page.evaluate(([f, a]) => window.__wp[f](...a), [fn, args]);
await page.evaluate(() => window.scrollTo(0, 0));
await sleep(300);
log("map origin at show start:", JSON.stringify(await mapOrigin()));
await wp("dock", DOCK.x, DOCK.y);
await wp("setState", "dock");

/* ---------------- pointer driving (real mouse) ---------------- */
async function mapOrigin() {
  return page.evaluate(() => {
    const r = document.querySelector('[data-testid="loop-map"]').getBoundingClientRect();
    return { x: r.left, y: r.top };
  });
}
let lastMouse = null;
async function glide(local, secs) {
  // Deadline-driven: CDP round-trips on this VM make step-counted
  // sleeps balloon (~3x measured), so positions are computed from
  // elapsed wall time and the glide ends on its deadline.
  const o = await mapOrigin();
  const to = { x: o.x + local.x, y: o.y + local.y };
  if (!lastMouse) {
    await page.mouse.move(to.x, to.y);
    lastMouse = to;
    return;
  }
  const from = { ...lastMouse };
  const t0 = Date.now();
  for (;;) {
    const t = Math.min(1, (Date.now() - t0) / (secs * 1000));
    const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    await page.mouse.move(from.x + (to.x - from.x) * e, from.y + (to.y - from.y) * e);
    if (t >= 1) break;
    await sleep(16);
  }
  lastMouse = to;
}
async function teleport(local) {
  const o = await mapOrigin();
  lastMouse = { x: o.x + local.x, y: o.y + local.y };
  await page.mouse.move(lastMouse.x, lastMouse.y);
}

/* ---------------- the show ---------------- */
const showT0 = Date.now();
const until = async (tSec) => {
  const d = tSec * 1000 - (Date.now() - showT0);
  if (d > 0) await sleep(d);
};
await wp("startClock");
await wp("flash", true);
await sleep(500);
await wp("flash", false);
log("show started");

// dock life: one glass-polish in the idle
await sleep(900); await wp("polish", true);
await sleep(1200); await wp("polish", false);

// fingertip enters and explores (real mouse; dot glued to it)
await teleport(P(350, 390));
await wp("fingerShow", true);
await wp("setState", "explore");
await glide(P(265, 300), 2.2);
await glide(P(200, 232), 2.0);
await glide(SPOT_A, 1.6);
await wp("setState", "pauseA");
await wp("fingerDip", true); await sleep(180); await wp("fingerDip", false);

// PAUSE confirmed (~0.6 s): Holmes walks over, wide swing, NE berth
await sleep(420);
await wp("setState", "walk1");
await wp("walk", VIA.x, VIA.y, 1.05);
await sleep(1050);
await wp("walk", BERTH_A.x, BERTH_A.y, 1.15);
await sleep(1250);
await wp("flip", true); await wp("think", true); await wp("plant");
await wp("setState", "thinkA");
log("think A");

// the thinking hold: one gaze shift
await sleep(2400); await wp("gaze", true);
await sleep(1200); await wp("gaze", false);

// the finger stirs, then DRAGS: the real map pans; Holmes cancels
await sleep(1600);
await wp("setState", "stir");
await glide(STIR, 1.2);
await wp("fingerDip", true);
await wp("setState", "pan");
const drag = (async () => {
  const o = await mapOrigin();
  await page.mouse.down();
  const from = { x: o.x + STIR.x, y: o.y + STIR.y };
  const to = { x: o.x + DRAG_TO.x, y: o.y + DRAG_TO.y };
  const steps = 45;
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(from.x + ((to.x - from.x) * i) / steps, from.y + ((to.y - from.y) * i) / steps);
    await sleep(1500 / steps);
  }
  await page.mouse.up();
  lastMouse = to;
})();
await sleep(150);
await wp("setState", "hurry");
await wp("think", false); await wp("hurry", true);
await wp("walk", HURRY_VIA.x, HURRY_VIA.y, 0.85, "cubic-bezier(.55,0,.9,.5)");
await sleep(850);
await wp("walk", DOCK.x, DOCK.y, 0.95, "cubic-bezier(.55,0,.9,.5)");
await drag;
await wp("fingerDip", false);
await sleep(1000);
await wp("hurry", false); await wp("flip", false); await wp("plant");
await wp("setState", "dock2");
await wp("fingerShow", false);
log("pan cancel done");

// a place tap, the app's own way: search -> fly-to -> REAL bottom sheet
await sleep(1200);
await wp("setState", "tap");
{
  const box = page.getByRole("combobox", { name: "Search the map" });
  await box.click();
  await box.fill("Las Vegas");
  const option = page.getByRole("option").first();
  await option.waitFor({ timeout: 15_000 });
  await option.click();
  await wp("absent", true); // absent before the sheet lands, for its whole life
  const dialog = page.getByRole("dialog");
  await dialog.waitFor({ timeout: 15_000 });
  await wp("setState", "sheet");
  const sheetText = await dialog.innerText();
  log("sheet open:", sheetText.replace(/\n/g, " | ").slice(0, 140));
  await sleep(5000);
  await page.getByRole("button", { name: "Not this one" }).click();
  await dialog.waitFor({ state: "detached", timeout: 10_000 }).catch(async () => {
    await dialog.waitFor({ state: "hidden", timeout: 5_000 });
  });
}
await wp("absent", false);
await wp("setState", "dock3");
log("sheet closed");
// restore the case framing (staging reset while Holmes is back at
// dock) and the page scroll (the sheet/search flow can drift it —
// composition holds only with the map fully in frame)
await page.evaluate(() => {
  const el = document.querySelector('[data-testid="loop-map"]');
  el.__loopMap.jumpTo({ center: [-114.98194, 36.0397], zoom: 9.5 });
  window.scrollTo(0, 0);
});
await sleep(1500);
{
  const o = await mapOrigin();
  log("map origin before explore2:", JSON.stringify(o));
}

// fingertip returns, explores to a SECOND pause at a different spot
await teleport(P(140, 430));
await wp("fingerShow", true);
await wp("setState", "explore2");
await glide(P(215, 300), 2.4);
await glide(P(272, 215), 2.3);
await glide(SPOT_B, 1.7);
await wp("setState", "pauseB");
await wp("fingerDip", true); await sleep(180); await wp("fingerDip", false);
await sleep(420);
await wp("setState", "walk2");
await wp("walk", BERTH_B.x, BERTH_B.y, 2.1);
await sleep(2200);
await wp("think", true); await wp("plant");
await wp("setState", "thinkB");
log("think B");

// gaze shift inside the second think
await sleep(3300); await wp("gaze", true);
await sleep(1200); await wp("gaze", false);

// the deliverable still: Holmes thinking beside the spot, real map
await sleep(600);
await page.evaluate(() => window.scrollTo(0, 0));
await sleep(250);
await page.screenshot({ path: path.join(EVIDENCE, "waypoint-realpage-thinking.png") });
log("still saved");

// held thinking beat to close
await sleep(4500);
await wp("setState", "end");
await wp("slate", true);
await sleep(2200);

const showSecs = (Date.now() - showT0) / 1000;
const trace = await page.evaluate(() => window.__wpTrace);
fs.writeFileSync(path.join(EVIDENCE, "waypoint-realpage-trace.json"), JSON.stringify(trace));
log("trace samples:", trace.length, "show seconds:", showSecs.toFixed(1));
const finalProof = await page.evaluate(() => {
  const store = JSON.parse(localStorage.getItem("meridian.loop.v2") || "null");
  return { index: store?.current?.index, status: store?.current?.status, guesses: store?.current?.guesses?.length };
});
log("final proof:", JSON.stringify(finalProof));

const video = page.video();
await ctx.close();
const webm = await video.path();
await browser.close();
log("recorded:", webm);

/* ---------------- post: trim at the flash, convert ---------------- */
import { spawnSync } from "node:child_process";
const bd = spawnSync("ffmpeg", ["-i", webm, "-vf", "blackdetect=d=0.3:pix_th=0.03", "-an", "-f", "null", "-"], { maxBuffer: 64 * 1024 * 1024 });
const stderr = bd.stderr?.toString() ?? "";
const segs = [...stderr.matchAll(/black_start:([\d.]+) black_end:([\d.]+) black_duration:([\d.]+)/g)]
  .map((m) => ({ start: +m[1], end: +m[2], dur: +m[3] }));
log("black segments:", JSON.stringify(segs));
const flashSeg = segs.find((s) => s.dur >= 0.3 && s.dur <= 1.2) ?? segs[0];
if (!flashSeg) throw new Error("no flash segment found for trim");
const trimStart = flashSeg.end;
const trimDur = showSecs - 0.5 + 1.0;
execFileSync("ffmpeg", [
  "-y", "-ss", String(trimStart), "-i", webm, "-t", String(trimDur),
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an",
  path.join(EVIDENCE, "waypoint-realpage.mp4"),
], { stdio: "inherit" });

log("DONE", JSON.stringify({ buildId: buildMeta.buildId, proof, finalProof, showSecs, trimStart }));
