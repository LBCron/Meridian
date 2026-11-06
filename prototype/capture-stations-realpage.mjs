/**
 * Capture harness for the HOLMES & WATSON — TWO STATIONS real-page mockup.
 *
 * Serves the REAL built app (main `7b04f28`, build-meta verified) the
 * way the repo's own E2E does, drives the real GeoDetective loop to the
 * Henderson case via `?loop-puzzle=137`, injects the stations overlay
 * (prototype/stations-overlay.js — overlay only, no app source touched)
 * and stages the AGREED two-station scene (owner, voice call
 * 2026-11-05):
 *   - Watson stands AT the Clue 1 card, looking at it, and READS the
 *     question aloud (audio cue A — his verbatim Geography render,
 *     muxed in post);
 *   - Holmes lives ON the map (waypoint companion, as proven);
 *   - when the player MAKES A SELECTION (Las Vegas via the app's own
 *     search), HOLMES READS THE SELECTION aloud (audio cue B — new
 *     render, muxed in post) as the app's own bottom sheet rises;
 *   - sheet dismissed, second pause, second walk-over, held beat.
 * Tiles: proxy mode (Chromium cannot tunnel to the tile host here).
 *
 * Recording goes to persistent disk (~/workspace/.waypoint-rec). A
 * 0.5 s black flash marks show-zero for the ffmpeg trim; audio cue
 * offsets are logged against the flash end for the mux.
 *
 * Run: flock ~/workspace/.e2e.lock node prototype/capture-stations-realpage.mjs
 */
import { execFileSync, spawnSync } from "node:child_process";
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
const OVERLAY_JS = fs.readFileSync(path.join(HERE, "stations-overlay.js"), "utf8");
const WATSON_MP3 = path.join(EVIDENCE, "audio-v2/clue1-geography-watson.mp3");
const HOLMES_MP3 = path.join(EVIDENCE, "audio-v2/selection-lasvegas-holmes.mp3");
const WATSON_DUR = 8.95, HOLMES_DUR = 3.29;

fs.mkdirSync(EVIDENCE, { recursive: true });
fs.mkdirSync(REC_DIR, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log("[stations]", ...a);

const buildMeta = JSON.parse(fs.readFileSync(path.join(DIST, "build-meta.json"), "utf8"));
log("serving dist buildId:", buildMeta.buildId);

const { chromium } = loadPlaywright();
const browser = await chromium.launch({ executablePath: CHROME, args: LAUNCH_ARGS });
const ctx = await browser.newContext({
  viewport: { width: 480, height: 1420 },
  recordVideo: { dir: REC_DIR, size: { width: 480, height: 1420 } },
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

// Pre-warm the name index before the show.
{
  const box = page.getByRole("combobox", { name: "Search the map" });
  await box.click();
  await box.fill("las");
  await page.getByRole("option").first().waitFor({ timeout: 30_000 });
  await box.press("Escape");
  await box.fill("");
  log("name index warmed");
}

await page.evaluate(() => {
  const el = document.querySelector('[data-testid="loop-map"]');
  el.__loopMap.jumpTo({ center: [-114.98194, 36.0397], zoom: 9.5 });
});
await mapIdle();
await sleep(1500);
await page.evaluate(() => window.scrollTo(0, 0));
await sleep(300);

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

/* ---------------- inject the stations overlay ---------------- */
await page.addScriptTag({ content: OVERLAY_JS });
// Frame the shot: the loop screen flex-grows its map on tall viewports,
// which pushes the clue card below the fold. Scroll so the Clue 1 card
// sits at viewport y=1186 (its position in the probed composition) —
// map, search and card all in one frame, Watson standing at the card.
const SCROLL_Y = await page.evaluate(() => {
  const a = document.querySelector('article[aria-label^="Clue 1"]');
  const docTop = a.getBoundingClientRect().top + window.scrollY;
  const y = Math.max(0, Math.round(docTop - 1186));
  window.__stScrollY = y;
  window.scrollTo(0, y);
  return y;
});
await sleep(400);
log("framing scrollY:", SCROLL_Y);
const berth = await page.evaluate(() => window.__wp.watsonBerth());
log("Watson berth:", JSON.stringify(berth));
const size = await page.evaluate(() => window.__wp.mapSize());
log("map size:", JSON.stringify(size));
const SX = size.w / 440, SY = size.h / 494;
const P = (x, y) => ({ x: Math.round(x * SX), y: Math.round(y * SY) });
const DOCK = P(8, 362);
const SPOT_A = P(110, 190), VIA = P(260, 290), BERTH_A = P(180, 40);
const STIR = P(235, 300), DRAG_TO = P(180, 355), HURRY_VIA = P(28, 210);
const SPOT_B = P(300, 170), BERTH_B = P(150, 25);

const wp = (fn, ...args) => page.evaluate(([f, a]) => window.__wp[f](...a), [fn, args]);
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
const zeroWall = showT0 + 500; // flash end == trimmed zero
const cues = {};
const mark = (name) => { cues[name] = (Date.now() - zeroWall) / 1000; };
await wp("startClock");
await wp("flash", true);
await sleep(500);
await wp("flash", false);
log("show started");

// Watson settles at the question: notebook up, leaning in, looking at it.
await sleep(600);
await wp("watsonNotebook", true);
await wp("watsonReading", true);
await wp("setState", "read");

// === AUDIO CUE A: Watson reads the question (Clue 1, verbatim) ===
await sleep(600);
mark("watsonLine");
await wp("watsonSpeak", true);
log("cue A (Watson reads) at", cues.watsonLine.toFixed(2));
await sleep(3000);
await page.screenshot({ path: path.join(EVIDENCE, "stations-watson.png") });
log("still: Watson at the question");
await sleep((WATSON_DUR - 3.0) * 1000);
await wp("watsonSpeak", false);
await wp("watsonNotebook", false);
await wp("watsonReading", false);
await wp("watsonPencil", true);
await wp("setState", "dock");

// fingertip explores the map; Holmes ignores motion
await sleep(900);
await teleport(P(350, 390));
await wp("fingerShow", true);
await wp("setState", "explore");
await glide(P(265, 300), 2.2);
await glide(P(200, 232), 2.0);
await glide(SPOT_A, 1.6);
await wp("setState", "pauseA");
await wp("fingerDip", true); await sleep(180); await wp("fingerDip", false);

// PAUSE confirmed (~0.6 s): Holmes walks over, thinks beside the spot
await sleep(420);
await wp("setState", "walk1");
await wp("walk", VIA.x, VIA.y, 1.05);
await sleep(1050);
await wp("walk", BERTH_A.x, BERTH_A.y, 1.15);
await sleep(1250);
await wp("flip", true); await wp("think", true); await wp("plant");
await wp("setState", "thinkA");
log("think A");
await sleep(2400); await wp("gaze", true);
await sleep(1200); await wp("gaze", false);

// the finger drags: real pan; Holmes cancels to dock
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

// === THE SELECTION: the player picks Las Vegas; HOLMES READS IT ===
await sleep(1200);
await wp("setState", "tap");
{
  const box = page.getByRole("combobox", { name: "Search the map" });
  await box.click();
  await box.fill("Las Vegas");
  const option = page.getByRole("option").first();
  await option.waitFor({ timeout: 15_000 });
  mark("holmesLine");
  await wp("holmesSpeak", true);
  log("cue B (Holmes reads the selection) at", cues.holmesLine.toFixed(2));
  await option.click();
  (async () => { await sleep(HOLMES_DUR * 1000); await wp("holmesSpeak", false).catch(() => {}); })();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor({ timeout: 15_000 });
  await wp("absent", true); // absent for the sheet's whole life, as proven
  await wp("holmesSpeak", false);
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
await page.evaluate(() => {
  const el = document.querySelector('[data-testid="loop-map"]');
  el.__loopMap.jumpTo({ center: [-114.98194, 36.0397], zoom: 9.5 });
  window.scrollTo(0, window.__stScrollY || 0);
});
await sleep(1500);

// second pause at a different spot: Holmes walks over again
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
await sleep(600);
await page.evaluate(() => window.scrollTo(0, window.__stScrollY || 0));
await sleep(250);
await page.screenshot({ path: path.join(EVIDENCE, "stations-thinking.png") });
log("still: Holmes thinking");
await sleep(2400); await wp("gaze", true);
await sleep(1200); await wp("gaze", false);
await sleep(3500);
await wp("setState", "end");
await wp("slate", true);
await sleep(2200);

const showSecs = (Date.now() - showT0) / 1000;
const trace = await page.evaluate(() => window.__wpTrace);
fs.writeFileSync(path.join(EVIDENCE, "stations-realpage-trace.json"), JSON.stringify(trace));
fs.writeFileSync(path.join(EVIDENCE, "stations-cues.json"), JSON.stringify(cues, null, 1));
log("trace samples:", trace.length, "show seconds:", showSecs.toFixed(1), "cues:", JSON.stringify(cues));
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

/* ---------------- post: trim at the flash, mux the two lines ---------------- */
const bd = spawnSync("ffmpeg", ["-i", webm, "-vf", "blackdetect=d=0.04:pix_th=0.10", "-an", "-f", "null", "-"], { maxBuffer: 64 * 1024 * 1024 });
const stderr = bd.stderr?.toString() ?? "";
const segs = [...stderr.matchAll(/black_start:([\d.]+) black_end:([\d.]+) black_duration:([\d.]+)/g)]
  .map((m) => ({ start: +m[1], end: +m[2], dur: +m[3] }));
log("black segments:", JSON.stringify(segs));
// The screencast compresses the 0.5 s flash to ~0.16 s of video time;
// its END is still the flash-off instant the audio cues were logged
// against (zeroWall), so trim from black_end as before.
const flashSeg = segs.find((s) => s.dur >= 0.03 && s.dur <= 1.2) ?? segs[0];
if (!flashSeg) throw new Error("no flash segment found for trim");
const trimStart = flashSeg.end;
const trimDur = showSecs - 0.5 + 1.0;
const aMs = Math.round(cues.watsonLine * 1000);
const bMs = Math.round(cues.holmesLine * 1000);
execFileSync("ffmpeg", [
  "-y", "-ss", String(trimStart), "-i", webm, "-t", String(trimDur),
  "-i", WATSON_MP3, "-i", HOLMES_MP3,
  "-filter_complex",
  `[1:a]volume=14dB,adelay=${aMs}|${aMs}[a1];[2:a]adelay=${bMs}|${bMs}[a2];[a1][a2]amix=inputs=2:duration=longest:normalize=0[aout]`,
  "-map", "0:v", "-map", "[aout]",
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart",
  path.join(EVIDENCE, "stations-realpage.mp4"),
], { stdio: "inherit" });

log("DONE", JSON.stringify({ buildId: buildMeta.buildId, proof, finalProof, showSecs, trimStart, cues }));
