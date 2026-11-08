# BRANCH_STATUS — feat/watson-station

- **Branch:** `feat/watson-station` · **Base:** `main` @ `9e49da3` (PR #365 merged + live)
- **Task:** Watson holds the clue-card station through the guessing phases.
- **Owner defect:** 2026-11-08 ~00:53 CST — Watson standing large at the
  map's bottom-left corner on the owner's phone during guessing.
- **Diagnosis of record:** `~/workspace/meridian-detective-evidence/diag-watson-corner/DIAGNOSIS.md`
  — the walk works on live production; when a clue read ends, the state
  machine enters `SEARCH_IDLE`, whose view parked Watson at placement
  "dock" (rendered inside the map, bottom-left), and `SEARCH_AREA` /
  `SELECTION_READ` / `ASK_NEXT` kept him docked. Owner's standing ruling
  (2026-11-07): "Watson stays at the clues once play starts."

## Task capsule

TASK / requested outcome: change Watson's placement from "dock" to
"station" in exactly four phases of `viewForState`
(`src/game/loop/detective/detective-state.ts`) — SEARCH_IDLE,
SEARCH_AREA, SELECTION_READ, ASK_NEXT — poses unchanged, no Holmes
placement or pose changed anywhere. Verify DetectiveHost needs no
logic change (it renders purely from the machine's placement), update
the unit + E2E pins that required Watson at the dock in the FULL
(non-degraded) path, and record the cure in the handbook.

Tier and rationale: Tier 1 builder silo under the coordinator's brief —
one proven mechanism, one view-table change. Independent clean-context
QA + panel verification are run by other agents, not the builder.

Done condition / evidence:
- Unit (TDD, RED first): the search-view pin flips dock → station; a
  new per-phase test pins SEARCH_AREA / SELECTION_READ / ASK_NEXT with
  Holmes-placement guards in all four phases. RED confirmed
  (dock ≠ station) before the cure; GREEN after.
- Host check: every `view.watson.placement === "dock"` consumer traced
  (`watsonOnMap`, `watsonReplayDockEl`, `mapSoundEl` guard, the map
  portal block) — all are placement-generic; in the cured phases the
  station cluster (figure, gutter transform, replay-at-station,
  station sound cluster) takes Watson and the map portal renders
  Holmes alone (the dock cluster markup is already conditional on
  `watsonOnMap`, so it tolerates Watson's absence). **Zero host logic
  changes** — only two stale comments updated.
- Degraded path untouched by design: dock-only companion
  (`data-companion="dock"` — Holmes's berth verdict), tap speech mode,
  and the "dock" member of `WatsonPlacement` (host fallback) all stay;
  E2E pins for that path were not modified.
- Gates: see Status below (real results, filled by the builder).

Files in scope: `src/game/loop/detective/detective-state.ts`,
`src/game/loop/detective/detective-state.test.ts`,
`src/game/loop/detective/DetectiveHost.tsx` (comments only),
`tests/e2e/detective-replay.spec.ts`, `tests/e2e/detective-sound.spec.ts`,
`tests/e2e/detective-visibility.spec.ts`,
`tests/e2e/detective-watson-walk.spec.ts`,
`tests/e2e/detective-staging.spec.ts` (comment only),
`docs/handbook/10-holmes-and-watson-pair.md` (new dated record section),
this file.

Collision note: the #364 lane (`feat/holmes-follow`) touches the same
two source files (`detective-state.ts`, `DetectiveHost.tsx`). This
branch is off `main` @ `9e49da3` and merges independently; whichever
lane merges second rebases over the other.

## Status

- [x] Diagnosis read in full; mechanism confirmed in code
- [x] Unit test RED (dock ≠ station in the four phases)
- [x] Cure: four placements → "station" + plain-tone why-comments — `63879d8`, pushed
- [x] Host audit: zero logic changes needed; stale header + map-render comments updated — `45865ff`, pushed
- [x] E2E pins updated (full path only; degraded pins untouched) — `c142574`, pushed
- [x] Handbook: "Watson station cure (2026-11-08)" record section — `d732610`, pushed
- [x] Builder gates:
  - `npx tsc --noEmit` — clean
  - `npm test` — PASS (final suite 2267/2267, 0 fail; command exit 0)
  - `npm run test:worker` — PASS (145/145, 0 fail)
  - `node scripts/lint-cards.mjs` — GATE PASSED
  - `npm run build:pages` — PASS (exit 0; prerender + fingerprint-sw
    completed. Two earlier local attempts were killed by VM restarts
    mid-build — environment, not build errors — and the gate was
    re-run clean to this result.)
- [ ] PR opened — NO: builder brief forbids opening PRs; the
  coordinator opens it after independent clean-context QA
- [ ] Merge — on the owner's word / coordinator only, never the builder
