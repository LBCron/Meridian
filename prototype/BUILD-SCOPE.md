# BUILD SCOPE — Holmes & Watson for GeoDetective (production build plan)

⚡ **Next action: Veeresh answers the 6 numbered decisions in §4 (one word each) — then Unit 1 starts. No production code exists yet; this document is the build plan.**
📍 **State: SCOPE ONLY, produced 2026-11-05 on the owner's build order ("I guess its ok let's build it") after the full-loop mockup approval. Everything below scopes TO the approved spec + council rulings — nothing is redesigned. All counts marked [measured] were taken from the codebase/assets today; estimates show their math.**

---

## 0. The approved spec being scoped (recap, not re-litigation)

- **Two stations:** Watson at the active clue card, looking at it, reading each clue **verbatim** aloud while thinking. Holmes on the map.
- **The loop, per clue:** Watson reads (thinking) → 0.6 s silent thinking beat → Holmes acknowledges (rotating set: *"Right. Leave it with me." / "Very well, Watson." / "Noted, Watson." / "Ah... the game is afoot."*) + clue-local decode (≤6 words, clues 1–3; one full sentence on Hook + Giveaway; never combines clues, never names a region no unlocked clue named) → Holmes searches → on the player's pause (~350 ms desktop / ~450 ms touch) he berths beside the pause point (≥96 dp clearance, never covers fingertip/spot, glass DOWN all guessing phase, cancels instantly on pan/zoom/pinch, ABSENT during bottom sheet / rings / speech / reveal) → on selection, Holmes reads the selection name + the suspicion line *"Hmm... it could be it."* (ONE pre-rendered asset, identical for every pick) → *"Watson. The next question."* as the next clue unlocks → repeat.
- **Hook announcement:** Holmes solo, **hushed** (speed 85, −4 to −6 dB). The word "whisper" is banned in all production docs.
- **Endings:** solve = *"You found it!"* (Holmes, breakthrough register) → *"Case closed — the gold star marks the answer."* (Watson) + jump + high-five with real hand contact (glass handed to Watson first) + claps. Fail = Holmes reads the right answer in the game's own reveal format + both pout. Misses are voiceless except the owner-ordered selection read.
- **Art (owner-approved in the loop mockup):** Holmes brick-red plaid + rust deerstalker; Watson royal-blue plaid + navy bowler + gold tie; identity props kept; **no pipe**.
- **Voices:** Holmes `avocado_v2:atlas` "Burnished Trophy"; Watson `avocado_v2:pb1_music_02` "Hearty Oar"; emotion standard locked (per-mood speeds, per-segment renders, measured pitch gates, pair ≥20 Hz apart in every shared mood). Render/measurement method: `~/workspace/meridian-voice-spec/SPEC.md` + council Q3 tables in `COUNCIL-holmes-watson.md`.

---

## 1. AUDIO STRATEGY — the hard one, costed honestly

### 1.1 What the corpus actually is [measured]

| Fact | Value | Source |
|---|---|---|
| Case files on disk | **497** (`public/loop/clues/0–496.json`) | filesystem count |
| Core deck | **387 cases** | `public/loop/manifest.json` (`size: 387`) |
| Capitals pack | **110 cases, tiered 1–3 (famous-first by construction)** | `public/packs/capitals/manifest.json` (`size: 110`, `loopTiers`) |
| Total clue lines | **2,485** (497 × 5) | script count over clue files |
| Clue text volume | 58,755 words · avg **23.6 words/clue** | script count |
| Searchable place catalog (selection names) | **119,038 places** | `public/loop/names.v2.json` (parallel arrays, `n` = 119,038) |
| Render format rate | **8,003 B/s** (MP3 24 kHz mono ~64 kbps) | [measured] `clue2-climate-watson.mp3` = 91,429 B / 11.424 s |
| Typical clue read | ~10 s ≈ **~80 KB** | 23.6 words at Watson's 135–150 wpm × 8,003 B/s |
| Typical selection-name read | **~26 KB** (3.2–4.0 s) | [measured] `selection-henderson.mp3` 25,573 B · `selection-saltlakecity.mp3` 32,101 B |
| Existing recorded-audio precedent | 31 MP3s, 1.9 MB in `public/audio/` (storyteller/comet/grandpa), served as static files | `public/audio/`, URL builder `storytellerAudioUrl()` in `src/components/storyteller-lines.ts:78` |

### 1.2 Option (a) — pre-render EVERYTHING up front

| Asset class | Count | Math | Total |
|---|---|---|---|
| Watson clue reads (all 497 cases) | 2,485 | × ~80 KB | **≈ 199 MB** (range 175–225 MB) |
| Holmes decodes | **5 type templates** (3 micro + Hook + Giveaway full) — council DISMISSED per-case decodes as a manufactured leak surface | × ~15 KB | ≈ 0.1 MB |
| Fixed lines (4 acks, suspicion, ask-next, Hook announcement, 2 instructions, 2 win lines, amazement fragment) | ~12 | measured folder ≈ 316 KB for 10 | ≈ 0.4 MB |
| Fail answer reads (per case, game's reveal format) | 497 | × ~40 KB ([measured] prototype answer read 46,693 B) | ≈ 20 MB |
| Selection-name reads — FULL catalog | 119,038 | × ~26 KB | **≈ 3.1 GB — REJECTED by arithmetic** |
| **Option (a) total (names excluded — see §1.4)** | **3,000 assets** | | **≈ 220 MB** |

Per-case download stays small because delivery is lazy (§1.5): **~400 KB per case** (5 reads), fetched with/after the clue file — never in the initial bundle, never blocking first paint. The 220 MB is repo/hosting weight, not player weight. Hosting is the existing static deploy (GitHub Pages + Cloudflare Workers) — no new infrastructure, $0.

Pipeline cost: 3,000 renders is a batch job, not handwork — scripted `tts` calls with voice pins, then automated pitch verification per line (SPEC method). Human time is in the pipeline + QA sampling (Unit 1/3/11), not per-line handling. Failed-gate lines re-render automatically (max 2 retries, then flagged for human ear).

### 1.3 Option (b) — phased rollout (RECOMMENDED)

Mirror the game's own famous-first scaffolding — the Capitals pack is already tiered and famous by construction:

| Phase | Cases | Clue reads | Size | Why this order |
|---|---|---|---|---|
| **A — Capitals pack** | 110 | 550 | **≈ 44 MB** (+ answers ≈ 4 MB) | Tiered, famous, bounded; proves the full loop + gates on real traffic before the big batch |
| **B — Core deck** | 387 | 1,935 | **≈ 155 MB** (+ answers ≈ 16 MB) | The batch job at full scale, run once Phase A's gates pass |

Fixed lines + decode templates (~0.5 MB) ship in Phase A. Nothing about the player experience changes between phases except coverage: a case without renders plays exactly as today's game (the pair is present visually; reads fall back to silent — see §1.6 fallback law).

### 1.4 Selection-name reads — the bounded-coverage answer

The player can pick **any** of 119,038 searchable places, so "pre-render every name" is impossible (§1.2). Coverage by population tier [measured from `names.v2.json` `p` array]:

| Coverage tier | Names | Size (× ~26 KB) |
|---|---|---|
| Case answers (mandatory — fail reads + likely picks) | 497 | ≈ 13 MB (sentence format, §1.2) |
| Population ≥ 1,000,000 | 570 | ≈ 15 MB |
| **Population ≥ 500,000 (recommended)** | **1,201** | **≈ 31 MB** |
| Population ≥ 100,000 | 6,227 | ≈ 162 MB — too much for the marginal picks |

Names are fetched **one file per pick** (~26 KB), only when picked — total hosted size is the cost, per-player cost is one small file. **Uncovered pick = no name read; the suspicion line (fixed asset) still plays.** Holmes never says a wrong name and never improvises one — silence is the honest fallback. Render text comes from the game's own display-name path (`src/game/loop/place-resolve.ts`, `src/components/place-name.tsx`) so the spoken name is byte-identical to the name on the sheet. Coverage tier is Decision 2 (§4).

### 1.5 Option (c) — runtime synthesis: NOT VIABLE for this feature (stated plainly)

The app already has a runtime TTS path — `window.speechSynthesis` in `src/components/age-profile/ReadAloudButton.tsx` — and it **cannot** deliver this feature: it cannot pin the two approved UK voices, cannot hold the measured pitch gates (Holmes breakthrough ≥170 Hz, pair ≥20 Hz apart), varies by device/browser, and gives no gain control for the hushed register. The codebase's own precedent agrees: `src/components/grandpa-ask.ts` — a cast character speaks from a **recorded file, never speechSynthesis**. Runtime synthesis stays exactly where it is (generic read-aloud of story cards) and is **not** used for Holmes or Watson. There is no server TTS path either — Meridian is a static PWA; adding a runtime synthesis service would be new infrastructure, new cost, and a COPPA surface, for a worse result than pre-renders.

### 1.6 The render pipeline (build/content time)

1. **Manifest-driven:** a render manifest (JSON, committed) maps `(caseIndex, clueIndex) → { textHash, file, voice, speed, measuredHz, measuredWpm, status }` — same pattern as `src/assets/flags/registry.generated.ts` (generated, do-not-edit header) and the packs pipeline (`scripts/packs/`).
2. **Hash-keyed invalidation:** the hash is over the clue text **as rendered** (Watson's speed staircase 100→97→95→… is a function of clue index, recorded in the manifest). When clue text changes, the hash changes → only that line re-renders. A CI gate (in `scripts/`, wired beside `lint-cards` in the prebuild chain) fails the build on a stale or missing render for any case claimed as covered — coverage can never silently rot.
3. **Per-batch verification:** every render's returned `voice` field checked against the pin; pitch + wpm measured per line (SPEC script); batch fails if any line misses its Q3 gate (Watson reads 82–100 Hz; Holmes baseline 120–145 Hz; win line ≥170 Hz and ≥35% over baseline; hushed Hook measurably below questioning floor; pair ≥20 Hz apart per shared mood). Flat batch = failed batch.
4. **Storage/delivery:** files under `public/audio/detective/case-<index>/clue-<n>.mp3` + `public/audio/detective/fixed/*.mp3` + `public/audio/detective/names/<id>.mp3`; a per-case audio manifest is fetched alongside the clue file (LoopScreen already fetches `loop/clues/<index>.json` per deal — `src/game/loop/LoopScreen.tsx:573,763`). **Never precached by the service worker, never imported by the bundle** — plain static fetches, cache-on-first-play by the browser. Audio loads AFTER the case is playable; a slow or failed audio fetch degrades to silent play, never a blocked case.
5. **Per-case audio budget (gate):** ≤ **500 KB** downloaded per case (5 reads ≈ 400 KB + at most 2 name reads ≈ 52 KB); fixed set (~0.5 MB) downloads once per install, not per case.

---

## 2. COMPONENT / STATE ARCHITECTURE

### 2.1 Where the pair lives (real files)

| Piece | Home | Notes |
|---|---|---|
| Host screen | `src/game/loop/LoopScreen.tsx` (1,964 lines — the pair mounts here, beside the existing lazy `StorytellerNarration` boundary at line 100) | LoopScreen owns deal/clue/guess state today; the pair is a **child overlay**, not a fork of the screen |
| Map | `src/game/loop/LoopMap.tsx` (929 lines, MapLibre wrapper; owns `map.on("click")`, touch zoom/rotate) | Holmes's layer renders INSIDE the map container element (as the mockup proved); pointer kinematics come from map + DOM pointer events, not from game state |
| Clue data | `src/game/loop/types.ts` — `LoopClueFile` (line 169: *"NEVER contains the place name or region tags"*) | The codebase already practices data minimisation; §2.3 extends it |
| Guess evaluation | `src/game/loop/engine.ts`, `evaluate.ts`, `rings.ts` | The pair **never imports these** (see §2.3) |
| Audio discipline | `src/game/audio/play-guards.ts` (anti-annoyance guards), `src/game/audio/sfx.ts` (mute integration — sound toggle cancels speech) | Detective audio routes through the same guards + the global sound toggle |
| Pure decision helpers | Pattern: `src/components/storyteller-audio-guards.ts` (pure, node-testable) | The detective state machine follows this exact pattern |
| Degradation gates | `src/components/card-film.tsx:96-100` (`saveData`, `deviceMemory`), `src/hooks/use-prefers-reduced-motion.ts` | Reuse, don't reinvent (§2.5) |
| Feature flag | `src/lib/flags.ts` (`FlagName` union + `FLAG_DEFAULTS`) + `public/flags.json` | New flag `detectivePair`, default **false** (§2.6) |
| Cold Trail (later) | `src/game/coldtrail/TrailScreen.tsx` | Out of v1 scope — Decision 3 |

New code lands in **`src/game/loop/detective/`**: `DetectivePair.tsx` (rig + rendering), `detective-state.ts` (pure state machine), `detective-audio.ts` (sequential player over the manifest), `companion.ts` (pure pause/geometry logic), `detective.css`. Rig: the mockup's SVG pair (29.6 KB overlay JS incl. both rigs — `prototype/loop-overlay.js`) is re-drawn as production SVG components in the approved colours; budget ≤ 15 KB gz for both rigs.

### 2.2 The state machine (pure, unit-tested, no React inside)

States: `OFF` (flag/degradation) · `CASE_OPEN` (walk-in, instructions) · `READING` (Watson at the card; Holmes ack + decode scheduled) · `THINKING_BEAT` (0.6 s silence) · `SEARCH_IDLE` (Holmes searching, no player input yet) · `SEARCH_AREA` (player active; Holmes berths at pauses) · `SHEET` (pair absent/frozen per absence law) · `SELECTION_READ` (name + suspicion) · `ASK_NEXT` → back to `READING` · `CELEBRATE` · `FAIL_READ` → `POUT` · `DEBRIEF` (if Decision 4 = yes).

Events in: `clueUnlocked(n)`, `speechStarted/Ended`, `pointerMove/Down/Up` (kinematics only), `panZoomStart/End`, `sheetOpened/Closed`, `guessConfirmed`, `caseSolved`, `caseFailed`, `soundToggled`, `visibilityChanged`. Every transition is a pure function — the absence triggers (sheet open, ring animation + 1,000 ms, speech playing, pinch, reveal) are **state inputs, not timers**, per the council's "tested not timed" rule. Speech is strictly sequential (one player queue): a new speech event can never overlap the pair's own lines, and any speech owns the screen → Holmes hidden.

**Pointer-pause detection:** ONE passive pointer listener writing to a mutable ref (council performance shape: ≤1 write/frame, no React state per pointermove, no `getBoundingClientRect` per frame, transform-only animation, idle-sleep cancels rAF). Pause = velocity < ~20 px/s AND displacement < 8 px for 350 ms (touch: single finger, < 6 px for 450 ms, map still 250 ms). Geometry solver (pure function, unit-tested): given pause point + screen constraints, return a berth satisfying ≥96 dp centre distance (touch) / ≥64 px (desktop), ≥56 dp box clearance, above-the-finger half-plane, ≥120 dp from pin/ring centres — or `HIDE`. No valid berth → Holmes hides; overlap is never the fallback.

### 2.3 Answer-blindness — structural, not promised

- The companion + decode modules receive a **narrow props type**: `{ phase, clueIndex, pointerKinematics, sheetOpen, speechPlaying }`. They never receive the `LoopPuzzleState`, the clue file's `target`, the place ID, any guess evaluation, distance, or correctness flag. (LoopScreen holds `target` today; the pair's props are constructed from a whitelist, and a unit test asserts the props object has no forbidden keys.)
- Holmes's behaviour is a function of pointer speed, dwell, and elapsed time **only** — identical over right and wrong spots by construction.
- The suspicion line is **one audio file** for every pick (§1.4) — correctness cannot modulate it.
- Decodes come from the 5 type templates — no per-case text exists to leak with.
- **The swap test is a build gate** (§5): replay an identical recorded pointer trace against two cases whose answers differ under the trace endpoint; Holmes's rendered behaviour must be frame-identical. Ported from the mockup harness (`prototype/loop-audit.py`, `prototype/waypoint-realpage-audit.py`, trace JSONs in the evidence folder) into `tests/e2e/detective-swap.spec.ts` + a clearance-trace spec, using the existing `?loop-puzzle=<index>` E2E seam (`src/game/loop/day.ts`).

### 2.4 Test seams

- Pure modules (`detective-state.ts`, `companion.ts`) → node unit tests beside them, repo convention (`*.test.ts` next to source).
- E2E (`tests/e2e/`): `detective-stations.spec.ts` (Watson at card, reads fire in order), `detective-companion.spec.ts` (pause → berth; pan → cancel; sheet → absent ≤100 ms), `detective-swap.spec.ts` (the gate), `detective-endings.spec.ts` (celebration + fail/pout), `detective.reduced.spec.ts` (reduced-motion variant — pattern exists: `geodetective.reduced.spec.ts`, `coldtrail.reduced.spec.ts`). All E2E runs use the standing `flock ~/workspace/.e2e.lock --workers=1` discipline and the `?loop-puzzle` seam — no new test infrastructure.

### 2.5 Degradation matrix (card-film precedent, owner's motion law respected)

| Condition | Behaviour |
|---|---|
| `prefers-reduced-motion` | No walks; pair appears at stations by instant cut; poses still change; **audio unaffected** (the hook's own note: reduced motion mutes animation, never sound) |
| Save-Data / `deviceMemory ≤ 4` / battery saver | Holmes dock-only (no berthing); audio becomes tap-to-play per clue instead of auto; rig still present |
| Sound off (global toggle) | Pair fully visual; captions/text exactly as today's game (muted-parity: decodes are flavour only — every fact is already on screen) |
| Read-aloud pref = "never" (`src/game/age-profile/read-aloud-pref.ts`) | No auto speech; speaker buttons remain (the kid's tool is never hidden) — interacts with Decision 6 |
| Audio fetch fails / case not yet rendered | Silent play; the game is byte-identical to today |
| Runtime auto-kill | Rolling 5 s FPS < 45 or 3 long tasks > 100 ms in 10 s → companion movement off for the session (council Q2 §10) |

### 2.6 Feature flag

`detectivePair` added to `FlagName` + `FLAG_DEFAULTS` with **default false** (`src/lib/flags.ts` contract: defaults must equal current production behaviour). Rollout = merge dark → gates (§5) → flip via `public/flags.json` redeploy (no client release needed — the flags system's whole point). Kill-switch = flip back; the game returns to byte-identical today. Default-on/off at flip time is Decision 5.

---

## 3. WORK BREAKDOWN — small units, ordered, crew per unit

Sizes: S ≈ 1 session · M ≈ 2–3 sessions · L ≈ 4–5 sessions. Every unit ships behind the flag, updates BRANCH_STATUS.md, and carries documentation (README + touched docs) per the standing rule. No unit merges without the full pipeline (panel + Silo QA on the exact tip).

| # | Unit | Goal | Files (main) | Acceptance | Verification | Size |
|---|---|---|---|---|---|---|
| U1 | **Render pipeline** | Manifest schema + batch renderer + pitch gate + hash-staleness CI check | `scripts/detective/render-audio.mjs`, `scripts/detective/audio-manifest.ts`, `public/audio/detective/manifest.json` | One command renders a case end-to-end; stale-hash case fails CI | Pipeline run on case 137 reproduces the mockup's measured lines within gate | M |
| U2 | **Fixed lines + decode templates** | Render + gate the ~17 fixed assets (acks, suspicion, ask-next, Hook, instructions, win, amazement, 5 decodes) | `public/audio/detective/fixed/*` | All lines pass Q3 pitch/pace gates; "hushed" wording in docs | Batch report with per-line Hz/wpm; owner ear check on the batch | S |
| U3 | **Phase A clue renders** | All 550 Capitals-pack clue reads + 110 answer reads, gated | `public/audio/detective/case-*` | 100% manifest coverage for pack indexes 387–496 | Automated gate report + 5% human-ear sample | M |
| U4 | **Character rig (production)** | Both rigs as SVG components in approved colours; poses: read/think, ack, search, berth-think, celebrate (jump/high-five/clap), pout; glass hand-off | `src/game/loop/detective/DetectivePair.tsx`, `detective.css` | Poses read solo at 390 px on real satellite tiles (mockup sheet test) | Frame grabs vs mockup sheet; size budget ≤15 KB gz | M |
| U5 | **Stations + state machine + player** | Pair mounted in LoopScreen; Watson stations per clue; sequential speech queue; absence triggers as state | `detective-state.ts`, `detective-audio.ts`, `LoopScreen.tsx` (mount only) | Full clue ladder plays on a rendered case with correct order/timing; pair absent during sheet/rings/speech | Unit tests on the machine + `detective-stations.spec.ts` | M |
| U6 | **Waypoint companion** | Pause detection, berth solver, dock, gesture cancel, auto-kill | `companion.ts`, `DetectivePair.tsx` | Council Q2 geometry + timing numbers hold on touch + desktop | Clearance-trace E2E (0 violations) + absence ≤100 ms tests | L |
| U7 | **Selection handoff** | Name-read lookup (coverage tier), suspicion asset, ask-next at unlock | `detective-audio.ts`, names manifest | Covered pick → name + suspicion; uncovered pick → suspicion only; identical suspicion file hash asserted in test | `detective-stations.spec.ts` extension + manifest coverage report | M |
| U8 | **Endings** | Celebration (glass hand-off → jump → high-five → clap → win lines) + fail (answer read + pout hold) | `DetectivePair.tsx`, `detective-state.ts` | Both endings fire on the game's own reveal state; misses voiceless | `detective-endings.spec.ts` on seam cases (win in 2, fail in 5 — the mockup's proven paths) | M |
| U9 | **Degradation + flag wiring** | §2.5 matrix + `detectivePair` flag + settings interplay | `src/lib/flags.ts`, `public/flags.json`, detective modules | Every matrix row demonstrable; flag off = byte-identical game | `feature-flags.spec.ts` pattern + `detective.reduced.spec.ts` | S |
| U10 | **Gates pack** | Swap test, kill-criteria automation (K2/K3/K5), perf budget run (K4 protocol), docs | `tests/e2e/detective-swap.spec.ts`, perf script | §5 gates all green on the shipping tip | Gate report keyed by PR# + head_sha (Silo QA, independent) | M |
| U11 | **Phase B clue renders** (post-Phase-A ship) | 1,935 core-deck reads + 387 answer reads | `public/audio/detective/case-*` | 100% core coverage; same gates as U3 | Same as U3 | M |

**Order:** U1 → U2 → U4 → U5 → U6 → U7 → U8 → U9 → (U3 + U10 in parallel lanes) → Phase A ship decision → U11.
**Explicitly out of v1:** Cold Trail (Decision 3), debrief speech (Decision 4), per-case decodes (council-dismissed), runtime TTS (§1.5), any change to clue text or game balance.

---

## 4. OPEN DECISIONS — Veeresh, one word each

1. **Audio rollout:** Phase A Capitals 110 first, core 387 after gates (recommended) — or all 497 at once?
2. **Selection-name coverage:** top 1,201 places (population ≥ 500k, ≈ 31 MB) — approve, wider (≥100k, ≈ 162 MB), or narrower (≥1M, ≈ 15 MB)?
3. **Cold Trail:** the pair comes to Cold Trail in a later phase — or GeoDetective only, forever?
4. **Post-solve debrief** (Holmes's one real deduction speech, after the solve, council's home for all synthesis): in v1 — or later?
5. **Flag flip:** ship the flag OFF and flip after gates pass (recommended) — or ON from the first deploy?
6. **Speech default:** detective speech follows the existing read-aloud preference (always / sometimes / never — recommended, it's the kid's existing choice) — or always on when sound is on?

---

## 5. RISKS + KILL CRITERIA AS MEASURABLE BUILD GATES

**Risks (from the council, carried into the build):** R1 authority pressure (a famous detective pausing reads as endorsement to a 9-year-old — behavioural, the concept's deepest risk) · R2 attention capture / pointer-play (kids making Holmes chase instead of reading the map) · R3 gesture contention on weak phones (a second per-frame writer on the map surface) · R4 script-discipline decay (killed structurally: decodes are 5 templates, no per-case text exists) · R5 motor mirroring (killed structurally: pause-trigger only, no raw-jitter coupling).

**Kill criteria — pre-registered by the council; any ONE fires → the named surface stops, no tune-it-later:**

| Gate | Test | Threshold | Kills |
|---|---|---|---|
| K1 Misleading pause | A/B, n ≥ 24 children 8–10, touch tablet; scripted 800 ms Holmes pause at a wrong location | Guess shift toward it **> 5 points** vs control | The companion |
| K2 Occlusion | Automated trace audit, recorded pointer paths at 360×640 + 768×1024 | **Any single frame** violating §2.2 geometry | The companion |
| K3 Absence | Trigger suite (sheet, rings, pinch, speech, reveal) | Holmes visible **> 100 ms** after any trigger, any event | The companion |
| K4 Performance | Moto G Power (2022)/Galaxy A14 class, 10-min scripted session | Median FPS < 58 during pan+companion · p95 frame > 18 ms · any > 50 ms long task in companion code · heap +≥10 MB/10 min · any idle rAF with still pointer for 60 s · battery delta > 10% vs off | The companion (on that device class) |
| K5 Swap test | Identical pointer trace, answer swapped (§2.3) | **Any** frame-detectable behaviour difference, or blind raters above chance | The companion |
| K6 Agency | Child panel, unprompted | < 90% claim the guess as their own, or companion-caused revisions > 5% | Guessing-phase presence (clue-phase pair survives) |

K2, K3, K5 are automatable and run in U10 **before** any ship vote. K4 runs on the named device class in U10. K1 + K6 need a child panel — they gate the **flag flip** (Decision 5), not the dark merge: the feature can merge OFF, but it does not turn ON for kids until K1/K6 pass. That sequencing is part of this scope, not a footnote.

**Additional scope risks, stated plainly:** (a) 220 MB of audio is forever weight in the repo/deploy — accepted consciously in Decision 1, or phased in Decision 1's alternative. (b) Clue-text edits after rendering cost a re-render per changed line (hash gate makes it automatic, never silent). (c) The two cast voices are adult males; distinctness rests on the measured ≥20 Hz gap — the per-batch gate (§1.6.3) is what keeps that true at scale. (d) iOS Safari audio unlock: speech starts only after the first user gesture — the storyteller's first-gesture machinery (`src/components/storyteller-audio-guards.ts`) is the proven pattern U5 follows.

---

## Appendix — evidence index

- Council rulings + Q3 voice tables + kill criteria source: `~/workspace/meridian-detective-evidence/COUNCIL-holmes-watson.md`
- Approved mockup + audit harnesses (port sources for U10): `loop-realpage.mp4`, `loop-audit.py`, `loop-verify.py`, `waypoint-realpage-audit.py` in the evidence folder; harness code in `prototype/` on this branch
- Voice production method: `~/workspace/meridian-voice-spec/SPEC.md`
- Codebase anchors cited inline: `public/loop/manifest.json`, `public/packs/capitals/manifest.json`, `public/loop/names.v2.json`, `src/game/loop/{LoopScreen,LoopMap,types,day}.ts(x)`, `src/lib/flags.ts`, `src/components/{card-film,storyteller-lines,storyteller-audio-guards}.ts(x)`, `src/game/audio/play-guards.ts`, `src/game/age-profile/read-aloud-pref.ts`, `src/components/age-profile/ReadAloudButton.tsx`, `src/components/grandpa-ask.ts`
