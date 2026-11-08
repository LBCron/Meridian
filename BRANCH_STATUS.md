# BRANCH_STATUS — feat/pair-art-sheets

- **Branch:** `feat/pair-art-sheets` · **Base:** `main` @ `9e49da3` (PR #365 merged + live)
- **Design of record:** format study `STUDY-format-rebuild.md` +
  `MOCKUP-NOTES.md` (format-study evidence folder), binding spec
  `docs/pair-art/MODEL_SHEET_SPEC.md` (this PR), handbook ch.10
  PR A addendum (this PR).

## Coordinator pointers (2026-11-07 night)

- Base of record for this branch: `main` @ `9e49da3`
  (PRs #357–#365 merged + live). PR #364 (`feat/holmes-follow`,
  PB-1 follow model) is OPEN, NOT merged, and was never part of
  this branch’s base; on its own branch at tip `c90462a`.
- #364’s E2E zero-overlap regression class C (Watson over clue
  text) is NOT a PR A pass item: re-verify once #364 merges,
  against the panel-voted cured tip.
- PRs #351 / #353 (crash-report lane): OPEN, Chitti
  monitor-only — not this lane’s work.

## Task capsule

TASK / requested outcome: PR A of the Holmes & Watson character
re-skin programme — painted model sheets drawn to the existing
engine's pivots, viewBoxes, palm anchors, pose set, and face set,
plus the binding model-sheet spec, the automated measurement
harness, the handbook addendum, and the PR body draft.
Sheets + spec + harness ONLY: no engine swap, no new flag, no
behaviour change. PR B swaps the engine art behind `pairArt`;
PR C adds hand-drawn hero moments; PR D flips + retires the
flat rig behind the kid-test gate.

OWNER RULINGS (Veeresh):
- (1) Cold Trail card films ARE the reference — CONFIRMED
  2026-11-07 ~15:57 CST (voice call). The re-skin is Holmes &
  Watson in that painted style, not new edition cards.
- (2)–(4) ALL RULED YES 2026-11-07 ~21:24 CST, in chat,
  verbatim: **"Yes to all three — start PR A"** — given after
  ❤️ + "Love this version" on the final regenerated mockup.
  The three: (2) LOOK-as-live-rig, (3) doll chassis +
  hero moments, (4) per-cell kid test as go/no-go.

Interpretations considered and selected reading:
- "Sheets" = separate painted parts per spec §3 (hat, head,
  torso/coat, arm-front with palm anchor, arm-back, legs),
  22 pose composites, 22 faces (11 FaceKinds × 2), and 2
  static degradation composites — at source resolution for a
  176 px rendered height. A single illustration per character
  cannot be doll-rigged in PR B and is not a sheet set.
- "Props whitelist" names two whitelists: the host-props list
  in `detective-host-props.ts` (7 pinned keys — what the pair
  may KNOW) and the visual props in the pose specs (what the
  pair may HOLD: magnifying glass, clue card, notebook +
  pencil, coffee cup bench-only). Spec §4 keeps them separate.
  The coffee cup is in the host's bench markup, NOT in
  `DetectivePair.tsx` (its header comment: cups "never enter
  play") — no cup part is drawn for either rig.
- The verb shortlist is the engine's current 22 poses exactly
  (Holmes 12 + Watson 10, face assignments in spec §5.2) —
  a closed set; new poses need a spec amendment (spec §5.3).
  Speaking is a CSS mouth-flap overlay on any face, not a
  pose; the static composite is a degradation image, not a pose.
- The kid test is PR D's gate. PR A owes the automatable
  smoke gate (palm, budgets, ratio, silhouette renders),
  not a child panel.
- COORDINATOR RULINGS (records cures, 2026-11-07 night — the
  builder documents and the delivered assets disagreed; these
  rulings make the record match the delivery, on evidence):
  (a) Scope line: PR A’s own harness and assets are in scope
  per the owner’s brief — `tests/e2e/pair-art-kidtest.spec.ts`,
  the `pair-art-kidtest` project in `playwright.config.ts`,
  `scripts/kidtest-*`, and
  `public/assets/detective/pair-art/`. Only `src/` is out of
  scope. The PR body’s scope audit now says exactly this.
  (b) Coffee cup: the cups themselves live in the host’s bench
  markup (code of record, unchanged by this ruling); PR A draws
  exactly ONE shared cup part, `prop-cup.png`, for the bench
  hero tableau — never for either character as a held or worn
  prop, and a cup inside either character rig in any pose is a
  defect. Spec §4 and the PR body’s scope audit now say this.
  (c) Static composites: the delivered pose plates serve as the
  static degradation composites — Holmes `holmes-pose-dock.png`
  (15.7 KB), Watson `watson-pose-station-idle.png` (18.6 KB);
  both within the study’s ≈20–30 KB band. The conflation with
  LOCKED GAME-RUNTIME degradation tiers is dropped: the
  low-memory tier keeps its own small static composite and the
  in-game degradation architecture is untouched by PR A.
  (d) The mouth-travel line in spec §5.4 is the MOUTH-HEIGHT
  bar: the speaking flap needs a mouth region tall enough
  (≥3 px at rig scale) to read as speech, never a ≥3 px
  centroid-travel across expressions. Measurements in the lock
  are recorded under that reading.
  (e) Coverage status in the harness is measured against the
  real built page (serveBuiltArtifact over the actual
  GeoDetective page), never a static export: size/face/coverage
  measures run on the same page the player sees.

Tier and rationale: Tier 2 — Council. New feature programme,
3+ files, a new asset surface, and a design-of-record decision
(the verb shortlist). The programme itself was decided by the
2026-11-07 format study (unanimous feasibility verdict) and
the owner's rulings above; this PR executes that record.

Done condition / scenarios / evidence:
- Spec: `docs/pair-art/MODEL_SHEET_SPEC.md` contains the
  programme diagram, parts ↔ pivots ↔ viewBoxes (Holmes
  120×178, frontArm (78,58) / swingArm (44,58); Watson
  134×140, frontArm (36,54) / noteArm (82,54);
  HIGH_FIVE_CONTACT holmes (99,25) / watson (15,21)), the
  22-pose shortlist with faces, the 11 × 2 expression set +
  ≥3 px mouth-travel rule, hard budgets (≤500 KB lazy /
  ≤32 MB decoded / palm ≤3 px automated / zero live SVG
  filters / degradation ladder), scale law, staging law,
  gaze-leak law, silhouette gate, kid-test gate, this
  capsule's source text, and the redundancy audit.
- Handbook: ch.10 gains an additive PR A addendum only —
  no existing section rewritten (diff-checked).
- PR body draft: `docs/pair-art/PR_BODY.md` with budget
  table left as {{TOKENS}} for the coordinator to fill from
  the art + harness reports, and the verbatim merge line.
- Art + harness (sibling crews): sheets for every part /
  pose / face / composite; harness output committed showing
  palm ≤3 px, budgets inside limits, ratio 0.73–0.79 on
  every composite; grayscale 104 px silhouette renders
  committed + gate sign-off recorded before colour lock.
- Diff audit: no file under `src/`, `tests/`, `scripts/`,
  or `public/` in the diff.

Files in scope: `docs/pair-art/MODEL_SHEET_SPEC.md` (new),
`docs/pair-art/PR_BODY.md` (new), `docs/pair-art/` sheet
assets + grayscale renders + harness output (sibling crews,
paths named in the PR body when they land),
`docs/handbook/10-holmes-and-watson-pair.md` (addendum only),
`BRANCH_STATUS.md` (this file).
Protected / untouched — the pair-behaviour train, in full:
`src/game/loop/detective/DetectiveHost.tsx`,
`src/game/loop/detective/detective-state.ts`,
`src/game/loop/detective/companion.ts`,
`src/game/loop/detective/follow.ts` (not present on main @
9e49da3 — protected by name regardless; PR A must not
create it), `src/game/loop/detective/watson-walk.ts` —
and, for PR A, everything else under `src/`, `tests/`,
`scripts/`, `public/`, including `DetectivePair.tsx` and
`detective-host-props.ts` themselves (read as the contract;
PR B's scope, not PR A's).

Dependencies / ordering: this spec lands first — it is the
art + harness crews' shared contract. PR B blocks on sheets
+ harness green + silhouette gate. PR C blocks on PR B.
PR D blocks on PR C + the kid test (spec §10). The
pair-behaviour train owns its files on its own branches;
any merge-up is a faithful union.
Verification contract: diff audit against the scope list
(any src/ tests/ scripts/ public/ path fails the PR) →
harness run with exact commands + target revision committed
→ Silo QA keyed PR#+tip → 13-seat panel (personas verbatim
from ~/.codex/agents, incl. Game player) on the FINAL tip →
DevEx → benchmark → CI → merge on READY / READY-WITH-NITS
(ship-when-ready, owner's standing directive 2026-11-04) →
branch deleted + tip SHA ledgered. Code gates (tsc / unit /
build) are NOT RUN for the spec/docs portion — no code
touched — and the PR body states that plainly.
Assumptions / risks: sheet source format is the art crew's
call inside the budgets (harness measures exports). Risk:
22 faces + 22 composites inside 500 KB is tight — a shortfall
is a spec-amendment discussion, never a silent cut. Risk:
the scale law (170 px at 390) exceeds the shipped rig height
(104 px) and may interact with the staging gutter (118 px) —
PR B owns the reconciliation; flagged in spec §12.5.
Unknown: Watson's host-velocity drawn walk cycle (study's
open choice) is PR B prototyping; PR A walk sheets must keep
both walk options possible.
Simpler / rejected: one illustration per character, sliced
later (pivots are known now — draw to them); enriched vector
instead of paint (the study: vector cannot reach the texture
that is the owner's complaint); spec after the art (the palm,
scale, and gaze laws are cheaper obeyed while drawing).
Budget: Tier 2 parent cap 400k tokens (repo default), shared
across coordinator + delegates.
Approvals: owner rulings (1)–(4) GIVEN (above). PR + merge
under the coordinator's assignment (ship-when-ready);
branch protection untouched.

## Status

- [x] Study + mockup notes read; engine contract verified
  against `DetectivePair.tsx` + `detective-host-props.ts`
  on main `9e49da3` (viewBoxes, pivots, contact anchors,
  12 + 10 poses, 11 FaceKinds, 7 host-prop keys)
- [x] Spec: `docs/pair-art/MODEL_SHEET_SPEC.md`
- [x] Handbook: ch.10 PR A addendum (additive only)
- [x] PR body draft: `docs/pair-art/PR_BODY.md`
  (budget {{TOKENS}} left for coordinator)
- [x] Study-vs-code disagreements flagged in spec §12
  (coffee cup, face coverage, follow.ts, pairArt flag,
  rig height, mouth-flap location, study reconstruction)
- [ ] Art: model sheets (parts / 22 poses / 22 faces /
  2 static composites) — sibling crew
- [ ] Harness: palm / budget / ratio report committed —
  sibling crew
- [ ] Silhouette gate: grayscale 104 px renders +
  sign-off before colour lock — sibling crew
- [ ] Silo QA (keyed PR#+tip)
- [ ] Panel 13 seats by name + DevEx + benchmark
- [ ] Merge on verdict + branch deleted + tip SHA ledgered

## Status — 2026-11-07 night (coordinator)

- Build complete: spec `f12389c`, harness `1762e3f`, art
  `8f0e5fd` + `f2adf71`. Measured gates all PASS: runtime
  147,920 B of the 500,000 B budget; decoded 1.54 MB of 32 MB;
  palm error 0.35 px both characters (gate ≤3 px); silhouette
  gate PASS at 104 px grayscale; scale ratio 0.75–0.77.
- Records cures applied (coordinator rulings above): scope
  line, coffee-cup wording, static-composite sourcing,
  mouth-height reading, coverage-against-real-page reading.
- Next: push, open the PR, run the repo gates, Silo QA keyed
  to the final tip, 13-seat panel by name.

## Face-floor finding — coordinator ruling (f), 2026-11-08

The final-art smoke re-run surfaced a harness↔art break,
fixed in this commit, plus an open measure the panel must
see:

1. **Adapter gap (fixed):** manifest.json carried face
   geometry only in per-character shape
   (`characters.<c>.faces.<kind>.faceBox`, natural px); the
   harness readers (kid-test spec + smoke script) read a
   top-level `plates` map keyed by plate filename with
   `{faceBox}` fractions. Neither side was wrong — the
   adapter between them was never written. `plates` is now
   derived from the per-character data (figure plates from
   the neutral faceBox ÷ figure natural size; a face plate's
   box is its full frame — the crop IS the face region).
   The per-character data stays the source of truth.
2. **Measured, honestly recorded:** with the adapter in
   place the smoke measures face height at max in-band size:
   Holmes 31 / 35 / 39 / 42 px at 390 / 768 / 1280 / 1920 —
   BELOW the §8.3 floors (38 / 44 / 48 / 52) in every cell.
   Watson 38 / 43 / 48 / 56 px — passes 390 + 1280, misses
   768 by 1 px, passes 1920. Full table:
   `docs/pair-art/KIDTEST_SMOKE.md` (regenerated).
3. **What the published box is:** the whole head crop
   (hat brim → chin, hair and ears included) — exactly the
   altitude §8.3 defines ("smallest rendered face height,
   hat brim to chin"). The number is not a definitional
   artefact; the head genuinely is ~24% of Holmes's figure
   height in the delivered register, and the floors assume
   ~30%.
4. **Ruling:** the FAIL is RECORDED, not cured, in PR A.
   Rationale: (a) the floors bind the FLIP (PR D go/no-go,
   owner ruling 4), not PR A's sheets; (b) both candidate
   cures change things PR A may not change alone — re-proportioning
   the head departs from the reference register the owner
   approved (❤️ "Love this version", 2026-11-07), and
   shrinking the floors amends a study law; (c) PR A is
   assets + spec + harness only. PR B owns the reconciliation,
   and its options are now explicit: render sizes per cell,
   head share at assembly, or a floor amendment carried to
   the owner with this measurement attached. The 13-seat
   panel votes with this finding on the table; a panel BLOCK
   on it is a legitimate outcome and escalates to the owner
   with the same numbers.
