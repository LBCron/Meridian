/**
 * Capture harness for the HOLMES & WATSON — FULL INTERACTION LOOP
 * real-page mockup (owner's loop spec, 2026-11-05). Serves the REAL
 * built app (main `7b04f28`, build-meta verified) the way the repo's
 * E2E does, drives the real GeoDetective loop to the Henderson case
 * via `?loop-puzzle=137`, injects the loop overlay
 * (prototype/loop-overlay.js — overlay only, no app source touched)
 * and stages the full loop TWICE, with audio muxed in post:
 *
 *   PART 1 — Cycle 1 (Clue 1 Geography): Watson reads at the card,
 *     THINKING as he reads; Holmes acknowledges (ack 1) and SEARCHES
 *     the map; the fingertip takes over and his search shifts to the
 *     fingertip's area; the player picks Las Vegas — Holmes reads the
 *     selection + the suspicion line as the sheet rises (absent for
 *     the sheet's life, law unchanged), the guess misses, and the
 *     moment Clue 2 unlocks Holmes asks Watson for the next question.
 *     Cycle 2 (Clue 2 Climate) repeats the rhythm with ack 2 and a
 *     Henderson pick — SOLVE: both celebrate on the reveal screen
 *     (win lines, jump + high-five with spark, claps).
 *   PART 2 — FAIL CODA (fresh case, 4 prep misses before the flash):
 *     Clue 5 Giveaway readable on the last guess; ack 3; a Salt Lake
 *     City pick misses; "Out of guesses" — Holmes reads the game's
 *     own answer line aloud and both POUT, held.
 *
 * The two parts are concatenated with a 0.8 s black gap. Every spoken
 * beat is an independent render (voice SPEC): Watson "Hearty Oar"
 * reads the clues; Holmes "Burnished Trophy" does acks, selections,
 * the (single, reused) suspicion line, the next-question call, the
 * win lines and the answer read. Cue offsets are logged per part
 * against that part's flash end for the mux.
 *
 * Tiles: proxy mode (Chromium cannot tunnel to the tile host here).
 * Recording goes to persistent disk (~/workspace/.waypoint-rec).
 *
 * Run: flock ~/workspace/.e2e.lock node prototype/capture-loop-realpage.mjs
 * Probe: LOOP_PROBE=1 — same staging, plus frozen celebration / pout
 * stills for position solving, and no post-production.
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
const OVERLAY_JS = fs.readFileSync(path.join(HERE, "loop-overlay.js"), "utf8");
const PROBE = process.env.LOOP_PROBE === "1";

/* file, duration (s), mux gain (dB — per-file RMS normalised to the
 * stations-proven speech level; Watson's renders are quiet) */
const A = {
  clue1: { f: "audio-v2/clue1-geography-watson.mp3", dur: 8.95, gain: 14 },
  clue2: { f: "audio-loop/clue2-climate-watson.mp3", dur: 11.42, gain: 10 },
  clue5: { f: "audio-v2/clue5-giveaway-watson.mp3", dur: 10.03, gain: 10 },
  ack1: { f: "audio-loop/ack1.mp3", dur: 1.87, gain: 3 },
  ack4: { f: "audio-loop/ack4.mp3", dur: 1.97, gain: 0 },
  ack3: { f: "audio-loop/ack3.mp3", dur: 1.49, gain: 4 },
  selLV: { f: "audio-v2/selection-lasvegas-holmes.mp3", dur: 3.29, gain: 0 },
  selHend: { f: "audio-loop/selection-henderson.mp3", dur: 3.19, gain: 1 },
  selSLC: { f: "audio-loop/selection-saltlakecity.mp3", dur: 4.01, gain: 2 },
  suspicion: { f: "audio-loop/suspicion.mp3", dur: 3.14, gain: 4 },
  ask: { f: "audio-loop/ask-next.mp3", dur: 2.21, gain: 0 },
  winH: { f: "audio/win-holmes.mp3", dur: 1.46, gain: 0 },
  winW: { f: "audio/win-watson.mp3", dur: 3.58, gain: 5 },
  answer: { f: "audio-loop/answer-read.mp3", dur: 5.83, gain: 0 },
};
const SUSP_GAP = 0.26; // breath between the name read and the suspicion line

fs.mkdirSync(EVIDENCE, { recursive: true });
fs.mkdirSync(REC_DIR, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log("[loop]", ...a);

const buildMeta = JSON.parse(fs.readFileSync(path.join(DIST, "build-meta.json"), "utf8"));
log("serving dist buildId:", buildMeta.buildId, PROBE ? "(PROBE)" : "");

const { chromium } = loadPlaywright();
const browser = await chromium.launch({ executablePath: CHROME, args: LAUNCH_ARGS });

async function newStage() {
  const ctx = await browser.newContext({
    viewport: { width: 480, height: 1420 },
    recordVideo: { dir: REC_DIR, size: { width: 480, height: 1420 } },
  });
  await installHarnessInitScripts(ctx);
  await serveRealArtifact(ctx, { tileMode: "proxy" });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => log("pageerror:", e.message.slice(0, 160)));
  return { ctx, page };
}

async function driveToCase(page) {
  await page.goto(`${BASE_URL}?loop-puzzle=137`);
  await page.getByRole("button", { name: "GeoDetective: Solve a mystery" }).click();
  await page.getByRole("heading", { name: "GeoDetective" }).waitFor({ timeout: 30_000 });
  await page.getByRole("article", { name: /Clue 1: Geography/ }).waitFor({ timeout: 30_000 });
  await page.getByTestId("loop-map").waitFor({ timeout: 30_000 });
  await mapIdle(page);
  const box = page.getByRole("combobox", { name: "Search the map" });
  await box.click();
  await box.fill("las");
  await page.getByRole("option").first().waitFor({ timeout: 30_000 });
  await box.press("Escape");
  await box.fill("");
  await page.evaluate(() => {
    const el = document.querySelector('[data-testid="loop-map"]');
    el.__loopMap.jumpTo({ center: [-114.98194, 36.0397], zoom: 9.5 });
  });
  await mapIdle(page);
  await sleep(1200);
}

async function mapIdle(page, timeoutMs = 25_000) {
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

const store = (page) =>
  page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem("meridian.loop.v2") || "null");
    return {
      index: s?.current?.index,
      status: s?.current?.status,
      guesses: s?.current?.guesses?.length,
    };
  });

async function frameClue(page, n) {
  const y = await page.evaluate((clueN) => {
    const a = [...document.querySelectorAll("article")].find((el) =>
      new RegExp(`Clue ${clueN}\\b`).test(el.getAttribute("aria-label") || ""));
    if (!a) return -1;
    const docTop = a.getBoundingClientRect().top + window.scrollY;
    const yy = Math.max(0, Math.round(docTop - 1186));
    window.__stScrollY = yy;
    window.scrollTo(0, yy);
    return yy;
  }, n);
  await sleep(450);
  return y;
}

/* Pick a place through the app's own search and confirm the guess.
 * onPicked fires the instant the option is clicked (selection made). */
async function pickAndGuess(page, name, expectedGuesses, onPicked) {
  const box = page.getByRole("combobox", { name: "Search the map" });
  await box.click();
  await box.fill(name);
  const option = page.getByRole("option").first();
  await option.waitFor({ timeout: 15_000 });
  if (onPicked) await onPicked();
  await option.click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor({ timeout: 15_000 });
  return dialog;
}

async function confirmGuess(page, expectedGuesses) {
  await page.getByRole("button", { name: "Guess this place" }).click();
  await page.getByRole("dialog").waitFor({ state: "detached", timeout: 10_000 }).catch(async () => {
    await page.getByRole("dialog").waitFor({ state: "hidden", timeout: 5_000 }).catch(() => {});
  });
  for (let i = 0; i < 40; i++) {
    const s = await store(page);
    if (s.guesses >= expectedGuesses) return s;
    await sleep(250);
  }
  throw new Error("guess did not land: expected " + expectedGuesses);
}

function pointerKit(page, P) {
  let lastMouse = null;
  const origin = () =>
    page.evaluate(() => {
      const r = document.querySelector('[data-testid="loop-map"]').getBoundingClientRect();
      return { x: r.left, y: r.top };
    });
  return {
    async glide(local, secs) {
      const o = await origin();
      const to = { x: o.x + local.x, y: o.y + local.y };
      if (!lastMouse) { await page.mouse.move(to.x, to.y); lastMouse = to; return; }
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
    },
    async teleport(local) {
      const o = await origin();
      lastMouse = { x: o.x + local.x, y: o.y + local.y };
      await page.mouse.move(lastMouse.x, lastMouse.y);
    },
  };
}

/* Ending placement (viewport coords; solved on the probe stills):
 * the pair stands in front of the reveal, ground line near the
 * viewport foot, Holmes left facing right, Watson right facing left. */
const END_H = { x: 138, y: 1260 };
const END_W = { x: 186, y: 1271 };
const SPARK = { x: 201, y: 1270 };

async function runPart(partNo, showFn) {
  const { ctx, page } = await newStage();
  const video = page.video();
  const result = await showFn(page);
  const trace = await page.evaluate(() => window.__wpTrace).catch(() => []);
  fs.writeFileSync(
    path.join(EVIDENCE, `loop-trace-part${partNo}.json`),
    JSON.stringify(trace),
  );
  log(`part ${partNo}: trace samples`, trace.length, "show seconds", result.showSecs.toFixed(1));
  await ctx.close();
  const webm = await video.path();
  return { ...result, webm };
}

function stageKit(page) {
  const wp = (fn, ...args) => page.evaluate(([f, a]) => window.__wp[f](...a), [fn, args]);
  return wp;
}

async function designPoints(page) {
  const size = await page.evaluate(() => window.__wp.mapSize());
  const SX = size.w / 440, SY = size.h / 494;
  const P = (x, y) => ({ x: Math.round(x * SX), y: Math.round(y * SY) });
  return { size, P };
}

/* One full cycle: Watson reads clue n at his station (thinking as he
 * reads), Holmes acknowledges, searches, follows the fingertip, and
 * the player picks `pickName`. Returns after the guess resolves. */
async function runCycle(page, wp, P, ptr, cfg) {
  const { clueKey, ackKey, pickName, pickKey, guessesAfter, spot, berth, searchBerths, cues, mark } = cfg;
  // --- Watson reads, thinking ---
  await wp("setState", "read" + clueKey.slice(-1));
  await wp("watsonNotebook", true);
  await wp("watsonReading", true);
  await wp("plant"); // Holmes sits up: he is listening
  await sleep(500);
  mark(clueKey);
  await wp("watsonSpeak", true);
  const readDur = A[clueKey].dur;
  // pondering rhythm across the read: tilt in, hold, back, in again
  await sleep(readDur * 0.36 * 1000);
  await wp("watsonPonder", true);
  await sleep(1400);
  await wp("watsonPonder", false);
  await sleep(Math.max(0, readDur * 0.64 * 1000 - 1400 - 600));
  await wp("watsonPonder", true);
  await sleep(600);
  await wp("watsonSpeak", false);
  await wp("watsonPonder", false);
  await wp("watsonReading", false);
  await wp("watsonNotebook", false);
  await wp("watsonPencil", true);
  // --- Holmes acknowledges, then searches ---
  await sleep(300);
  mark(ackKey);
  await wp("holmesSpeak", true);
  await wp("setState", "search" + clueKey.slice(-1));
  (async () => { await sleep(A[ackKey].dur * 1000); await wp("holmesSpeak", false).catch(() => {}); })();
  await wp("flip", false);
  for (const [i, b] of searchBerths.entries()) {
    await wp("walk", b.x, b.y, i === 0 ? 1.4 : 1.6);
    await sleep((i === 0 ? 1400 : 1600) + 150);
    await wp("peer", true);
    await sleep(i === 0 ? 1400 : 1200);
    await wp("peer", false);
    await sleep(200);
  }
  // --- the player takes over: search shifts to the fingertip ---
  await ptr.teleport({ x: Math.round(spot.x + 250 * (480 / 440) * 0.4), y: spot.y + 190 });
  await wp("fingerShow", true);
  await wp("setState", "explore" + clueKey.slice(-1));
  await ptr.glide({ x: Math.round((spot.x + berth.x) / 2) + 60, y: Math.round((spot.y + berth.y) / 2) + 90 }, 1.7);
  await ptr.glide(spot, 1.5);
  await wp("fingerDip", true); await sleep(180); await wp("fingerDip", false);
  await sleep(450); // the pause: Holmes hurries to search THIS area
  await wp("hurry", true);
  await wp("walk", berth.x, berth.y, 1.5);
  await sleep(1650);
  await wp("hurry", false);
  await wp("flip", true);
  await wp("peer", true);
  await wp("setState", "shift" + clueKey.slice(-1));
  await sleep(1900);
  await wp("peer", false);
  await wp("fingerShow", false);
  // --- the selection: Holmes reads it, suspiciously ---
  await wp("setState", "select" + clueKey.slice(-1));
  const dialog = await pickAndGuess(page, pickName, guessesAfter, async () => {
    mark(pickKey);
    cues["suspicion" + clueKey.slice(-1)] = cues[pickKey] + A[pickKey].dur + SUSP_GAP;
    await wp("holmesSpeak", true);
    await wp("think", true); // glass at his eye for the suspicion beat
    // Absent from the click instant: the sheet can only exist after
    // this, so the absence law holds for every sheet-open sample.
    await wp("absent", true);
  });
  log("sheet open for", pickName);
  await wp("absent", true); // absent for the sheet's whole life — law unchanged
  await wp("holmesSpeak", false);
  await wp("setState", "sheet" + clueKey.slice(-1));
  const spokenTotal = A[pickKey].dur + SUSP_GAP + A.suspicion.dur;
  const elapsed = (Date.now() / 1000) - (cfg.zeroEpoch + cues[pickKey]);
  await sleep(Math.max(400, (spokenTotal - elapsed) * 1000));
  await wp("think", false);
  const after = await confirmGuess(page, guessesAfter);
  await wp("setState", "resolved");
  log("guess landed:", JSON.stringify(after));
  return after;
}

/* ================= PART 1: two cycles + the solve ================= */
async function part1Show(page) {
  await driveToCase(page);
  log("part 1 proof:", JSON.stringify(await store(page)));
  await page.addScriptTag({ content: OVERLAY_JS });
  await frameClue(page, 1);
  const { P } = await designPoints(page);
  const wp = stageKit(page);
  const ptr = pointerKit(page, P);
  const DOCK = P(8, 362);
  await wp("dock", DOCK.x, DOCK.y);
  await wp("watsonBerth");
  await wp("setState", "dock");

  const showT0 = Date.now();
  const zeroWall = showT0 + 500;
  const zeroEpoch = zeroWall / 1000;
  const cues = {};
  const mark = (name) => { cues[name] = (Date.now() - zeroWall) / 1000; };
  await wp("startClock");
  await wp("flash", true);
  await sleep(500);
  await wp("flash", false);
  await wp("slateText", "THE FULL LOOP · REAL PAGE · CASE 137 · HENDERSON");
  await wp("slate", true);
  await sleep(1600);
  await wp("slate", false);
  log("part 1 show started");

  await runCycle(page, wp, P, ptr, {
    clueKey: "clue1", ackKey: "ack1", pickName: "Las Vegas", pickKey: "selLV",
    guessesAfter: 1, cues, mark, zeroEpoch,
    spot: P(110, 190), berth: P(190, 42),
    searchBerths: [P(185, 55), P(315, 235)],
  });

  // The next question has unlocked: Holmes asks Watson for it.
  await wp("absent", false);
  await wp("setState", "ask");
  mark("ask");
  await wp("holmesSpeak", true);
  await sleep(A.ask.dur * 1000);
  await wp("holmesSpeak", false);
  await wp("walk", DOCK.x, DOCK.y, 1.2);
  // Watson steps over to the new card; the frame follows.
  await wp("setState", "station2");
  await frameClue(page, 2);
  await wp("watsonStation", 2);
  await sleep(1100);
  log("Watson re-stationed at Clue 2");

  await runCycle(page, wp, P, ptr, {
    clueKey: "clue2", ackKey: "ack4", pickName: "Henderson", pickKey: "selHend",
    guessesAfter: 2, cues, mark, zeroEpoch,
    spot: P(300, 170), berth: P(150, 25),
    searchBerths: [P(255, 60), P(90, 235)],
  });

  /* ---- SOLVE: the reveal. Both celebrate in front of it. ---- */
  await sleep(1200);
  const winH2 = await page.evaluate(() => {
    const s = document.querySelector('section[aria-label="You won"]');
    return s ? s.innerText.replace(/\n/g, " | ").slice(0, 160) : "NO REVEAL FOUND";
  });
  log("win reveal:", winH2);
  await page.screenshot({ path: path.join(EVIDENCE, "loop-reveal-win.png") });
  await wp("endingMode");
  await wp("absent", false);
  await wp("place", END_H.x, END_H.y);
  await wp("flip", false);
  await wp("watsonPlace", END_W.x, END_W.y);
  await wp("holmesExpr", "delighted");
  await wp("watsonExpr", "delighted");
  await wp("setState", "celebrate");
  mark("winH");
  await wp("holmesSpeak", true);
  await sleep(A.winH.dur * 1000);
  await wp("holmesSpeak", false);
  await sleep(250);
  mark("winW");
  await wp("watsonSpeak", true);
  await sleep(A.winW.dur * 1000);
  await wp("watsonSpeak", false);
  await sleep(500);
  if (PROBE) {
    await wp("holmesHi", true); await wp("watsonHi", true);
    await wp("holmesJump", true); await wp("watsonJump", true);
    await page.evaluate(() => {
      for (const id of ["wpHolmes", "stWatson"]) {
        const jw = document.querySelector(`#${id} .jumpwrap`);
        jw.style.animationDelay = "-0.45s";
        jw.style.animationPlayState = "paused";
      }
      const sp = document.getElementById("wpSpark");
      sp.style.left = "201px"; sp.style.top = "1270px";
      sp.classList.add("on");
      sp.style.animationDelay = "-0.2s";
      sp.style.animationPlayState = "paused";
      sp.style.opacity = "1";
    });
    await sleep(400);
    await page.screenshot({ path: path.join(EVIDENCE, "loop-celebrate-probe.png") });
    log("probe still: celebration apex");
    await sleep(1500);
  } else {
    await wp("holmesHi", true); await wp("watsonHi", true);
    await wp("holmesJump", true); await wp("watsonJump", true);
    await sleep(350);
    await wp("sparkAt", SPARK.x, SPARK.y);
    await sleep(1150);
    await wp("holmesHi", false); await wp("watsonHi", false);
    await wp("holmesJump", false); await wp("watsonJump", false);
    await wp("holmesClapTogether", true); await wp("watsonClapTogether", true);
    await sleep(400);
    await wp("holmesClap", true); await wp("watsonClap", true);
    await sleep(1700);
    await wp("holmesClap", false); await wp("watsonClap", false);
    await wp("holmesClapTogether", false); await wp("watsonClapTogether", false);
    await sleep(1600);
  }
  await wp("setState", "end1");
  const showSecs = (Date.now() - showT0) / 1000;
  log("part 1 final proof:", JSON.stringify(await store(page)));
  return { cues, showSecs };
}

/* ================= PART 2: the fail coda ================= */
async function part2Show(page) {
  await driveToCase(page);
  // Four quick prep misses (plain UI, no staging) leave one guess
  // with Clue 5 — the Giveaway — unlocked.
  for (const [i, name] of ["Las Vegas", "Phoenix", "Reno", "Tucson"].entries()) {
    await pickAndGuess(page, name, i + 1, null);
    await confirmGuess(page, i + 1);
    log("prep miss", i + 1, name);
  }
  log("part 2 proof after prep:", JSON.stringify(await store(page)));
  await page.addScriptTag({ content: OVERLAY_JS });
  const wp = stageKit(page);
  await frameClue(page, 5);
  await wp("watsonStation", 5);
  await sleep(1100); // his step-over glide finishes before the clock starts
  const { P } = await designPoints(page);
  const ptr = pointerKit(page, P);
  const DOCK = P(8, 362);
  await wp("dock", DOCK.x, DOCK.y);
  await wp("setState", "dock2");

  const showT0 = Date.now();
  const zeroWall = showT0 + 500;
  const zeroEpoch = zeroWall / 1000;
  const cues = {};
  const mark = (name) => { cues[name] = (Date.now() - zeroWall) / 1000; };
  await wp("startClock");
  await wp("flash", true);
  await sleep(500);
  await wp("flash", false);
  await wp("slateText", "SAME CASE · LAST GUESS · THE GIVEAWAY");
  await wp("slate", true);
  await sleep(1500);
  await wp("slate", false);
  log("part 2 show started");

  await runCycle(page, wp, P, ptr, {
    clueKey: "clue5", ackKey: "ack3", pickName: "Salt Lake City", pickKey: "selSLC",
    guessesAfter: 5, cues, mark, zeroEpoch,
    spot: P(110, 190), berth: P(190, 42),
    searchBerths: [P(185, 55)],
  });

  /* ---- OUT OF GUESSES: Holmes reads the answer; both pout. ---- */
  await sleep(1200);
  const failText = await page.evaluate(() => {
    const s = document.querySelector('section[aria-label="Out of guesses"]');
    const h2 = s ? s.querySelector("h2") : null;
    return {
      headline: s ? s.querySelector(".verdict-headline")?.textContent : null,
      answerH2: h2 ? h2.textContent : null,
      excerpt: s ? s.innerText.replace(/\n/g, " | ").slice(0, 160) : "NO REVEAL FOUND",
    };
  });
  log("fail reveal:", JSON.stringify(failText));
  await page.screenshot({ path: path.join(EVIDENCE, "loop-reveal-fail.png") });
  await wp("endingMode");
  await wp("absent", false);
  await wp("place", END_H.x, END_H.y);
  await wp("flip", false);
  await wp("watsonPlace", END_W.x, END_W.y);
  await wp("setState", "answer");
  mark("answer");
  await wp("holmesSpeak", true);
  await sleep(A.answer.dur * 1000);
  await wp("holmesSpeak", false);
  await wp("holmesExpr", "pout");
  await wp("watsonExpr", "pout");
  await wp("holmesSlump", true);
  await wp("watsonSlump", true);
  await wp("setState", "pout");
  log("pout held");
  if (PROBE) {
    await sleep(600);
    await page.screenshot({ path: path.join(EVIDENCE, "loop-pout-probe.png") });
    log("probe still: pout");
  }
  await sleep(4600);
  await wp("setState", "end2");
  const showSecs = (Date.now() - showT0) / 1000;
  log("part 2 final proof:", JSON.stringify(await store(page)));
  return { cues, showSecs, failText };
}

/* ================= run + post ================= */
const part1 = await runPart(1, part1Show);
const part2 = await runPart(2, part2Show);
await browser.close();

const allCues = { part1: part1.cues, part2: part2.cues };
fs.writeFileSync(path.join(EVIDENCE, "loop-cues.json"), JSON.stringify(allCues, null, 1));
log("cues:", JSON.stringify(allCues));
log("fail answer proof:", JSON.stringify(part2.failText));

if (PROBE) {
  log("PROBE done — stills in evidence; no post-production");
  process.exit(0);
}

/* Cue keys per part, in mux order. The suspicion entries in the cues
 * objects are keyed suspicion1 / suspicion2 / suspicion5 by cycle. */
const part1Keys = ["clue1", "ack1", "selLV", "suspicion1", "ask", "clue2", "ack4", "selHend", "suspicion2", "winH", "winW"];
const part2Keys = ["clue5", "ack3", "selSLC", "suspicion5", "answer"];
const audioKeyFor = (k) => (k.startsWith("suspicion") ? "suspicion" : k);

function muxPart2(part, cueKeys, outName) {
  const bd = spawnSync("ffmpeg", ["-i", part.webm, "-vf", "blackdetect=d=0.04:pix_th=0.10", "-an", "-f", "null", "-"], { maxBuffer: 64 * 1024 * 1024 });
  const stderr = bd.stderr?.toString() ?? "";
  const segs = [...stderr.matchAll(/black_start:([\d.]+) black_end:([\d.]+) black_duration:([\d.]+)/g)]
    .map((m) => ({ start: +m[1], end: +m[2], dur: +m[3] }));
  const flashSeg = segs.find((s) => s.dur >= 0.03 && s.dur <= 1.2) ?? segs[0];
  if (!flashSeg) throw new Error("no flash segment found for " + outName);
  const trimStart = flashSeg.end;
  const trimDur = part.showSecs - 0.5 + 1.0;
  const args = ["-y", "-ss", String(trimStart), "-i", part.webm, "-t", String(trimDur)];
  const filters = [];
  cueKeys.forEach((cueKey, i) => {
    const a = A[audioKeyFor(cueKey)];
    const atMs = Math.round(part.cues[cueKey] * 1000);
    args.push("-i", path.join(EVIDENCE, a.f));
    filters.push(`[${i + 1}:a]volume=${a.gain}dB,adelay=${atMs}|${atMs}[a${i}]`);
  });
  filters.push(cueKeys.map((_, i) => `[a${i}]`).join("") + `amix=inputs=${cueKeys.length}:duration=longest:normalize=0[amix]`);
  // Pad the mix to the video's length: amix stops at the last cue,
  // and a short audio stream desyncs the concat (found in verify:
  // final audio 130.3 s vs video 136.5 s). apad locks them together.
  filters.push(`[amix]apad=whole_dur=${trimDur.toFixed(2)}[aout]`);
  args.push(
    "-filter_complex", filters.join(";"),
    "-map", "0:v", "-map", "[aout]",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-ar", "44100",
    "-movflags", "+faststart",
    path.join(EVIDENCE, outName),
  );
  execFileSync("ffmpeg", args, { stdio: "inherit" });
  log("muxed", outName, "trimStart", trimStart);
  return path.join(EVIDENCE, outName);
}

const p1mp4 = muxPart2(part1, part1Keys, "loop-part1.mp4");
const p2mp4 = muxPart2(part2, part2Keys, "loop-part2.mp4");

/* 0.8 s black gap, same shape as the parts, then concat. */
const gapMp4 = path.join(EVIDENCE, "loop-gap.mp4");
execFileSync("ffmpeg", [
  "-y", "-f", "lavfi", "-i", "color=c=black:s=480x1420:r=25:d=0.8",
  "-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo",
  "-t", "0.8", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k",
  gapMp4,
], { stdio: "inherit" });
const listPath = path.join(EVIDENCE, "loop-concat.txt");
fs.writeFileSync(listPath, [p1mp4, gapMp4, p2mp4].map((p) => `file '${p}'`).join("\n"));
/* Concat FILTER (not the demuxer): the demuxer pass dropped the
 * parts' audio tails and shifted timestamps; the filter with apad'd
 * part audio keeps both streams coextensive (verified 136.49/136.48). */
const p1Dur = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p1mp4]).toString().trim());
const p2Dur = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p2mp4]).toString().trim());
execFileSync("ffmpeg", [
  "-y", "-i", p1mp4, "-i", gapMp4, "-i", p2mp4,
  "-filter_complex",
  `[0:a]apad=whole_dur=${p1Dur.toFixed(2)}[a0];[1:a]apad=whole_dur=0.8[a1];[2:a]apad=whole_dur=${p2Dur.toFixed(2)}[a2];[0:v][a0][1:v][a1][2:v][a2]concat=n=3:v=1:a=1[v][a]`,
  "-map", "[v]", "-map", "[a]",
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-ar", "44100",
  "-movflags", "+faststart",
  path.join(EVIDENCE, "loop-realpage.mp4"),
], { stdio: "inherit" });

log("DONE", JSON.stringify({ buildId: buildMeta.buildId, part1Secs: part1.showSecs, part2Secs: part2.showSecs }));
