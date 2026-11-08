# BRANCH_STATUS — feat/journal-movies

**Branch:** `feat/journal-movies` · **Base:** `origin/main` @ `9e49da3e` (#365)
**Owner order:** 2026-11-07 — "Build all journals" (Old Faithful pilot approved)
**Status:** BUILDING — 64/106 clips VERIFIED + LIVE (incl. pilot). Batches 01
(9/9), 02 (6), 03 (3), 04 (9/9), 05 (9/9), 06 (4), 07 (6), 08 (6), 09 (6),
11 (5) shipped; 12 clips HELD for regen (see below). Batches 10, 12 still
running; follow-ups in flight for 02, 03, 06, 07, 08, 09, 11.

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

## Video cap (discovered 2026-11-08, affects every batch)
The media pipeline allows at most **6 successful videos per agent
message**, even when the task asks for more. Batch 01 used all 6 on sets
1–2; set 3 was unbuilt. Every batch will need a follow-up run for its
last 3 clips (batch 08: last 2; batch 12: last 1) — ~24 worker runs total
instead of 12. Follow-up spawns are new messages, so each gets a fresh
6-video budget. **Exception observed 2026-11-08: batch 04 delivered 9/9
in one run — all 9 generations succeeded, cap did not block.** The cap
is enforced per run, not per batch; do not assume it.

## Held clips (gate failures — regens in flight, do not ship as-is)
- university-place (batch 03): readable text "heritage" on the
  destination board at 6 s + 9.5 s — hard no-text gate fail.
- havelock (batch 03): invented rooster by the lamp post/barrel.
- southpointe (batch 03): palette does not hold (saturated golden
  sunset, pilot-v1 failure mode) + small bird on the fence.
- neuschwanstein (batch 11): invented rooster standing on the lake
  ~6 s + faint ghost-castle silhouette at 2 s.
- holmes-lake, wyuka, gateway (batch 02): ffmpeg Ken Burns only, NO bed
  audio — voice-free gaps measure −91.0 dB silent. Bed is a load-bearing
  recipe element; held for AI-video regen.
- kingsley, smith-falls, fort-robinson (batch 06): ffmpeg-only, NO bed;
  and the payoff has no visible payoff (spillway out of frame / falls
  stay a thin trickle / static post).
- chimney-rock (batch 06): spire cropped out of frame at the 6 s payoff
  while L3 says "There it stands".
- archway (batch 06): wagon exhibit duplicated (TWICE) in the 9.5 s
  settle frame + mid-clip interior dive loses the bridge hero.
- haymarket (batch 01) ships as a flagged still+narration FALLBACK
  (AI video failed the no-text gate TWICE); a 3rd attempt would need a
  different approach (no clock tower in frame).

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
