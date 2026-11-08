# BRANCH_STATUS — feat/holmes-follow (PB-1, pair-behaviour programme 1 of 3)

- **Branch:** `feat/holmes-follow` · **Base:** `main` @ `566c955` (PR #363 merged + live)
- **Owner spec:** restatement 2026-11-07 ~11:55 CST — Holmes follows the pointer/finger across the WHOLE PAGE and stays with it; returning to a home spot after a pause is "a big bug". Supersedes the waypoint-berth + dock-return model (#361–#363).
- **Flag:** `holmesFollow` — baked default `false` in `src/lib/flags.ts`, `public/flags.json` = `true` (ships ON in this PR; setting flags.json false is the one-line kill-switch back to PAUSE_BERTH).

## Done
- [x] New pure module `src/game/loop/detective/follow.ts`: follow solver (ring + edge perch, K2 clearance law 56/64 px, centre band 80–100 px, forbidden-rect rejection) + tier machine (PAGE_FOLLOW → PAUSE_BERTH → DOCK_ONLY; down on kill/dock/degradation verdicts, up on #362 re-qualification signals + case-open probe).
- [x] DetectiveHost reworked: window pointer wiring writes refs only; solves on ≥32 px displacement or ≥150 ms dwell, rate-limited 1/100 ms, against the CACHED forbidden set (rebuilt on scroll/resize/phase/case events only); fixed viewport portal render; positional memory in a ref across cases/phases; planted during scroll/pinch; speech lock; burst yield + return-to-last-pointer ~120 ms after idle; head-turn telegraph + single 0.3–0.8 s travel.
- [x] Deleted: `exitToDock`, the phase-exit dock snap, the >320 px remote rule, the berth solver in companion.ts (pause detector + auto-kill tracker kept; FG-5 latch untouched).
- [x] Unit gates: follow solver/tier tests fail-before/pass-after; companion coverage moved (berth-solver tests → follow tests); scripts 1021 pass / src 2262 pass / worker 145 pass; tsc clean; lint-cards PASSED.
- [x] Build: `npm run build:pages` exit 0 (needs XDG dirs on tmpfs on this VM — home quota exhausted).
- [x] E2E specs: NEW `detective-follow.spec.ts` (a)–(f) + telemetry-guard registration; REWRITTEN `detective-berth.spec.ts` (tier model), K2/K3 in `detective-companion.spec.ts` (above-point + pinch/pan-cancel rules deleted), staging C12 (remote rule deleted).
- [x] Docs: handbook ch.10 PB-1 banner + addendum; SPEC_CHECKLIST PB-1 section.

## Blocked / not done
- [ ] **E2E execution + 390/768/1280 render screenshots: ENVIRONMENT-BLOCKED on this VM.** The Chromium renderer crashes on game mount in all three installed browser builds, identically against the UNMODIFIED main build (donor dist control run) — not a PB-1 defect. Home disk quota is also exhausted (builds need the XDG redirect). Silo QA must run the detective E2E set + capture the three widths on a healthy runner before merge.
- [ ] Silo QA (independent) — coordinator's lane after this PR opens.
- [ ] 12-seat panel on the final tip — coordinator's lane.
- [ ] Benchmark (build bytes at tip) — coordinator's lane (bundle-report needs a healthy build env).

## Standing rules honoured
- HARD STOP at the owner's merge word — this branch is NOT merged.
- No branch-protection changes. No token/repo-scope changes.
- PB-2 (session/moments) and PB-3 (mute-by-character) are separate PRs, untouched here.

## Cure round (PR #364, 2026-11-07) — host fixes in DetectiveHost.tsx only
- **Cure B (flag-OFF data-companion integrity):** a legacy mirror state ("full"|"dock"|"killed") engaged only when holmesFollow is OFF, updated at the base/degradation effect, the case-change latch reset, and the auto-kill judge — the rendered data-companion is flag-branched at the single derivation point, so flag-OFF never reads "berth" again; tier machine + data-follow-tier untouched.
- **Cure D (bench "standing" collapse):** enterMap takes an onMap flag and records bench entry intent only for map-originated interactions (onDown containment, drag attributed by its down point, window wheel + off-map pinch pass false); onPauseConfirmed and the C2/C3 effects keep the unconditional default — heading clicks during the bench no longer arm intent, page-wide follow unchanged.
- **Cure C (zero-overlap, PRODUCT LAW):** every non-solver placement writer (first placement, enterMap, DOCK_ONLY perch) rebuilds forbidden rects fresh and tests Holmes's box before landing (perch scans the other viewport corners, bottom-left kept whenever legal; entry dock measured from the live map element); current-position eviction at the forbidden-rebuild effect and the scroll-end timer re-solves at the last pointer, re-perches in DOCK_ONLY, or burst-hides him (`.detective-host-holmes-hidden`) while a suspension holds — never painted over clue text, never travelling mid-speech. follow.ts untouched.
- **Cure D2 (follow-ON auto-entry at standing; owner PB-1 role model):** with `holmesFollow` ON, the C2 staging effect fires the existing `enterMap` path the moment the stage reaches "standing" — bench + intro are first-entry only, and once play starts Holmes takes his post on the map (entry dock first, follow machinery from there) instead of waiting for a first map touch; flag OFF is unchanged (map-originated intent only, cure D entry semantics preserved). DetectiveHost.tsx only; no stage timings, follow solver, speech, or Watson changes.
- **Gates on the cured tip:** tsc clean; npm test src 2262 pass / scripts suite pass (npm test exit 0); worker 145 pass; lint-cards GATE PASSED; build:pages exit 0.
