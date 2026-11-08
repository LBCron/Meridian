# BRANCH_STATUS — feat/pair-art-sheets

- **Branch:** `feat/pair-art-sheets` · **Base:** `main` @ `9e49da3` (PR #365 merged + live)
- **Design of record:** format study `STUDY-format-rebuild.md` +
  `MOCKUP-NOTES.md` (format-study evidence folder), binding spec
  `docs/pair-art/MODEL_SHEET_SPEC.md` (this PR), handbook ch.10
  PR A addendum (this PR).

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
