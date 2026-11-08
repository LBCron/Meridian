# BRANCH_STATUS — feat/journal-movies

**Branch:** `feat/journal-movies` · **Base:** `origin/main` @ `9e49da3e` (#365)
**Owner order:** 2026-11-07 — "Build all journals" (Old Faithful pilot approved)
**Status:** BUILDING — 105/106 clips VERIFIED + LIVE (incl. pilot). Batches 01,
02, 03, 04, 05, 07, 08, 09, 10, 11, 12 complete; batch 06 is 8/9 with the
archway mix-only follow-up running. 1 clip left: archway (hold overturned
— see below; mix in flight, no video call needed).

## Done
- [x] 2026-11-08 — Branch created from origin/main 9e49da3e; worktree
      `~/workspace/journal-movies-work` (clean checkout).
- [x] 2026-11-08 — `docs/journal-movies.md` (plan + pilot recipe + storage
      decision + batch table) and `public/videos/journal-manifest.json`
      (pilot entry, version 1).
- [x] 2026-11-08 — 12 worker subagents spawned in parallel (3 sets each,
      9 clips each; batch 08 has 8 new + pilot skipped; batch 12 has 7).
      Staging: `~/workspace/journal-movies-batches/batch-NN/`.
- [x] 2026-11-08 — Media repo `veeresh-bikkaneti/meridian-media` created,
      Pages enabled, pilot v4 uploaded byte-identical (sha256 5a985e28…);
      URL verified 200, 5,664,273 bytes, valid MP4.
- [x] 2026-11-08 — **Batch 01, sets 1–2: 6 clips coordinator-verified and
      LIVE** (meridian-media `488329d`, manifest v1+6 entries):
      capitol (magnus), memorial-stadium (briggs), haymarket (casper,
      still+narration FALLBACK — AI video failed no-text gate),
      pinnacle (vdc_2561), 27th-and-o (miles, bad-fit flag),
      centennial-mall (vdc_NOID19). Independent checks: ffprobe 10.000 s /
      1152x768 / 24 fps / h264+AAC, full decode exit 0, frames viewed
      (faithful, no text), audio re-measured (peaks −1.5 dB, means match
      worker to 0.1 dB, no clipping). Bed-30% per worker measurement
      (NOTES.md). Not verified by ear — owner's listen is the final check.
- [x] 2026-11-08 — Batch 01 follow-up worker spawned (set 3: sunken-gardens,
      childrens-zoo, 48th-and-o + 1 haymarket regen attempt, 4 video calls).
- [x] 2026-11-08 — **Batch 04: 9/9 coordinator-verified and LIVE**
      (meridian-media `4d35706`): woods-park, conestoga, branched-oak,
      mahoney, sac-museum, seward, homestead, pawnee-lake, platte-river-sp.
      The 6-video cap did NOT block this batch (all 9 generations
      succeeded). Flags in manifest (homestead dusk fade + gentle-motion,
      platte-river-sp gentle-motion + 0.74 s window, mahoney hard cut,
      seward sky-only settle, sac-museum close-up style drift,
      branched-oak pink pennants, woods-park crowd drift).
- [x] 2026-11-08 — **Batch 03: 3/6 delivered clips coordinator-verified
      and LIVE** (hyde, near-south, robbers-cave). **HELD, not shipped:**
      university-place (readable text "heritage" on the destination board
      — hard gate fail, confirmed in frame), havelock (invented rooster),
      southpointe (palette does not hold — saturated sunset, pilot-v1
      failure mode + fence bird). 3 unbuilt (college-view video failed,
      star-city-shores + quilt-museum capped). Follow-up spawned: 3 builds
      + 3 regens (6 calls, priority-ordered).
- [x] 2026-11-08 — **Batch 11: 5/6 delivered clips coordinator-verified
      and LIVE** (machu, fuji, chichen, stonehenge, petra). **HELD:**
      neuschwanstein (invented rooster standing on the lake ~6 s + faint
      ghost castle at 2 s). 3 unbuilt (angkor video failed on a bad path,
      table-mountain + uluru capped). Follow-up spawned: 3 builds + 1 regen.
- [x] 2026-11-08 — Independent verification of all 21 batch-03/04/11
      clips: ffprobe 10.000 s / 1152x768 / 24 fps / h264+AAC, full decode
      exit 0, audio re-measured (means match workers; peaks −1.0 to
      −1.6 dB, 0 clipped), 10 frames viewed by the coordinator
      (holds confirmed in-frame; flags confirmed). Bed-30% per worker
      measurement (NOTES.md). Not verified by ear — owner's listen is
      the final check.
- [x] 2026-11-08 — **Batch 01 follow-up DONE: set 3 verified + LIVE**
      (sunken-gardens vdc_5723, childrens-zoo casper, 48th-and-o magnus
      with bad-fit flag). **Haymarket regen FAILED the no-text gate a
      2nd time** (clock gains hands/numerals at 6/9.5 s despite the
      blank-clock prompt); fallback NOT overwritten and stands as the
      shipped version. A 3rd attempt would need a different approach
      (no clock tower in frame). Batch 01 is now 9/9 complete.
- [x] 2026-11-08 — **Batches 02, 05, 06, 07, 08, 09 landed; 40 clips
      coordinator-verified and LIVE** (meridian-media push in flight):
      02: pioneers-park, wilderness-park, antelope-park, oak-lake,
      lincoln-airport, union-plaza (6); 05: all 9; 06: old-market,
      scotts-bluff, durham, carhenge (4); 07: all 6; 08: all 6;
      09: all 6. Independent checks: ffprobe/decode/audio re-measured
      on all 48 (means match workers; peaks −0.9 to −1.6 dB, 0 clipped),
      8 decision frames viewed by the coordinator. Bed-30% per worker
      measurement. Not verified by ear — owner's listen is the final check.
- [x] 2026-11-08 — Follow-ups spawned for 02 (3 AI regens), 06 (5 regens),
      07 (3 builds), 08 (2 builds), 09 (3 builds). Batches 03 + 11
      follow-ups already running. Batches 10 + 12 still running.
- [x] 2026-11-08 — **Batch 10: 9/9 coordinator-verified and LIVE**
      (eiffel, colosseum, liberty, taj, opera-house, redeemer, sagrada,
      giza, cn-tower). Video take 1 was rejected for ALL 9 (camera zoomed
      into photoreal close-ups, invented pigeons, pseudo-text glyphs,
      statue cropped out) and re-shot with a style-lock prompt (camera
      NEVER moves, framing/style/palette NEVER change); take 2 held the
      wide watercolor shot on all 9 — confirmed at 6 s in-frame
      (colosseum, redeemer, eiffel). All 9 are static landmarks, flagged
      gentle-motion bad fits; key moment is a light change or a small
      vehicle (train, ferry, camels). Peaks −1.2 to −1.6 dB, decode 0.
      Bed-30% per worker measurement. Not verified by ear.
- [x] 2026-11-08 — **Batch 12: 5/6 coordinator-verified and LIVE**
      (victoria-falls, fushimi, iguazu, tongariki, timbuktu). **HELD:**
      potala — the model re-interpreted the palace mid-clip as a different
      golden-roofed temple with Buddha statues flanking the door,
      confirmed in-frame at 6 s + 9.5 s. Tongariki ships flagged (settle
      frame pushes to a ~6-moai close-up, fifteen-in-a-row composition
      lost; reddish caps not in source art). Peaks −1.3 to −1.6 dB,
      decode 0. Bed-30% per worker measurement. Not verified by ear.
      Follow-up spawned: galapagos build (1 call, staged) + potala
      locked-wide regen reusing TTS.
- [x] 2026-11-08 — **Batch 03 follow-up DONE: 4 more clips verified +
      LIVE** (college-view, quilt-museum, havelock v2, southpointe v2).
      Havelock v2: rooster gone, confirmed in-frame at 6 s. Southpointe
      v2: intra-clip palette constant, no fence bird (v1 failure mode
      gone); caveat — framed warmer/closer than the keyframe. Batch 03
      now 7 LIVE. **Still HELD:** university-place (v2 board still not
      blank — 2nd failed regen). **Still pending:** star-city-shores
      (video call failed, not retried). Follow-up #2 spawned: 1 fresh
      star-city-shores call + university-place still+narration fallback
      (haymarket precedent — no 3rd regen).
- [x] 2026-11-08 — **Batch 11 follow-up DONE: 9/9 complete.** Neuschwanstein
      v2 PASSES — rooster + ghost castle gone, swans only, one castle,
      confirmed in-frame at 6 s. Angkor, table-mountain, uluru built.
      Peaks −1.4 to −1.5 dB, decode 0. Bed-30% per worker measurement.
      Not verified by ear.
- [x] 2026-11-08 — **Batch 08 follow-up DONE: 8/8 complete.** Niagara +
      alamo built, both flagged (niagara: Horseshoe Falls leaves frame
      from ~6 s; alamo: heavy zoom, closing line plays over a facade-only
      shot with no garden visible). Peaks −1.0/−1.5 dB, decode 0.
      Bed-30% per worker measurement. Not verified by ear.
- [x] 2026-11-08 — **Batch 07 follow-up DONE: 9/9 complete.** Chadron,
      niobrara, white-house built (vdc_5723 / briggs / vdc_2561). White-house
      ships flagged: near-static after 4 s (motion diffs ~2), fountain arc
      compressed — option (b) still+narration only remains open. Niobrara
      flagged (6/9.5 s drift toward photorealism). Peaks −1.0 dB, decode 0.
      Bed-30% per worker measurement. Not verified by ear.
- [x] 2026-11-08 — **Batch 02 follow-up DONE: 9/9 complete.** Holmes-lake,
      wyuka, gateway regens replace the held ffmpeg-only v1s — real bed at
      0.30 (gaps were −91.0 dB silent, now −46.6 to −47.8 dB). Gateway take 1
      rejected (invented pseudo-text signage); take 2 blank, no text.
      Wyuka flagged (headstone leaves frame, bird count varies 4→3→4);
      gateway flagged (one awning green instead of striped). Peaks −1.4/−1.5
      dB, decode 0. Bed-30% per worker measurement. Not verified by ear.
- [x] 2026-11-08 — **Batch 09 follow-up DONE: 9/9 complete.** Everglades,
      death-valley, hoover built. Everglades: heron visibly lifts off at 6 s
      (fallback line not needed), confirmed in-frame. Hoover: v1 rejected
      (invented waterfall through the arch), v2 rejected (bypass bridge as
      hero); v3 locked-camera holds, no waterfall, dam is the hero —
      confirmed in-frame at 6 s. Everglades peak −0.9 dB by volumedetect
      (−1.01 dB by the worker's measure; headroom either way, no clipping).
      Bed-30% per worker measurement. Not verified by ear.
- [x] 2026-11-08 — **Batch 06 follow-up DONE: 4 of 5 regens swapped.**
      Kingsley (spillway in full rush at 6 s), smith-falls (full wide flow
      with mist, child pointing), fort-robinson (flag raises, full at 9.5 s),
      chimney-rock (spire in frame at 2/6/9.5 s) — all four defects fixed,
      confirmed in-frame. Batch 06 now 8/9. **Archway NOT swapped by the
      worker** (its replace gate demanded exactly one wagon; the regen
      shows two) — see Held below: the coordinator overturned that hold.
      Peaks −1.0 dB, decode 0. Bed-30% per worker measurement.
      Not verified by ear.
- [x] 2026-11-08 — **Batch 12 follow-up DONE: 7/7 complete.** Galapagos
      built (tortoises + iguanas, real visible verb; minor flag: dark
      animals resting on the dock at 6/9.5 s). Potala v2 PASSES — the
      white-and-red palace mass on the hill holds at 2/6/9.5 s, confirmed
      in-frame at 6 s; v1's golden-temple reinterpretation gone. Voice-free
      window 2.10 s, as in the pilot. Peaks −1.4/−1.5 dB, decode 0.
      Bed-30% per worker measurement. Not verified by ear.
- [x] 2026-11-08 — **Batch 03 follow-up #2 DONE: 9/9 complete.**
      Star-city-shores built (fresh call, not a repeat of the failed one),
      flagged: tight near-photoreal close-up of two slides over one pool;
      the keyframe's wide watercolor aerial layout is gone — same failure
      mode as hyde; re-render option recorded. University-place ships as a
      still+narration FALLBACK (haymarket precedent, no 3rd regen): source
      still held 10 s with existing Casper narration + v1 audio bed at 0.30,
      peak −1.01 dB, no text possible. Batch 03 now 9/9.

## Video cap (discovered 2026-11-08, affects every batch)
The media pipeline allows at most **6 successful videos per agent
message**, even when the task asks for more. Batch 01 used all 6 on sets
1–2; set 3 was unbuilt. Every batch will need a follow-up run for its
last 3 clips (batch 08: last 2; batch 12: last 1) — ~24 worker runs total
instead of 12. Follow-up spawns are new messages, so each gets a fresh
6-video budget. **Exception observed 2026-11-08: batch 04 delivered 9/9
in one run — all 9 generations succeeded, cap did not block.** The cap
is enforced per run, not per batch; do not assume it.

## Held clips (gate failures — do not ship as-is)
- archway (batch 06): the regen was NOT swapped by the follow-up worker
  because its 9.5 s frame shows TWO wagons and the replace gate demanded
  exactly one. **Coordinator overturn (2026-11-08): the hold was a misread.**
  The calm keyframe itself contains two wagons — a white-covered wagon on
  the left and an open wagon centre-right — and the regen shows the SAME two
  wagons in the same positions, with the bridge + highway + cars in frame
  (v1's interior dive fixed). The two wagons are the source art's own
  exhibits, not a model duplication. Mix-only follow-up spawned (no video
  call): mix the existing regen raw with existing TTS, verify, swap in.
  The held v1 stays at `work/held-original-archway.mp4` until the swap.
- haymarket (batch 01) ships as a flagged still+narration FALLBACK
  (AI video failed the no-text gate TWICE); a 3rd attempt would need a
  different approach (no clock tower in frame).
- university-place (batch 03) ships as a flagged still+narration FALLBACK
  (v1 + v2 both failed the no-text gate); see Done above.

## Resolved holds (were held, now live — record kept here)
- havelock, southpointe (batch 03): v2 regens passed, live.
- neuschwanstein (batch 11): v2 regen passed, live.
- holmes-lake, wyuka, gateway (batch 02): v2 AI regens with real bed, live.
- kingsley, smith-falls, fort-robinson, chimney-rock (batch 06): v2 regens
  with real bed + visible payoffs, live.
- potala (batch 12): v2 locked-wide regen, palace holds, live.

## Storage decision (recorded in docs/journal-movies.md)
Movies do NOT live in this repo (~600 MB would quadruple git objects and
push Pages toward the 1 GB cap). Separate repo `veeresh-bikkaneti/meridian-media`
with its own GitHub Pages; app lazy-loads by URL on entry open. Manifest
here maps entry id → URL. R2 is the better long-term host but needs owner
provisioning; media repo needs none.

## Pending
- [ ] Create `veeresh-bikkaneti/meridian-media` repo + Pages; upload pilot
      v4 unchanged as `old-faithful.mp4`; verify URL serves. — DONE 2026-11-08
      (repo created, Pages on, pilot live; see Done above).
- [ ] Verify each batch as it lands (ffprobe/decode/frames/audio/no-text),
      upload to meridian-media, update manifest, commit + push progressively.
- [ ] Report first completed batch to owner promptly; keep reporting per batch.
- [ ] Gates before PR: `npx tsc --noEmit`, `npm test`, `node scripts/lint-cards.mjs`,
      `npm run build:pages`, Playwright E2E (sequential, under `flock` lock).
      NOT RUN yet — no PR opened; gates run when the branch is PR-ready.

## Never
- Never merge — merge word stays the owner's, per PR, per head.
- Never rebuild the pilot. Never bundle all 106 into the app (lazy-load only).
- No ear-verification here — owner's listen is the final check per clip.
