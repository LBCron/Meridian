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

- [ ] Model sheets — Holmes + Watson parts per spec §3
  (hat, head, torso/coat, arm-front, arm-back, legs),
  22 pose composites, 22 faces, 2 static composites
- [ ] Silhouette gate — grayscale renders at 104 px committed
  with the sheets + crew-internal sign-off before colour lock
  (spec §11)
- [ ] Harness report — palm error, asset / decoded budgets,
  scale ratio, zero-live-filter check, with exact commands +
  target revision (spec §§7, 10)

## Budget table

Hard numbers from spec §7 / §8. Measured values are filled by the
coordinator from the art + harness reports before the panel votes —
a `{{TOKEN}}` left in this table at vote time is a blocker, not a
placeholder.

| Budget | Hard limit | Measured | Verdict |
| :--- | :--- | :--- | :--- |
| Total runtime pair assets (lazy-loaded) | ≤500 KB | {{TOTAL_ASSETS_KB}} KB | {{TOTAL_ASSETS_VERDICT}} |
| Decoded memory | ≤32 MB | {{DECODED_MB}} MB | {{DECODED_VERDICT}} |
| Palm-anchor error — Holmes `(99, 25)` | ≤3 px at rig scale | {{PALM_HOLMES_PX}} px | {{PALM_HOLMES_VERDICT}} |
| Palm-anchor error — Watson `(15, 21)` | ≤3 px at rig scale | {{PALM_WATSON_PX}} px | {{PALM_WATSON_VERDICT}} |
| Live per-frame SVG filters | 0 | {{LIVE_FILTERS_COUNT}} | {{LIVE_FILTERS_VERDICT}} |
| Static composite — Holmes | ≈20–30 KB | {{STATIC_HOLMES_KB}} KB | {{STATIC_HOLMES_VERDICT}} |
| Static composite — Watson | ≈20–30 KB | {{STATIC_WATSON_KB}} KB | {{STATIC_WATSON_VERDICT}} |
| Scale ratio Watson / Holmes (every composite) | 0.73–0.79 (≈0.75 law) | {{SCALE_RATIO_RANGE}} | {{SCALE_RATIO_VERDICT}} |
| Silhouette gate (grayscale, 104 px) | Approved before colour lock | {{SILHOUETTE_GATE}} | {{SILHOUETTE_VERDICT}} |
| Harness target revision | — | {{HARNESS_REVISION}} | — |

## The laws, in summary

Full text: `docs/pair-art/MODEL_SHEET_SPEC.md` §§8–10.

- **Scale law:** Watson ≈0.75× Holmes in **every** frame (0.97
  measured in mockup QA = defect). In-play lock: 390 px →
  Holmes 170 / Watson 130; 1280 px → Holmes 150 / Watson 115.
  Hero moments carry the ratio inside the artwork. Kid-test
  bands 112–128 / 128–144 / 144–160 / 160–176 px with face
  floors 38 / 44 / 48 / 52 px at 390 / 768 / 1280 / 1920.
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
  `follow.ts`, `watson-walk.ts`) and, for PR A, everything under
  `src/`, `tests/`, `scripts/`, and `public/`.
- Diff stat at vote time: {{DIFF_STAT}} — any `src/` / `tests/` /
  `scripts/` / `public/` path in the final diff fails this PR.

## Where the study and the code disagreed

Flagged in spec §12, not papered over. Headlines:

1. Coffee cup is **not** a rig prop — it lives in the host's
   bench markup and never enters play (code governs; no cup
   part is drawn).
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
- [ ] Harness — {{HARNESS_COMMANDS}} on {{HARNESS_REVISION}}:
  {{HARNESS_RESULT}}
- [ ] Silo QA — keyed PR# + head SHA: {{SILO_QA_VERDICT}}
- [ ] Panel — 13 seats incl. Game player, on the final tip:
  {{PANEL_TALLY}}
- [ ] DevEx: {{DEVEX_VERDICT}} · Benchmark: {{BENCHMARK_VERDICT}}
  · CI: {{CI_VERDICT}}
- [ ] Code gates (tsc / unit / build): **NOT RUN** — docs +
  assets only, no code touched; stated plainly rather than
  implied green.
