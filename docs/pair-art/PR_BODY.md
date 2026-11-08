# PR A — Character Re-Skin: Model Sheets, Spec & Harness

Merge only on the panel's READY/READY-WITH-NITS verdict on the final tip (ship-when-ready, owner 2026-11-04).

## Summary

Holmes & Watson are re-drawn in the painted storybook look of the
Cold Trail card films — the owner's confirmed reference — without
changing how the pair behaves. This PR is the first of four:

- **PR A (this PR):** the painted model sheets, the binding model
  sheet spec, and the automated harness that measures the sheets
  against the budgets. Sheets + spec + harness only.
- **PR B:** the engine re-skin behind the new flag `pairArt` —
  same engine, same 22 poses, same props, same state machine.
- **PR C:** hand-drawn hero moments (bench intro + celebration).
- **PR D:** the flip + retirement of the flat rig, gated by the
  per-cell kid test as go / no-go.

The engine, pose / palm-anchor architecture, props whitelist, and
answer-blindness are unchanged by the whole programme. Holmes stays
answer-blind by construction.

**⚠️ Panel outcome — NOT READY (round 1, tip `c857a71`):** the
13-seat panel returned 7 approve-with-nits and **6 BLOCKs** — the
face-floor FAIL below (ruling (f)) from the UX designer, narrative,
and Game player seats; a parts-integrity BLOCK from the Game
developer (arms without hands, a second magnifier baked into the
legs slice, fused legs, no shipped palm measurer); a compositing
BLOCK from the Frontend seat (flat keyline bars on interior cut
edges + no runtime halo source); and protocol/harness BLOCKs from
the UX researcher and Office hours. Cures are being applied on
this branch; the panel re-votes the cured tip. The sheets do NOT
merge on round 1.

**Owner rulings of record:**

- (1) Cold Trail films are the reference — CONFIRMED, Veeresh,
  2026-11-07 ~15:57 CST (voice call).
- (2) LOOK-as-live-rig, (3) doll chassis + hero moments,
  (4) per-cell kid test as go/no-go — all ruled YES, Veeresh,
  2026-11-07 ~21:24 CST, in chat: **"Yes to all three — start
  PR A"**, given after ❤️ + "Love this version" on the final
  regenerated mockup (`mockup-390.mp4`, format-study evidence
  folder).

**Design of record:** `docs/pair-art/MODEL_SHEET_SPEC.md` (this PR)
over the format study (`STUDY-format-rebuild.md` +
`MOCKUP-NOTES.md`, evidence folder) and handbook ch.10.

## Deliverables checklist

Spec / docs (this branch's spec crew):

- [x] `docs/pair-art/MODEL_SHEET_SPEC.md` — the binding spec:
  programme shape, parts ↔ pivots ↔ viewBoxes, the closed
  22-pose verb shortlist with face assignments, the 11 × 2
  expression set + mouth-travel rule, hard budgets, scale law,
  staging law, gaze-leak law, silhouette gate, kid-test gate,
  task capsule, redundancy audit
- [x] Handbook addendum — `docs/handbook/10-holmes-and-watson-pair.md`,
  additive PR A section only, no existing section rewritten
- [x] `BRANCH_STATUS.md` — PR A capsule + status, repo convention
- [x] `docs/pair-art/PR_BODY.md` — this draft

Art / harness (sibling crews — coordinator fills on landing):

- [x] Model sheets — Holmes + Watson parts per spec §3
  (hat, head, torso/coat, arm-front, arm-back, legs),
  22 pose composites, 22 faces, 2 static composites —
  landed `8f0e5fd` + `f2adf71` (parts-integrity cures from
  the panel round 1 are tracked in the Panel section below)
- [x] Silhouette gate — grayscale renders at 104 px committed
  with the sheets + crew-internal sign-off before colour lock
  (spec §11) — PASS, recorded in the asset lock
- [x] Harness report — palm error, asset / decoded budgets,
  scale ratio, zero-live-filter check, with exact commands +
  target revision (spec §§7, 10) — landed `1762e3f`, re-run
  on the final art (see Verification)

## Budget table

Hard numbers from spec §7 / §8. Measured values are filled by the
coordinator from the art + harness reports before the panel votes —
a `{{TOKEN}}` left in this table at vote time is a blocker, not a
placeholder.

| Budget | Hard limit | Measured | Verdict |
| :--- | :--- | :--- | :--- |
| Total runtime pair assets (lazy-loaded) | ≤500 KB | 147.9 KB | PASS |
| Decoded memory | ≤32 MB | 1.54 MB | PASS |
| Palm-anchor error — Holmes `(99, 25)` | ≤3 px at rig scale | 0.35 px | PASS |
| Palm-anchor error — Watson `(15, 21)` | ≤3 px at rig scale | 0.35 px | PASS |
| Live per-frame SVG filters | 0 | 0 | PASS |
| Static composite — Holmes | ≈20–30 KB | 15.7 KB | PASS |
| Static composite — Watson | ≈20–30 KB | 18.6 KB | PASS |
| Scale ratio Watson / Holmes (every composite) | 0.73–0.79 (≈0.75 law) | 0.75–0.77 (mean 0.76) | PASS |
| Silhouette gate (grayscale, 104 px) | Approved before colour lock | Approved — both figures read correctly in grayscale at 104 px before colour lock (Holmes tall/thin + deerstalker, 47 px wide; Watson short/stout + bowler, 63 px wide; locked in ASSET_LOCK.json `silhouette_gate`) | PASS |
| Face height at max in-band size (§8.3 floors) | Holmes ≥38 / 44 / 48 / 52 px · Watson ≥38 / 44 / 48 / 52 px at 390 / 768 / 1280 / 1920 | Holmes 31 / 35 / 39 / 43 px · Watson 38 / 43 / 48 / 53 px | **FAIL — ruling (f): recorded, not cured in PR A; the floors bind the PR D flip (owner ruling 4); PR B owns reconciliation; the panel's face BLOCKs escalate the cure choice to the owner** |
| Harness target revision | — | 1762e3f (the kid-test harness commit); the smoke re-run on the final art tip is recorded in the Harness line below | — |

## The laws, in summary

Full text: `docs/pair-art/MODEL_SHEET_SPEC.md` §§8–10.

- **Scale law:** Watson ≈0.75× Holmes in **every** frame (0.97
  measured in mockup QA = defect). In-play lock: 390 px →
  Holmes 170 / Watson 130; 1280 px → Holmes 150 / Watson 115.
  Hero moments carry the ratio inside the artwork. Kid-test
  bands 112–128 / 128–144 / 144–160 / 160–176 px with face
  floors 38 / 44 / 48 / 52 px at 390 / 768 / 1280 / 1920.
  **Measured on the delivered sheets (smoke re-run, final
  tip): the face measure now RUNS — Holmes 31 / 35 / 39 /
  43 px, below the floor in every cell; Watson 38 / 43 /
  48 / 53 px, missing only the 768 floor by 1 px.** The
  published face box is the whole head crop (hat brim →
  chin), exactly §8.3's definition, so the shortfall is
  real: the head is ~24% of Holmes's figure height in the
  approved register, the floors assume ~30%. Recorded as
  coordinator ruling (f) in `BRANCH_STATUS.md`: the floors
  bind the PR D flip, not PR A's sheets; both cures
  (re-proportion the head away from the owner-approved
  register, or amend the study floors) are owner-level
  calls, so PR B owns the reconciliation and the panel
  votes with this finding on the table.
- **Staging law:** figures live in page space (the gutter) —
  never on map tiles, the map frame, attribution, buttons, or
  any UI chrome. Zero clue-text coverage. No bench furniture
  in walk frames. Celebration in page flow (a slot the cards
  displace around), never over cards.
- **Gaze-leak law:** gaze / lean is an answer-leak channel.
  Directed gaze may only use coordinates answer-blind Holmes
  legitimately receives via `detective-host-props.ts` (the
  pinned seven keys). One gaze toward the correct place =
  BLOCK-class defect. The re-skin changes NO props, NO state
  machine, NO answer-blindness architecture.
- **Kid test (PR D go / no-go):** per width × background cell —
  find-Holmes ≥27/30 in ≤2 s in every cell including the static
  fallback (≤25 = kill), identity ≥27/30, expression ≥26/30,
  zero clue-text coverage at max in-band size; ~60 fps on a
  2 GB-class Android during pan + follow + walk at
  390 / 768 / 1280. A failed bar flips `pairArt` off with no
  re-vote.

## Redundancy audit

Per the owner's standing rule (2026-10-29) — full table in
spec §14:

| Surface | Could duplicate | Verdict |
| :--- | :--- | :--- |
| PR A harness (palm / budgets / ratio / silhouette) | Detective E2E suite (`tests/e2e/detective-*.spec.ts`) | **Complements, does not duplicate** — E2E tests the wired game in a browser; the harness tests loose sheets before wiring exists. Neither can do the other's job. |
| Painted sheets (`docs/pair-art/`) | Inline SVG art in `DetectivePair.tsx` | **Complements, does not duplicate** — the inline art stays the shipping fallback (Save-Data rung + flag-off path) until PR D retires it after the flip. Bounded, named, with a deletion PR. |
| Model sheet spec | Handbook ch.10 | **Different jobs** — handbook = decision record; spec = executable build contract. The addendum summarises and points; it does not copy tables. |
| This PR body | `BRANCH_STATUS.md` | **Different moments** — branch status is the living capsule; the PR body is the one-time merge record the panel votes on. Repo convention. |

## Scope audit

- **In scope:** `docs/pair-art/**`,
  `docs/handbook/10-holmes-and-watson-pair.md` (addendum only),
  `BRANCH_STATUS.md`.
- **Protected — untouched:** the pair-behaviour train in full
  (`DetectiveHost.tsx`, `detective-state.ts`, `companion.ts`,
  `watson-walk.ts` — and `follow.ts`, the follow-model module
  owned by OPEN PR #364 (`feat/holmes-follow`, tip `c90462a`),
  which does not exist on main at `9e49da3` and is protected
  by name regardless) and, for PR A, everything under
  `src/`. (`tests/e2e/pair-art-kidtest.spec.ts`, the
  `pair-art-kidtest` project in `playwright.config.ts`,
  `scripts/kidtest-*`, and `public/assets/detective/pair-art/`
  are PR A’s own harness and assets, in scope per the owner’s
  brief.)
- Diff stat at vote time: the full PR diff against main `9e49da3`: 78 files changed, 6,034 insertions(+), 137 deletions(-) (measured at the Silo-QA-cured tip `df7adbc`; records-only commits after it change prose counts, never scope) — assets, docs, harness; zero `src/` paths — any `src/` path in
  the final diff fails this PR; `tests/`, `scripts/`, and
  `public/` paths beyond the kidtest spec, the playwright
  project, the kidtest scripts, and the pair-art assets fail
  it too.

## Where the study and the code disagreed

Flagged in spec §12, not papered over. Headlines:

1. Coffee cup is **not** a rig prop — it lives in the host's
   bench markup and never enters play (code governs; no cup
   part is drawn for either character — one shared cup part is drawn for the bench hero tableau only).
2. The shipped renderers lack distinct faces for Holmes
   `marking` and Watson `focused` / `attentive` / `hushed` /
   `wonder` — PR A draws all 22 faces anyway (spec §6.3).
3. `follow.ts` does not exist on `main` @ `9e49da3` — protected
   by name regardless (spec §12.3).
4. `pairArt` does not exist yet — PR B creates it, by design.
5. The study's scale law (170 px at 390) exceeds the shipped
   `DETECTIVE_RIG_HEIGHT_PX = 104` — PR B owns the
   reconciliation; PR A draws for the 176 px top band.

## Verification

- [ ] Diff audit — scope list above, staged files named only,
  never `git add -A`
- [x] Harness — `node scripts/kidtest-smoke.mjs` + the `pair-art-kidtest` Playwright project, re-run on the final tip `504ddbc`:
  smoke RAN (64 plates, 0 missing; face measure live via the manifest `plates` adapter — Holmes below floor in every cell, Watson 768 by 1 px, both recorded under ruling (f), NOT cured); Playwright: 5 tests executed in 33.6 min — size band + zero clue-text coverage PASS on the real built page at 390/768/1280/1920; face floor FAILED for Holmes at every width exactly as the smoke predicted (the harness hard-asserts the shortfall — see the Panel section: the round-1 panel read the "5/5" phrasing against this FAIL and the wording is corrected here; the run's green was the size/coverage measures completing their contract, never a face pass); human trials prepared, never faked: trial manifest + find screens exported, `results: null` throughout. Repo gates on the same tip: tsc clean · `npm test` 3,287 pass / 0 fail · worker suite 145/0 (run for completeness; no `workers/` files touched) · lint-cards GATE PASSED · `build:pages` green (65 pair-art files in dist, inert until PR B imports them).
- [x] Silo QA — **PASS** keyed PR#366 + `df7adbc`: full silo @`96ab16e` passed 7/8 checks with exact matches (scope, lock drift 0/64, manifest adapter, guard 6/6, tsc, lint-cards) and FAILED one records item (1920 face-px prose 42/56 vs the smoke script's measured 43/53); prose-only cure `df7adbc`; **DELTA SILO QA PASS** on the cured tip (cure confined to the 3 records files, corrected numbers verified, smoke regeneration byte-identical, guard still 6/6).
- [ ] Panel — 13 seats incl. Game player, on the final tip:
  {{PANEL_TALLY}}
- [ ] DevEx: {{DEVEX_VERDICT}} · Benchmark: {{BENCHMARK_VERDICT}}
  · CI: {{CI_VERDICT}}
- [x] Code gates (tsc / unit / build): **RUN and green** on
  the final art tip — tsc clean · `npm test` 3,287 pass /
  0 fail · worker suite 145/0 · lint-cards GATE PASSED ·
  `build:pages` green (see the Harness line above; the one
  scripts-suite test this PR's cure touched,
  `e2e-telemetry-guard`, re-verified 6/6 at the cure tip).
