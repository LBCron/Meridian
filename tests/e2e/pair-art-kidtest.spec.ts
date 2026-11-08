import { test, expect, type Page } from "playwright/test";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { serveBuiltArtifact } from "./helpers";

/**
 * Pair-art kid test — the GO / NO-GO gate for flipping the painted
 * Holmes & Watson re-skin live in PR D (owner-approved 2026-11-07;
 * gates of record: STUDY-format-rebuild.md, "Gates" section).
 *
 * This spec does two different jobs, and keeps them separate:
 *
 * 1. AUTOMATED MEASURES (this file, real numbers): the pair-art pose
 *    plates are composited over the REAL GeoDetective page — the real
 *    map, the real page background, a real clue layout — at the
 *    maximum in-band figure size for each width, and the spec measures
 *    the rendered figure height (must sit inside the width's band),
 *    the rendered face height (must clear the width's face floor, when
 *    the plate manifest carries a face box), and clue-text coverage
 *    (bounding-box overlap of the figure against every leaf text
 *    element inside the clue articles — must be exactly 0 px²).
 *
 * 2. ASSEMBLY + PALM MEASUREMENT (panel round 1, Game developer
 *    F4 — BLOCK cure): §7 requires palm error ≤3 px "by automated
 *    measurement" and §3.5/§10 make the palm a gate, so this spec
 *    ships the measurer. It composes each character's painted parts
 *    on a canvas per the pair-art manifest contract (placements in
 *    `rectPx`, pivots, `pxPerViewBoxUnit`), rotating the front arm
 *    about its pivot to the high-five pose (see
 *    `measureAssemblies`), measures the skin-cluster centroid of
 *    the raised hand against HIGH_FIVE_CONTACT (99,25) / (15,21),
 *    and diffs the assembly against the delivered high-five pose
 *    plate. The error is reported in viewBox units, in natural
 *    image pixels, and in rendered rig pixels — three named unit
 *    bases, never a bare "px" (the pre-cure lock's 0.35 was a
 *    viewBox-unit distance mislabelled as px). If the parts or the
 *    manifest contract are not there to measure, the test FAILs
 *    with an explicit FAIL/NOT RUN reason — it never skips
 *    silently and never passes on an assertion it did not compute.
 *
 * 3. HUMAN TRIAL PREPARATION (no fake results): find / identity /
 *    expression trials need real kid panellists (see
 *    scripts/kidtest-protocol.md). This spec must NOT fake them. It
 *    prepares the trial screens — one figure per find screen at a
 *    randomised lawful gutter spot, the tracker / Jolly distractors
 *    for identity, and expression trials that render each required
 *    feeling's face ON the figure at the cell's in-band figure size
 *    (never a big isolated face plate) for BOTH characters — and
 *    exports the trial manifest to
 *    test-results/pair-art-kidtest/trial-manifest.json.
 *    Human scores are recorded by hand in docs/pair-art/KIDTEST_RESULTS.md.
 *
 * Plates live in public/assets/detective/pair-art/ (built into
 * dist/client/assets/detective/pair-art/). The art lands in parallel
 * with this harness: if a plate is absent, the affected measure SKIPs
 * with a named reason for that exact plate — a missing plate is never
 * a spurious failure, and never a fabricated pass.
 *
 * Per-cell gate (width × background; backgrounds = the game's real
 * map + page backgrounds, incl. the static degradation block):
 *   Find-Holmes ≥27/30 in ≤2 s in EVERY cell (≤25/30 in any cell = kill)
 *   Identity    ≥27/30 (≤3/30 confusion with the tracker or Jolly)
 *   Expression  ≥26/30
 *   Zero clue-text coverage at maximum in-band size
 * The human thresholds are enforced from KIDTEST_RESULTS.md at PR D;
 * the automated measures below enforce size / face / coverage here.
 */

test.setTimeout(300_000);

/* ------------------------------------------------------------------ */
/* The gate, as data                                                    */
/* ------------------------------------------------------------------ */

const WIDTHS = [390, 768, 1280, 1920] as const;
type Width = (typeof WIDTHS)[number];

/** Figure-height band + face floor per width (study, Gates section). */
const BANDS: Record<Width, { min: number; max: number; faceFloor: number; height: number }> = {
  390: { min: 112, max: 128, faceFloor: 38, height: 844 },
  768: { min: 128, max: 144, faceFloor: 44, height: 1024 },
  1280: { min: 144, max: 160, faceFloor: 48, height: 900 },
  1920: { min: 160, max: 176, faceFloor: 52, height: 1080 },
};

/** Trial backgrounds: the real map, the real page, and the static
 * degradation block (the low-memory dock-only static composite). */
const BACKGROUNDS = ["map", "page", "static-degradation"] as const;
type Background = (typeof BACKGROUNDS)[number];

const GATE = {
  findMin: 27,
  findKillAtOrBelow: 25,
  findTimeLimitMs: 2_000,
  identityMin: 27,
  identityMaxConfusion: 3,
  expressionMin: 26,
  panellistsPerCell: 30,
  /** Expression leg (panel round 1, UX researcher B1 cure): the
   * feelings every cell family must cover, per character. The bar
   * applies per (cell × character × emotion) slice, n=30 each. */
  expressionEmotions: ["delighted", "surprised", "pout"],
  expressionCharacters: ["holmes", "watson"],
  /** Sample allocation (UX researcher B2 cure): independent
   * observations per cell — a child serves in exactly ONE cell, so
   * every observation is a first exposure and the find measure is
   * naïve by construction. See scripts/kidtest-protocol.md §1/§7. */
  allocation: "independent-per-cell",
  cells: 12,
  totalPanellists: 360,
  panellistsPerAgeBandPerCell: 10,
  ageBands: ["6-8", "9-10", "11-12"],
  /** Age-band floor (UX researcher B3 cure): the cell bar's
   * proportion applied per band — ≥9/10 in EVERY band, or the cell
   * FAILs regardless of the pooled count. Written before any run;
   * §10 forbids amending bars after the test runs. */
  perBandFloorOutOf10: 9,
  /** Palm gate (§7): ≤3 px at rendered rig scale. The rig scale is
   * DETECTIVE_RIG_HEIGHT_PX (104 px rendered height) — the unit
   * basis every palm number in the assembly report names. */
  palmMaxErrorRigPx: 3,
  rigHeightPx: 104,
  /** Assembly-vs-plate sanity gate: fraction of union pixels whose
   * max channel difference exceeds 16/255. Parts are crops of the
   * plate painting, so edges/halo legitimately differ; above 0.60
   * the assembly plainly is not the plate's figure. */
  assemblyMaxDiffFraction: 0.6,
} as const;

/* ------------------------------------------------------------------ */
/* Plate discovery (source dir is the contract; the page serves dist)   */
/* ------------------------------------------------------------------ */

const PLATE_DIR = path.resolve("public/assets/detective/pair-art");
const PLATE_URL_BASE = "assets/detective/pair-art";
const MANIFEST_OUT = path.resolve("test-results/pair-art-kidtest/trial-manifest.json");

interface FaceBox {
  /** Fractions of the plate's own width/height, each in [0, 1]. */
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Plate {
  /** Stable id, e.g. "holmes-standing", "holmes-face-happy". */
  id: string;
  file: string;
  url: string;
  faceBox?: FaceBox;
}

/** The plates the gate needs. Anything else in the dir is ignored.
 * The art builder's delivered scheme is pose plates
 * (`holmes-pose-*`, `watson-pose-*`); a dedicated `*-standing` plate,
 * if one ever lands, wins over the pose fallback. The figure each
 * measure actually used is recorded in the trial manifest. */
const FIGURE_PLATES = ["holmes-standing", "watson-standing"] as const;
const FIGURE_FALLBACKS: Record<string, string[]> = {
  "holmes-standing": ["holmes-pose-dock", "holmes-pose-berth-think"],
  "watson-standing": ["watson-pose-station-idle", "watson-pose-read"],
};
const DISTRACTOR_PLATES = ["tracker-standing", "jolly-standing"] as const;
const EXPRESSION_PREFIX = "holmes-face-";
/** Expression trials cover BOTH characters (panel round 1, Game
 * designer nit 3): Watson reads every clue aloud, so his faces are
 * gated by the same ≥26/30 bar as Holmes's. */
const EXPRESSION_PREFIXES = ["holmes-face-", "watson-face-"] as const;

function discoverPlates(): { plates: Plate[]; missing: { id: string; reason: string }[] } {
  const missing: { id: string; reason: string }[] = [];
  if (!existsSync(PLATE_DIR)) {
    for (const id of [...FIGURE_PLATES, ...DISTRACTOR_PLATES]) {
      missing.push({ id, reason: `plate directory ${PLATE_DIR} does not exist yet` });
    }
    missing.push({
      id: `${EXPRESSION_PREFIX}*`,
      reason: `plate directory ${PLATE_DIR} does not exist yet`,
    });
    return { plates: [], missing };
  }
  /* Sorted (Senior developer nit): readdir order is filesystem-
   * dependent; an unsorted list made seed 20261107's picks differ
   * across machines. Sorting makes the seeded manifest reproducible. */
  const files = readdirSync(PLATE_DIR)
    .filter((f) => /\.(png|webp|jpe?g)$/i.test(f))
    .sort();
  let faceBoxes: Record<string, FaceBox> = {};
  const manifestPath = path.join(PLATE_DIR, "manifest.json");
  if (existsSync(manifestPath)) {
    try {
      const parsed = JSON.parse(readFileSync(manifestPath, "utf8")) as {
        plates?: Record<string, { faceBox?: FaceBox }>;
      };
      for (const [file, entry] of Object.entries(parsed.plates ?? {})) {
        if (entry.faceBox) faceBoxes[file] = entry.faceBox;
      }
    } catch {
      /* A malformed manifest is reported by the face measure as
       * "no face box" — never silently treated as a pass. */
      faceBoxes = {};
    }
  }
  const byId = new Map<string, Plate>();
  for (const file of files) {
    const id = file.replace(/\.(png|webp|jpe?g)$/i, "");
    byId.set(id, {
      id,
      file,
      url: `${PLATE_URL_BASE}/${file}`,
      faceBox: faceBoxes[file],
    });
  }
  const plates: Plate[] = [];
  for (const id of [...FIGURE_PLATES, ...DISTRACTOR_PLATES]) {
    const plate =
      byId.get(id) ?? (FIGURE_FALLBACKS[id] ?? []).map((f) => byId.get(f)).find(Boolean);
    if (plate) plates.push(plate);
    else missing.push({ id, reason: `no ${id}.(png|webp|jpg) in ${PLATE_DIR}` });
  }
  const faces = [...byId.values()].filter((p) =>
    EXPRESSION_PREFIXES.some((prefix) => p.id.startsWith(prefix)),
  );
  plates.push(...faces);
  for (const prefix of EXPRESSION_PREFIXES) {
    if (!faces.some((p) => p.id.startsWith(prefix))) {
      missing.push({
        id: `${prefix}*`,
        reason: `no ${prefix}<feeling>.(png|webp|jpg) face plates in ${PLATE_DIR}`,
      });
    }
  }
  return { plates, missing };
}

const { plates, missing: MISSING_PLATES } = discoverPlates();
const plateById = (id: string) => plates.find((p) => p.id === id);
/** Resolve a canonical figure ("holmes-standing") to the plate the
 * art actually delivered (a `*-standing` plate, else its pose fallback). */
const figureFor = (canonical: string): Plate | undefined =>
  plateById(canonical) ??
  (FIGURE_FALLBACKS[canonical] ?? []).map((f) => plateById(f)).find(Boolean);
const missingReason = (id: string) =>
  MISSING_PLATES.find((m) => m.id === id)?.reason ?? `plate ${id} not discovered`;

/* ------------------------------------------------------------------ */
/* Seeded RNG — trial layouts are random per panellist but reproducible */
/* ------------------------------------------------------------------ */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const TRIAL_SEED = 20_261_107;

/** Fisher–Yates shuffle driven by the seeded RNG (Senior developer
 * nit: the identity choices previously used `sort(() => rng() - 0.5)`,
 * which is a biased shuffle whose result also depends on the
 * engine's sort implementation — neither reproducible nor uniform). */
function fisherYates<T>(arr: readonly T[], rng: () => number): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Page helpers                                                         */
/* ------------------------------------------------------------------ */

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
const overlapArea = (a: Rect, b: Rect) =>
  Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) *
  Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));

/** Open a real GeoDetective case: real map, real page, real clues. */
async function openRealCase(page: Page, index = 0) {
  await page.goto(`http://127.0.0.1:4123/Meridian/?loop-puzzle=${index}`);
  await page.getByRole("button", { name: "GeoDetective: Solve a mystery" }).click();
  await expect(page.getByRole("article", { name: /Clue 1:/ })).toBeVisible({
    timeout: 30_000,
  });
}

/** Leaf text rects inside the clue articles + the map rect, in-page. */
async function layoutRects(page: Page): Promise<{ clueText: Rect[]; map: Rect | null }> {
  return page.evaluate(() => {
    const toRect = (r: DOMRect): Rect => ({ x: r.x, y: r.y, w: r.width, h: r.height });
    const clueText: Rect[] = [];
    document
      .querySelectorAll('article[aria-label^="Clue"], [role="article"]')
      .forEach((article) => {
        article.querySelectorAll("*").forEach((el) => {
          if (el.children.length === 0 && (el.textContent ?? "").trim().length > 0) {
            const r = el.getBoundingClientRect();
            if (r.width > 0 && r.height > 0) clueText.push(toRect(r));
          }
        });
      });
    const mapEl = document.querySelector('[data-testid="loop-map"]');
    return { clueText, map: mapEl ? toRect(mapEl.getBoundingClientRect()) : null };
  });
}

interface Spot {
  id: string;
  x: number;
  y: number;
}

/**
 * Lawful gutter spots for a figure of `figW × figH`: page space beside
 * or above/below the map — never on the map itself (staging law:
 * figures live in page space). A spot is only a CANDIDATE here; the
 * coverage measure below is what proves it lawful at max in-band size.
 */
function lawfulSpots(figW: number, figH: number, map: Rect | null, vw: number, vh: number): Spot[] {
  const spots: Spot[] = [];
  const fits = (x: number, y: number) => x >= 0 && y >= 0 && x + figW <= vw && y + figH <= vh;
  if (map) {
    if (map.x - 16 >= figW) {
      spots.push({ id: "gutter-left-top", x: 8, y: Math.max(8, map.y) });
      spots.push({ id: "gutter-left-bottom", x: 8, y: map.y + map.h - figH });
    }
    if (vw - (map.x + map.w) - 16 >= figW) {
      spots.push({ id: "gutter-right-top", x: vw - 8 - figW, y: Math.max(8, map.y) });
      spots.push({ id: "gutter-right-bottom", x: vw - 8 - figW, y: map.y + map.h - figH });
    }
    if (map.y - 16 >= figH) spots.push({ id: "page-above-map", x: 8, y: map.y - 8 - figH });
    if (vh - (map.y + map.h) - 16 >= figH)
      spots.push({ id: "page-below-map", x: 8, y: map.y + map.h + 8 });
  }
  if (spots.length === 0 && fits(8, 8)) spots.push({ id: "page-top-left", x: 8, y: 8 });
  return spots.filter((s) => fits(s.x, s.y));
}

/** Composite one plate onto the live page at a spot; return its rect. */
async function placePlate(
  page: Page,
  plate: Plate,
  spot: Spot,
  heightPx: number,
): Promise<Rect> {
  return page.evaluate(
    ({ url, spotId, x, y, h }) => {
      document.getElementById("kidtest-plate")?.remove();
      const img = document.createElement("img");
      img.id = "kidtest-plate";
      img.dataset.spot = spotId;
      img.src = url;
      img.alt = "";
      Object.assign(img.style, {
        position: "fixed",
        left: `${x}px`,
        top: `${y}px`,
        height: `${h}px`,
        width: "auto",
        zIndex: "9999",
        pointerEvents: "none",
      });
      document.body.appendChild(img);
      return new Promise<Rect>((resolve, reject) => {
        const done = () => {
          const r = img.getBoundingClientRect();
          resolve({ x: r.x, y: r.y, w: r.width, h: r.height });
        };
        if (img.complete && img.naturalHeight > 0) done();
        else {
          img.onload = done;
          img.onerror = () => reject(new Error(`plate failed to load: ${url}`));
        }
      });
    },
    { url: plate.url, spotId: spot.id, x: spot.x, y: spot.y, h: heightPx },
  );
}

/* ------------------------------------------------------------------ */
/* 1. Automated measures — per width, over the real game page           */
/* ------------------------------------------------------------------ */

for (const width of WIDTHS) {
  const band = BANDS[width];
  test(`automated measures @${width} — size band, face floor, zero clue-text coverage`, async ({
    browser,
  }) => {
    const figures = FIGURE_PLATES.map((id) => figureFor(id)).filter(
      (p): p is Plate => p !== undefined,
    );
    test.skip(
      figures.length === 0,
      `NOT RUN: no figure plates yet — ${FIGURE_PLATES.map(missingReason).join("; ")}`,
    );

    const context = await browser.newContext({
      viewport: { width, height: band.height },
    });
    await serveBuiltArtifact(context);
    const page = await context.newPage();
    try {
      await openRealCase(page);
      const { clueText, map } = await layoutRects(page);
      expect(clueText.length, "real clue layout must expose clue text rects").toBeGreaterThan(0);

      for (const plate of figures) {
        /* Render at MAXIMUM in-band size — the coverage gate is
         * specified at the largest figure the band allows. */
        const probe = await placePlate(page, plate, { id: "probe", x: 8, y: 8 }, band.max);
        const figW = Math.round(probe.w);

        /* Measure 1 — figure height inside the band.
         * Honest scope note (Game developer nit 1): placePlate SETS
         * the height to band.max, so asserting the rendered height
         * is in-band on its own is near-tautological — it proves the
         * CSS was honoured, nothing about the plate. What CAN catch
         * a wrong plate is the plate's own geometry, asserted below:
         * (a) the rendered aspect ratio must equal the plate's
         * NATURAL aspect ratio (a distorted or wrong-crop plate
         * fails), and (b) the natural height must be at least the
         * band max, so the plate holds up at the largest in-band
         * render without being upscaled (§8.3 source-resolution
         * rule). The in-band assertions stay, labelled as the
         * CSS-honour check they are. */
        expect(
          probe.h,
          `${plate.id} rendered height ${probe.h}px must be in [${band.min}, ${band.max}] @${width}`,
        ).toBeGreaterThanOrEqual(band.min);
        expect(probe.h).toBeLessThanOrEqual(band.max + 1); // +1: sub-pixel rounding
        const natural = await page.evaluate(async (url: string) => {
          const img = new Image();
          img.src = url;
          await img.decode();
          return { w: img.naturalWidth, h: img.naturalHeight };
        }, plate.url);
        const naturalAspect = natural.w / natural.h;
        const renderedAspect = probe.w / probe.h;
        expect(
          Math.abs(renderedAspect - naturalAspect) / naturalAspect,
          `${plate.id} @${width}: rendered aspect ${renderedAspect.toFixed(3)} must match natural aspect ${naturalAspect.toFixed(3)} (${natural.w}×${natural.h}) within 2%`,
        ).toBeLessThanOrEqual(0.02);
        expect(
          natural.h,
          `${plate.id} natural height ${natural.h}px must be ≥ band max ${band.max}px @${width} (no upscaling at in-band sizes)`,
        ).toBeGreaterThanOrEqual(band.max);

        /* Measure 2 — face height clears the floor. Needs the plate
         * manifest's face box; without one this measure is NOT RUN
         * for that plate — recorded, never assumed. */
        if (plate.faceBox) {
          const facePx = Math.round(plate.faceBox.h * probe.h);
          expect(
            facePx,
            `${plate.id} face ${facePx}px must clear the ${band.faceFloor}px floor @${width}`,
          ).toBeGreaterThanOrEqual(band.faceFloor);
        } else {
          test.info().annotations.push({
            type: "not-run",
            description: `face floor NOT RUN for ${plate.id} @${width}: no faceBox for ${plate.file} in pair-art manifest.json`,
          });
        }

        /* Measure 3 — zero clue-text coverage at max in-band size,
         * at every lawful gutter spot this width offers. */
        const spots = lawfulSpots(figW, band.max, map, width, band.height);
        expect(
          spots.length,
          `${plate.id} @${width}: at least one lawful gutter spot must exist`,
        ).toBeGreaterThan(0);
        for (const spot of spots) {
          const rect = await placePlate(page, plate, spot, band.max);
          const covered = clueText.reduce((sum, t) => sum + overlapArea(rect, t), 0);
          expect(
            covered,
            `${plate.id} @${width} spot ${spot.id}: clue-text coverage must be 0 px², measured ${covered} px²`,
          ).toBe(0);
        }
      }
    } finally {
      await context.close();
    }
  });
}

/* ------------------------------------------------------------------ */
/* 2. Assembly + palm measurement — the doll PR B will move, measured   */
/* ------------------------------------------------------------------ */

/** HIGH_FIVE_CONTACT (§3.5), in viewBox units. */
const HIGH_FIVE_CONTACT: Record<string, { x: number; y: number }> = {
  holmes: { x: 99, y: 25 },
  watson: { x: 15, y: 21 },
};
/** Each front arm's palm in the BASE pose (§3.3/§3.4: Holmes hand
 * circle at (87,83); Watson hand at (26,89)). The high-five pose in
 * HOLMES_POSE_SPECS / WATSON_POSE_SPECS carries frontArm 0 because
 * the flat rig draws that arm explicitly; for painted parts the
 * equivalent assembly is the pivot rotation that carries the base
 * palm onto the contact anchor — computed from these anchors, never
 * hard-coded as an angle. */
const BASE_PALM_VB: Record<string, { x: number; y: number }> = {
  holmes: { x: 87, y: 83 },
  watson: { x: 26, y: 89 },
};

interface ContractPart {
  part: string;
  file: string;
  rectPx: { x: number; y: number; width: number; height: number };
}
interface CharacterContract {
  viewBox: [number, number];
  naturalSizePx: [number, number];
  figureOfRecord?: string;
  pivots: Record<string, { viewBox: [number, number]; px: [number, number] }>;
  palmAnchor: { viewBox: [number, number]; px: [number, number] };
  parts: ContractPart[];
  faces: Record<
    string,
    { file: string; faceBox: { x: number; y: number; width: number; height: number } }
  >;
}
interface PairArtContract {
  pxPerViewBoxUnit: number;
  characters: Record<string, CharacterContract>;
}

const PAIR_MANIFEST_PATH = path.join(PLATE_DIR, "manifest.json");
function loadPairArtContract(): { contract: PairArtContract | null; reason: string } {
  if (!existsSync(PAIR_MANIFEST_PATH)) {
    return { contract: null, reason: `no pair-art manifest.json at ${PAIR_MANIFEST_PATH}` };
  }
  try {
    const parsed = JSON.parse(readFileSync(PAIR_MANIFEST_PATH, "utf8")) as PairArtContract;
    for (const id of ["holmes", "watson"]) {
      const c = parsed.characters?.[id];
      if (!c) return { contract: null, reason: `manifest contract has no characters.${id}` };
      if (!Array.isArray(c.parts) || c.parts.length === 0)
        return { contract: null, reason: `manifest contract characters.${id}.parts is empty` };
      if (!c.pivots?.frontArm)
        return { contract: null, reason: `manifest contract characters.${id}.pivots.frontArm missing` };
      for (const p of c.parts) {
        if (!existsSync(path.join(PLATE_DIR, p.file)))
          return { contract: null, reason: `manifest part file missing on disk: ${p.file}` };
      }
    }
    return { contract: parsed, reason: "" };
  } catch (e) {
    return { contract: null, reason: `pair-art manifest.json unreadable: ${String(e)}` };
  }
}

/** Filled by the assembly test, embedded in the trial manifest. */
let ASSEMBLY_REPORT: unknown = null;

interface AssemblyCharInput {
  id: string;
  natural: [number, number];
  viewBox: [number, number];
  pxPerUnit: number;
  parts: { part: string; url: string; rect: ContractPart["rectPx"]; raised: boolean }[];
  pivotPx: [number, number];
  rotationDeg: number;
  contactNatural: [number, number];
  face: { url: string; box: { x: number; y: number; width: number; height: number } } | null;
  plateUrl: string | null;
  plateFile: string | null;
}

/**
 * Compose + measure ONE character in the page (canvas decode is the
 * shipped PNG path — no second decoder to drift from the browser's).
 * Self-contained for page.evaluate: every input arrives in `input`.
 */
async function measureOneAssembly(input: AssemblyCharInput) {
  const load = (url: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`image failed to load: ${url}`));
      img.src = url;
    });
  const isSkin = (r: number, g: number, b: number, a: number) =>
    a > 128 && r > 180 && g >= 120 && g < 225 && b >= 70 && b < 190 && r > g && g > b && r - b > 40;
  const rank = (part: string) =>
    part === "hat"
      ? 5
      : part === "head"
        ? 4
        : part.includes("arm-front") || part.includes("raised") || part.includes("high-five")
          ? 3
          : part === "torso"
            ? 2
            : part === "arm-back"
              ? 1
              : 0;
  const [W, H] = input.natural;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  const ordered = input.parts
    .map((p, i) => ({ ...p, i, r: rank(p.part) }))
    .sort((a, b) => a.r - b.r || a.i - b.i);
  let faceDrawn = false;
  const drawFace = async () => {
    if (!input.face || faceDrawn) return;
    const fimg = await load(input.face.url);
    ctx.drawImage(fimg, input.face.box.x, input.face.box.y, input.face.box.width, input.face.box.height);
    faceDrawn = true;
  };
  for (const p of ordered) {
    if (p.r >= 5) await drawFace(); // face sits on the head, under the hat
    const img = await load(p.url);
    if (p.raised || (input.rotationDeg !== 0 && rank(p.part) === 3)) {
      if (p.raised) {
        /* A dedicated raised-arm part is drawn explicitly at its
         * manifest placement — the painted equivalent of the rig's
         * explicitly drawn high-five arm. */
        ctx.drawImage(img, p.rect.x, p.rect.y, p.rect.width, p.rect.height);
      } else {
        ctx.save();
        ctx.translate(input.pivotPx[0], input.pivotPx[1]);
        ctx.rotate((input.rotationDeg * Math.PI) / 180);
        ctx.drawImage(img, p.rect.x - input.pivotPx[0], p.rect.y - input.pivotPx[1], p.rect.width, p.rect.height);
        ctx.restore();
      }
    } else {
      ctx.drawImage(img, p.rect.x, p.rect.y, p.rect.width, p.rect.height);
    }
  }
  await drawFace();

  /* Palm: connected skin clusters; the raised hand is the cluster
   * of ≥40 natural px whose centroid lies within 30 viewBox units
   * of the contact anchor. The head's skin cluster is excluded by
   * that window — its centroid sits far from the anchor. */
  const data = ctx.getImageData(0, 0, W, H).data;
  const skinAt = (x: number, y: number) => {
    const i = (y * W + x) * 4;
    return isSkin(data[i]!, data[i + 1]!, data[i + 2]!, data[i + 3]!);
  };
  const visited = new Uint8Array(W * H);
  const windowNatural = 30 * input.pxPerUnit;
  let palm: { centroidNatural: [number, number]; clusterPx: number } | null = null;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (visited[y * W + x] || !skinAt(x, y)) continue;
      const queue: [number, number][] = [[x, y]];
      visited[y * W + x] = 1;
      let n = 0;
      let sx = 0;
      let sy = 0;
      while (queue.length > 0) {
        const [cx, cy] = queue.pop()!;
        n++;
        sx += cx;
        sy += cy;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H || visited[ny * W + nx]) continue;
          visited[ny * W + nx] = 1;
          if (skinAt(nx, ny)) queue.push([nx, ny]);
        }
      }
      if (n >= 40) {
        const cx = sx / n;
        const cy = sy / n;
        const dist = Math.hypot(cx - input.contactNatural[0], cy - input.contactNatural[1]);
        if (dist <= windowNatural && (!palm || dist < Math.hypot(palm.centroidNatural[0] - input.contactNatural[0], palm.centroidNatural[1] - input.contactNatural[1]))) {
          palm = { centroidNatural: [cx, cy], clusterPx: n };
        }
      }
    }
  }

  /* Assembly-vs-plate pixel diff (the plate this assembly claims
   * to be). Summary only here; the gate lives in the test body. */
  let diff: { plate: string; differingFraction: number; meanAbsDiff: number; unionPx: number } | null = null;
  if (input.plateUrl) {
    const plate = await load(input.plateUrl);
    const pc = document.createElement("canvas");
    pc.width = W;
    pc.height = H;
    const pctx = pc.getContext("2d", { willReadFrequently: true })!;
    pctx.drawImage(plate, 0, 0, W, H);
    const pd = pctx.getImageData(0, 0, W, H).data;
    let union = 0;
    let differing = 0;
    let absSum = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3]! > 16 || pd[i + 3]! > 16) union++;
      const m = Math.max(
        Math.abs(data[i]! - pd[i]!),
        Math.abs(data[i + 1]! - pd[i + 1]!),
        Math.abs(data[i + 2]! - pd[i + 2]!),
        Math.abs(data[i + 3]! - pd[i + 3]!),
      );
      if (m > 16) differing++;
      absSum += (Math.abs(data[i]! - pd[i]!) + Math.abs(data[i + 1]! - pd[i + 1]!) + Math.abs(data[i + 2]! - pd[i + 2]!) + Math.abs(data[i + 3]! - pd[i + 3]!)) / 4;
    }
    diff = {
      plate: input.plateFile ?? input.plateUrl,
      differingFraction: union > 0 ? differing / union : 1,
      meanAbsDiff: absSum / (W * H),
      unionPx: union,
    };
  }
  return { palm, diff };
}

test("assembly + palm measurement — parts compose at the high-five pose; palm error ≤3 rig px", async ({
  browser,
}) => {
  const { contract, reason } = loadPairArtContract();
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await serveBuiltArtifact(context);
  const page = await context.newPage();
  try {
    await page.goto("http://127.0.0.1:4123/Meridian/");
    if (!contract) {
      /* Record the explicit failure where the trial manifest will
       * carry it — "assembly": null would read as "not attempted".
       * Written to disk as well as memory: the prep test reads the
       * file, so the handoff does not depend on module state
       * surviving between tests in the runner. */
      ASSEMBLY_REPORT = {
        status: "FAIL/NOT RUN",
        recordedAt: new Date().toISOString(),
        reason,
        note: "No palm number exists until the manifest contract and its part files are present; see the assembly test failure in this run.",
      };
      mkdirSync(path.dirname(MANIFEST_OUT), { recursive: true });
      writeFileSync(
        path.resolve("test-results/pair-art-kidtest/assembly-report.json"),
        JSON.stringify(ASSEMBLY_REPORT, null, 2),
      );
    }
    expect(
      contract,
      `FAIL/NOT RUN — assembly + palm measurement could not run: ${reason}. ` +
        "This is an explicit failure, never a silent skip: §7 requires the palm " +
        "measured by shipped code against the manifest contract.",
    ).not.toBeNull();
    const c = contract!;
    const report: Record<string, unknown> = {
      generatedBy: "tests/e2e/pair-art-kidtest.spec.ts (assembly + palm measurement)",
      recordedAt: new Date().toISOString(),
      unitBasis:
        "errorViewBoxUnits = centroid-to-anchor distance in viewBox units; " +
        "errorNaturalPx = errorViewBoxUnits × manifest pxPerViewBoxUnit (natural image pixels); " +
        `errorRigPx = errorViewBoxUnits × (rigHeightPx ${GATE.rigHeightPx} / viewBox height) — rendered pixels at the shipped rig height, the §7 gate basis. ` +
        "The pre-cure lock's '0.35 px' was a viewBox-unit distance (√(0.25²+0.25²)) mislabelled as px.",
      gateRigPx: GATE.palmMaxErrorRigPx,
      characters: {} as Record<string, unknown>,
    };
    const chars: Record<string, unknown> = {};
    for (const id of ["holmes", "watson"] as const) {
      const ch = c.characters[id]!;
      const contact = HIGH_FIVE_CONTACT[id]!;
      const base = BASE_PALM_VB[id]!;
      const pivotVb = ch.pivots.frontArm!.viewBox;
      const v1 = { x: base.x - pivotVb[0], y: base.y - pivotVb[1] };
      const v2 = { x: contact.x - pivotVb[0], y: contact.y - pivotVb[1] };
      const rotationDeg =
        (Math.atan2(v1.x * v2.y - v1.y * v2.x, v1.x * v2.x + v1.y * v2.y) * 180) / Math.PI;
      const raisedPart = ch.parts.find((p) => /high-five|highfive|raised/.test(p.part));
      const url = (file: string) => `${PLATE_URL_BASE}/${file}`;
      const mkInput = (
        rotation: number,
        faceKind: string,
        plateFile: string | null,
      ): AssemblyCharInput => ({
        id,
        natural: ch.naturalSizePx,
        viewBox: ch.viewBox,
        pxPerUnit: c.pxPerViewBoxUnit,
        parts: ch.parts
          .filter((p) => !(raisedPart && p.part === "arm-front"))
          .map((p) => ({
            part: p.part,
            url: url(p.file),
            rect: p.rectPx,
            raised: p === raisedPart,
          })),
        pivotPx: ch.pivots.frontArm!.px,
        rotationDeg: raisedPart ? 0 : rotation,
        contactNatural: [contact.x * c.pxPerViewBoxUnit, contact.y * c.pxPerViewBoxUnit],
        face: ch.faces[faceKind]
          ? { url: url(ch.faces[faceKind]!.file), box: ch.faces[faceKind]!.faceBox }
          : null,
        plateUrl: plateFile && existsSync(path.join(PLATE_DIR, plateFile)) ? url(plateFile) : null,
        plateFile,
      });
      const hfPlate = `${id}-pose-high-five.png`;
      const hf = await page.evaluate(
        measureOneAssembly,
        mkInput(rotationDeg, "delighted", hfPlate),
      );
      const basePlate = ch.figureOfRecord ?? null;
      const baseAsm = await page.evaluate(measureOneAssembly, mkInput(0, "neutral", basePlate));
      const rigScale = GATE.rigHeightPx / ch.viewBox[1];
      const palm = hf.palm
        ? {
            status: "measured",
            clusterPx: hf.palm.clusterPx,
            centroidViewBox: [
              hf.palm.centroidNatural[0] / c.pxPerViewBoxUnit,
              hf.palm.centroidNatural[1] / c.pxPerViewBoxUnit,
            ],
            contactViewBox: [contact.x, contact.y],
            errorViewBoxUnits:
              Math.hypot(
                hf.palm.centroidNatural[0] - contact.x * c.pxPerViewBoxUnit,
                hf.palm.centroidNatural[1] - contact.y * c.pxPerViewBoxUnit,
              ) / c.pxPerViewBoxUnit,
            errorNaturalPx: Math.hypot(
              hf.palm.centroidNatural[0] - contact.x * c.pxPerViewBoxUnit,
              hf.palm.centroidNatural[1] - contact.y * c.pxPerViewBoxUnit,
            ),
            errorRigPx:
              (Math.hypot(
                hf.palm.centroidNatural[0] - contact.x * c.pxPerViewBoxUnit,
                hf.palm.centroidNatural[1] - contact.y * c.pxPerViewBoxUnit,
              ) /
                c.pxPerViewBoxUnit) *
              rigScale,
          }
        : {
            status: "FAIL/NOT RUN",
            reason:
              `no skin cluster of ≥40 natural px with centroid within 30 viewBox units of ` +
              `HIGH_FIVE_CONTACT (${contact.x},${contact.y}) in the assembled ${id} parts — ` +
              "the raised hand is missing from the parts or does not reach the anchor",
          };
      chars[id] = {
        rotationDeg: raisedPart ? null : Math.round(rotationDeg * 10) / 10,
        rotationSource: raisedPart
          ? `dedicated raised-arm part ${raisedPart.part} drawn explicitly at its manifest placement`
          : "pivot rotation carrying the base palm (§3.3/§3.4) onto HIGH_FIVE_CONTACT, computed from the manifest pivot",
        palm,
        highFivePlateDiff: hf.diff ?? "NOT RUN — high-five pose plate absent",
        baseAssemblyVsFigureOfRecord: {
          plate: basePlate,
          diff: baseAsm.diff ?? "NOT RUN — figure-of-record plate absent",
        },
      };
      const p = palm as { status: string; errorRigPx?: number };
      expect(
        p.status,
        `${id}: palm measurement ${p.status === "measured" ? "" : `FAIL/NOT RUN — ${(palm as { reason?: string }).reason ?? ""}`}`,
      ).toBe("measured");
      expect(
        p.errorRigPx!,
        `${id}: palm error ${p.errorRigPx?.toFixed(2)} rig px (rendered at ${GATE.rigHeightPx}px rig height) must be ≤${GATE.palmMaxErrorRigPx} rig px (§7)`,
      ).toBeLessThanOrEqual(GATE.palmMaxErrorRigPx);
      if (hf.diff) {
        expect(
          hf.diff.differingFraction,
          `${id}: assembly-vs-plate (${hfPlate}) differing fraction ${hf.diff.differingFraction.toFixed(3)} must be ≤${GATE.assemblyMaxDiffFraction}`,
        ).toBeLessThanOrEqual(GATE.assemblyMaxDiffFraction);
      } else {
        test.info().annotations.push({
          type: "not-run",
          description: `${id}: assembly-vs-plate diff NOT RUN — ${hfPlate} absent`,
        });
      }
    }
    report.characters = chars;
    ASSEMBLY_REPORT = report;
    mkdirSync(path.dirname(MANIFEST_OUT), { recursive: true });
    writeFileSync(
      path.resolve("test-results/pair-art-kidtest/assembly-report.json"),
      JSON.stringify(report, null, 2),
    );
  } finally {
    await context.close();
  }
});

/* ------------------------------------------------------------------ */
/* 3. Human trial preparation — screens + manifest, NO fake results     */
/* ------------------------------------------------------------------ */

interface Trial {
  id: string;
  kind: "find" | "identity" | "expression";
  width: Width;
  background: Background;
  instruction: string;
  timeLimitMs: number | null;
  figurePlate: string | null;
  distractorPlates: string[];
  spotId: string | null;
  /** Where spotId came from: the seeded manifest pick, or the
   * lawful spot the real page actually offered at screenshot time
   * (Senior developer nit: manifest and screenshot must agree —
   * a silent fallback made them disagree). */
  spotSource?: "manifest" | "reconciled-to-lawful-spot-on-real-page";
  choices: string[];
  correctChoice: string | null;
  status: "ready" | "blocked-missing-plate";
  blockedReason?: string;
  /** Expression trials only: whose face, which feeling. The feeling
   * is recorded per trial (B1 cure) — the pre-cure manifest's
   * correctChoice distribution was pout ×6, delighted ×0,
   * surprised ×0, which could never have passed §10 honestly. */
  character?: string;
  emotion?: string;
  facePlate?: string | null;
  /** Expression trials only: the figure height the face is rendered
   * at — the cell's in-band MINIMUM, so the face is read at the
   * cell's floor scale, on the figure, never as a big isolated
   * face plate (B1 cure). */
  figureHeightPx?: number;
  faceFloorPx?: number;
  renderMode?: "face-on-figure-at-in-band-size";
  /** Always null here. Humans fill KIDTEST_RESULTS.md — see protocol. */
  results: null;
}

test("trial preparation — build trial screens and export the trial manifest", async ({
  browser,
}) => {
  const rng = mulberry32(TRIAL_SEED);
  const trials: Trial[] = [];
  const holmes = figureFor("holmes-standing");
  const watson = figureFor("watson-standing");
  const identityChoices = [
    holmes?.id ?? "holmes-standing",
    watson?.id ?? "watson-standing",
    "tracker-standing",
    "jolly-standing",
  ];
  const spotIds = [
    "gutter-left-top",
    "gutter-left-bottom",
    "gutter-right-top",
    "gutter-right-bottom",
    "page-above-map",
    "page-below-map",
  ];
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rng() * arr.length)];

  for (const width of WIDTHS) {
    for (const background of BACKGROUNDS) {
      const cell = `${width}-${background}`;
      trials.push({
        id: `find-${cell}`,
        kind: "find",
        width,
        background,
        instruction: "Where is Holmes?",
        timeLimitMs: GATE.findTimeLimitMs,
        figurePlate: holmes?.id ?? null,
        distractorPlates: [],
        spotId: pick(spotIds),
        spotSource: "manifest",
        choices: [],
        correctChoice: "tap lands on the Holmes figure within 2 s",
        status: holmes ? "ready" : "blocked-missing-plate",
        blockedReason: holmes ? undefined : missingReason("holmes-standing"),
        results: null,
      });
      const identityMissing = identityChoices.filter((id) => !plateById(id));
      trials.push({
        id: `identity-${cell}`,
        kind: "identity",
        width,
        background,
        instruction: "Which one is Holmes?",
        timeLimitMs: null,
        figurePlate: holmes?.id ?? null,
        distractorPlates: identityChoices.filter((id) => id !== holmes?.id),
        spotId: null,
        choices: fisherYates(identityChoices, rng),
        correctChoice: holmes?.id ?? "holmes-standing",
        status: identityMissing.length === 0 ? "ready" : "blocked-missing-plate",
        blockedReason:
          identityMissing.length === 0
            ? undefined
            : identityMissing.map(missingReason).join("; "),
        results: null,
      });
      /* Expression leg (B1 + Game designer nit 3 cure): EVERY cell
       * carries, for EACH character, one trial per required feeling
       * (delighted / surprised / pout). The face is rendered ON the
       * figure at the cell's in-band minimum figure height — the
       * floor scale — never as a big isolated face plate. Emotion
       * order across a child's session is counterbalanced by the
       * protocol's rotation (scripts/kidtest-protocol.md §4). */
      for (const character of GATE.expressionCharacters) {
        const figure = character === "holmes" ? holmes : watson;
        for (const emotion of GATE.expressionEmotions) {
          const facePlateId = `${character}-face-${emotion}`;
          const face = plateById(facePlateId);
          const blocked =
            !figure || !face
              ? [
                  ...(!figure ? [missingReason(`${character}-standing`)] : []),
                  ...(!face ? [`no ${facePlateId}.(png|webp|jpg) in ${PLATE_DIR}`] : []),
                ].join("; ")
              : undefined;
          trials.push({
            id: `expression-${cell}-${character}-${emotion}`,
            kind: "expression",
            width,
            background,
            instruction:
              character === "holmes" ? "How does Holmes feel?" : "How does Watson feel?",
            timeLimitMs: null,
            figurePlate: figure?.id ?? null,
            distractorPlates: [],
            spotId: null,
            choices: fisherYates(["delighted", "surprised", "pout", "neutral"], rng),
            correctChoice: emotion,
            status: blocked ? "blocked-missing-plate" : "ready",
            blockedReason: blocked,
            character,
            emotion,
            facePlate: face?.id ?? null,
            figureHeightPx: BANDS[width].min,
            faceFloorPx: BANDS[width].faceFloor,
            renderMode: "face-on-figure-at-in-band-size",
            results: null,
          });
        }
      }
    }
  }

  /* Prepare (and screenshot) one find-trial screen per width over the
   * real game page, when Holmes exists. Missing plate → annotated
   * NOT RUN, never a failure: the manifest below is the deliverable.
   * The manifest is written AFTER the screenshots so a spot the real
   * page could not lawfully offer is reconciled INTO the manifest
   * (spotId + spotSource) — manifest and screenshot always agree. */
  if (!holmes) {
    test.info().annotations.push({
      type: "not-run",
      description: `find-trial screens NOT RUN: ${missingReason("holmes-standing")}`,
    });
  } else {
    for (const width of WIDTHS) {
      const band = BANDS[width];
      const context = await browser.newContext({
        viewport: { width, height: band.height },
      });
      await serveBuiltArtifact(context);
      const page = await context.newPage();
      try {
        await openRealCase(page);
        const { map } = await layoutRects(page);
        const probe = await placePlate(page, holmes, { id: "probe", x: 8, y: 8 }, band.max);
        const spots = lawfulSpots(Math.round(probe.w), band.max, map, width, band.height);
        const trial = trials.find((t) => t.id === `find-${width}-map`);
        const spot =
          spots.find((s) => s.id === trial?.spotId) ?? spots[0] ?? { id: "page-top-left", x: 8, y: 8 };
        if (trial && trial.spotId !== spot.id) {
          trial.spotId = spot.id;
          trial.spotSource = "reconciled-to-lawful-spot-on-real-page";
        }
        await placePlate(page, holmes, spot, band.max);
        await page.screenshot({
          path: path.resolve(`test-results/pair-art-kidtest/find-${width}.png`),
        });
      } finally {
        await context.close();
      }
    }
  }

  mkdirSync(path.dirname(MANIFEST_OUT), { recursive: true });
  writeFileSync(
    MANIFEST_OUT,
    JSON.stringify(
      {
        generatedBy: "tests/e2e/pair-art-kidtest.spec.ts (trial preparation)",
        seed: TRIAL_SEED,
        gate: GATE,
        bands: BANDS,
        allocation: {
          rule: GATE.allocation,
          totalPanellists: GATE.totalPanellists,
          perCell: GATE.panellistsPerCell,
          perAgeBandPerCell: GATE.panellistsPerAgeBandPerCell,
          ageBands: GATE.ageBands,
          perBandFloorOutOf10: GATE.perBandFloorOutOf10,
          firstExposure:
            "every observation is the child's only cell, hence a first exposure by construction; any prior-exposure accident is flagged in KIDTEST_RESULTS.md and the observation replaced",
        },
        expressionDesign:
          "Per cell: 3 emotions (delighted, surprised, pout) × 2 characters (Holmes, Watson); face rendered on the figure at the cell's in-band minimum figure height (floor scale), never as an isolated face plate; emotion recorded per trial; bar ≥26/30 per (cell × character × emotion) slice.",
        assembly:
          ASSEMBLY_REPORT ??
          (() => {
            const p = path.resolve("test-results/pair-art-kidtest/assembly-report.json");
            return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : null;
          })(),
        missingPlates: MISSING_PLATES,
        trials,
        results: null,
        note: "No human results live here. Panellist scores are recorded by hand in docs/pair-art/KIDTEST_RESULTS.md per scripts/kidtest-protocol.md.",
      },
      null,
      2,
    ),
  );
});
