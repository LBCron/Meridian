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
 * 2. HUMAN TRIAL PREPARATION (no fake results): find / identity /
 *    expression trials need real kid panellists (see
 *    scripts/kidtest-protocol.md). This spec must NOT fake them. It
 *    prepares the trial screens — one figure per find screen at a
 *    randomised lawful gutter spot, the tracker / Jolly distractors
 *    for identity, the face plates for expression — and exports the
 *    trial manifest to test-results/pair-art-kidtest/trial-manifest.json.
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
  const files = readdirSync(PLATE_DIR).filter((f) => /\.(png|webp|jpe?g)$/i.test(f));
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
  const faces = [...byId.values()].filter((p) => p.id.startsWith(EXPRESSION_PREFIX));
  plates.push(...faces);
  if (faces.length === 0) {
    missing.push({
      id: `${EXPRESSION_PREFIX}*`,
      reason: `no ${EXPRESSION_PREFIX}<feeling>.(png|webp|jpg) face plates in ${PLATE_DIR}`,
    });
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

        /* Measure 1 — figure height inside the band. */
        expect(
          probe.h,
          `${plate.id} rendered height ${probe.h}px must be in [${band.min}, ${band.max}] @${width}`,
        ).toBeGreaterThanOrEqual(band.min);
        expect(probe.h).toBeLessThanOrEqual(band.max + 1); // +1: sub-pixel rounding

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
/* 2. Human trial preparation — screens + manifest, NO fake results     */
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
  choices: string[];
  correctChoice: string | null;
  status: "ready" | "blocked-missing-plate";
  blockedReason?: string;
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
  const facePlates = plates.filter((p) => p.id.startsWith(EXPRESSION_PREFIX));
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
        choices: [...identityChoices].sort(() => rng() - 0.5),
        correctChoice: holmes?.id ?? "holmes-standing",
        status: identityMissing.length === 0 ? "ready" : "blocked-missing-plate",
        blockedReason:
          identityMissing.length === 0
            ? undefined
            : identityMissing.map(missingReason).join("; "),
        results: null,
      });
      const face = facePlates.length > 0 ? pick(facePlates) : undefined;
      trials.push({
        id: `expression-${cell}`,
        kind: "expression",
        width,
        background,
        instruction: "How does Holmes feel?",
        timeLimitMs: null,
        figurePlate: face?.id ?? null,
        distractorPlates: [],
        spotId: null,
        choices: facePlates.map((p) => p.id.replace(EXPRESSION_PREFIX, "")),
        correctChoice: face ? face.id.replace(EXPRESSION_PREFIX, "") : null,
        status: face ? "ready" : "blocked-missing-plate",
        blockedReason: face ? undefined : missingReason(`${EXPRESSION_PREFIX}*`),
        results: null,
      });
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
        missingPlates: MISSING_PLATES,
        trials,
        results: null,
        note: "No human results live here. Panellist scores are recorded by hand in docs/pair-art/KIDTEST_RESULTS.md per scripts/kidtest-protocol.md.",
      },
      null,
      2,
    ),
  );

  /* Prepare (and screenshot) one find-trial screen per width over the
   * real game page, when Holmes exists. Missing plate → annotated
   * NOT RUN, never a failure: the manifest above is the deliverable. */
  if (!holmes) {
    test.info().annotations.push({
      type: "not-run",
      description: `find-trial screens NOT RUN: ${missingReason("holmes-standing")}`,
    });
    return;
  }
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
      await placePlate(page, holmes, spot, band.max);
      await page.screenshot({
        path: path.resolve(`test-results/pair-art-kidtest/find-${width}.png`),
      });
    } finally {
      await context.close();
    }
  }
});
