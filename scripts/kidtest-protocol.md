# Kid test protocol — the painted Holmes & Watson gate

This is the human half of the character re-skin gate. Read it top to
bottom before you run a session. It takes about 10 minutes to read.

**What this test decides:** whether the new painted Holmes & Watson
art is allowed to replace the current pair in the game. It is a
go / no-go gate. If the art fails, it does not ship — there is no
"close enough" and no second vote. The full test runs once, at PR D
(the flip). PR A only smoke-runs the automatic measures.

**What is automatic and what is human:**

- A computer measures figure size, face size, and whether a figure
  ever covers clue text. That lives in
  `tests/e2e/pair-art-kidtest.spec.ts` and `scripts/kidtest-smoke.mjs`.
- Children measure everything else: can they **find** Holmes fast,
  can they **tell Holmes apart** from the other characters, and can
  they **read his face**. No adult guesses these answers for them,
  and no script fakes them.

---

## 1. Who takes part

- **30 children per cell family** (see "cells" below).
- **Ages 6–12.** Aim for a spread: about 10 children aged 6–8, 10
  aged 9–10, and 10 aged 11–12.
- Children who play games on a phone or tablet at least sometimes.
  They do **not** need to know Meridian or Sherlock Holmes.
- A parent or guardian says yes first, in writing. The child can stop
  at any time, for any reason, and stopping is never counted as a
  failure.
- One adult runs the session (the "runner"). If a second adult can
  score independently, even better — disagreements get written down,
  not argued away.

## 2. The cells

Every child is tested in **cells**. A cell is one screen width × one
background:

| Widths | Backgrounds |
| --- | --- |
| 390 px (small phone) | The real game map |
| 768 px (tablet) | The real game page |
| 1280 px (laptop) | The static block (the simple still picture shown on low-memory devices) |
| 1920 px (big screen) | |

That is 4 × 3 = **12 cells**. The gate must pass in **every** cell.
One bad cell fails the gate — a size that works on a laptop but hides
Holmes on a small phone is a fail, full stop.

**Figure sizes per width** (the harness renders the biggest size in
the band — the hardest case for covering text):

| Width | Figure height | Face at least |
| --- | --- | --- |
| 390 | 112–128 px | 38 px |
| 768 | 128–144 px | 44 px |
| 1280 | 144–160 px | 48 px |
| 1920 | 160–176 px | 52 px |

## 3. What you need before a session

1. The trial manifest from the harness:
   `test-results/pair-art-kidtest/trial-manifest.json`. It lists every
   trial screen, which picture goes where, and the right answer for
   each one. If a trial says `blocked-missing-plate`, that picture is
   not ready — do not improvise a substitute; note it and move on.
2. The device (or browser window) set to the exact width of the cell
   you are running.
3. A stopwatch or phone timer for the find trials.
4. A printed scoring sheet per child (section 6), or the same table
   in a notes file.
5. A quiet room, normal indoor light. No hints on the walls, no other
   Meridian pictures open.

## 4. The three trials

Run them in this order for each cell: **find**, then **identity**,
then **expression**. Use the screens the manifest names — one figure
per find screen, placed where the manifest says.

### Trial 1 — Find Holmes

1. Show the screen. Holmes is somewhere on it, at one of the normal
   spots beside the map.
2. Ask, exactly: **"Where is Holmes?"**
3. Start the timer when you finish the question.
4. The child taps where they think Holmes is.
5. Stop the timer at the tap.
6. Score it:
   - **Pass** — the tap lands on Holmes **within 2 seconds**.
   - **Miss** — the tap lands anywhere else, or lands after 2 seconds.
7. No hints, no "look again", no pointing. One try per screen.

### Trial 2 — Identity

1. Show the screen with four characters side by side, in the order
   the manifest gives: **Holmes, Watson, the Cold Trail tracker, and
   Jolly**, shuffled.
2. Ask, exactly: **"Which one is Holmes?"**
3. The child taps one character.
4. Score it:
   - **Pass** — they tap Holmes.
   - **Miss** — they tap anyone else. **Write down who they tapped.**
     A miss where the child picked the tracker or Jolly is a
     "confusion" miss — these are counted separately at scoring time,
     because look-alike characters are exactly the failure this trial
     exists to catch.

### Trial 3 — Expression

1. Show one big Holmes face (a face plate from the manifest).
2. Ask, exactly: **"How does Holmes feel?"** and read out the choices
   on the manifest (the delivered face plates are named for the
   feelings they show — for example: delighted, thinking, surprised,
   neutral).
3. The child picks one feeling — by tapping it or saying it.
4. Score it:
   - **Pass** — they pick the feeling the manifest names.
   - **Miss** — any other feeling. Write down what they picked.

## 5. Running the session

1. Welcome the child. Say: "We're testing some new pictures for a
   game. There are no wrong answers about *you* — if a picture is
   hard to find, that's the picture's fault, not yours."
2. One practice screen first (any picture, not scored) so the child
   knows tapping is how they answer.
3. Run the cells in the order on the scoring sheet. Short breaks are
   fine. A full set of 12 cells × 3 trials is long for a 6-year-old —
   it is fine to split a child's cells across two sittings, as long
   as the sheet shows which cells were finished.
4. Never coach. If the child asks "is that him?", say: "Pick the one
   you think." Write down that they asked.
5. Thank the child whatever the scores are.

## 6. Scoring sheet (one per child)

Copy this table. One row per trial.

| Field | What to write |
| --- | --- |
| Child code | e.g. `K01` — a code, never the child's name |
| Age band | `6–8`, `9–10`, or `11–12` |
| Cell | e.g. `390-map` (width-background) |
| Trial | `find`, `identity`, or `expression` |
| Time (find only) | Seconds to the tap, to one decimal place |
| Answer | Who/what they tapped or picked |
| Result | `pass` or `miss` |
| Notes | Anything they said, asked, or hesitated over |

## 7. The pass / fail lines (exact)

Count the passes per cell. 30 children take each trial in each cell.

| Trial | Pass line | Kill line |
| --- | --- | --- |
| Find Holmes | **27/30 or more**, in ≤2 s, in **every** cell | **25/30 or fewer in any one cell kills the art** (26/30 also fails the gate — it is below the pass line — and the art goes back for fixes, not live) |
| Identity | **27/30 or more** in every cell | More than **3/30 confusion** with the tracker or Jolly in any cell fails the gate |
| Expression | **26/30 or more** in every cell | Below 26/30 in any cell fails the gate |
| Clue-text coverage | **0 px²** at the biggest in-band size (automatic measure) | Any coverage at all fails the gate |

If the gate fails: the `pairArt` flag stays off, the current pair
stays in the game, and the scores go into the results file so the
next art round knows exactly what to fix.

## 8. Recording the results

Results live in **`docs/pair-art/KIDTEST_RESULTS.md`** — that file,
not chat messages and not the trial manifest.

1. After each sitting, copy the scoring sheets into the results
   file's raw table (one row per trial, same fields as section 6).
   Use child codes only — **never a child's name or photo**.
2. When a cell is complete (30 children), fill in its summary row:
   passes out of 30 for find, identity, and expression, plus the
   confusion count for identity.
3. Write the verdict per cell in plain words: `PASS` or `FAIL`, and
   if `FAIL`, which line it crossed.
4. The final verdict for the whole gate goes at the top of the file:
   **GO** only if every cell passed **and** the automatic measures
   (size, face, zero coverage) passed at every width. Otherwise
   **NO-GO**, with the failing cells listed.
5. Commit the results file on the PR D branch. The numbers in the
   file are the numbers that were counted from the sheets — if a
   sheet is lost or a count is unsure, write that down next to the
   number instead of tidying it up.
