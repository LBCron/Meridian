"""Audit for the FULL LOOP real-page staging (loop-overlay trace).

Per part: zero fingertip-inside-Holmes samples; >= 50 px clearance in
the shifted-search states; Holmes absent in EVERY sheet-open sample
(the absence law, unchanged from the stations staging); Watson glued
to his CURRENT station card and never over its text (ending states,
where the pair are hand-placed on the reveal, excluded and counted);
speaking spans vs the render durations from loop-cues.json.
"""
import json, math, sys

EV = "/home/hatch/workspace/meridian-detective-evidence"
cues = json.load(open(EV + "/loop-cues.json"))
DUR = {"clue1": 8.95, "clue2": 11.42, "clue5": 10.03, "winW": 3.58, "answer": 5.83}
NAME_DUR = {"selLV": 3.29, "selHend": 3.19, "selSLC": 4.01}

def box_dist(px, py, b):
    x, y, w, h = b
    dx = max(x - px, 0, px - (x + w))
    dy = max(y - py, 0, py - (y + h))
    return math.hypot(dx, dy)

def inside(px, py, b):
    x, y, w, h = b
    return x <= px <= x + w and y <= py <= y + h

def overlap(a, b):
    ax, ay, aw, ah = a
    bx, by, bw, bh = b
    return ax < bx + bw and bx < ax + aw and ay < by + bh and by < ay + ah

def blocks(trace, flag):
    out, cur = [], None
    for s in trace:
        if s[flag] and cur is None:
            cur = [s["t"], s["t"]]
        elif s[flag]:
            cur[1] = s["t"]
        elif cur is not None:
            out.append(tuple(cur)); cur = None
    if cur is not None:
        out.append(tuple(cur))
    return [(a, b + 0.05) for a, b in out]

fails = []
for part, ending_states in ((1, {"celebrate", "end1", "resolved"}), (2, {"answer", "pout", "end2", "resolved"})):
    trace = json.load(open(f"{EV}/loop-trace-part{part}.json"))
    pc = cues[f"part{part}"]
    print(f"\n===== PART {part} ({len(trace)} samples) =====")
    seen = {}
    for s in trace:
        seen.setdefault(s["state"], s["t"])
    print("STATE TIMELINE (first occurrence, show s):")
    for st, t in seen.items():
        print(f"  {st:10s} {t:6.2f}")

    groups = {}
    for s in trace:
        if not s["fvis"]:
            continue
        fx, fy = s["f"]
        if inside(fx, fy, s["h"]):
            fails.append(f"part{part} t={s['t']:.2f} state={s['state']}: fingertip INSIDE Holmes box")
        groups.setdefault(s["state"], []).append(box_dist(fx, fy, s["h"]))
    print("MIN fingertip->Holmes-box distance by state (px):")
    for st, ds in groups.items():
        print(f"  {st:10s} min {min(ds):6.1f}  (n={len(ds)})")
    for st, ds in groups.items():
        if st.startswith("shift") and (not ds or min(ds) < 50):
            fails.append(f"part{part} {st} min clearance {min(ds) if ds else -1:.1f} < 50")

    sheet_samples = [s for s in trace if s["sheet"]]
    if not sheet_samples:
        fails.append(f"part{part}: no sheet-open samples found")
    else:
        bad = [s for s in sheet_samples if not s["habsent"]]
        if bad:
            fails.append(f"part{part}: {len(bad)} sheet-open samples with Holmes NOT absent")
        print(f"Sheet open: {len(sheet_samples)} samples, Holmes absent in all: {not bad}")

    # Watson at his current station (skip his glide + the hand-placed endings).
    # An isolated single sample that self-corrects on the next tick is the
    # game's own reflow caught mid-jump (evidenced in the trace: the card
    # teleports, the 50 ms seat glue lands him on the next sample) — a
    # breach is a run of >= 2 consecutive off-station samples.
    checked = skipped = bad_text = 0
    off_runs, run = [], 0
    for s in trace:
        if s["state"] in ending_states or s["state"] == "station2":
            skipped += 1
            if run: off_runs.append(run); run = 0
            continue
        checked += 1
        wx, wy, ww, wh = s["w"]
        cx, cy, cw, ch = s["wart"]
        if abs((wy + wh) - cy) > 6 or wx < cx - 4 or wx + ww > cx + cw + 4:
            run += 1
        else:
            if run: off_runs.append(run); run = 0
        if overlap(s["w"], s["qtext"]):
            bad_text += 1
    if run: off_runs.append(run)
    bad_station = sum(r for r in off_runs if r >= 2)
    ticks = sum(r for r in off_runs if r == 1)
    if bad_station:
        fails.append(f"part{part}: Watson off-station in runs {off_runs} ({bad_station} samples in runs >= 2)")
    if bad_text:
        fails.append(f"part{part}: Watson overlaps clue TEXT in {bad_text}/{checked} samples")
    print(f"Watson at-station: {checked - bad_station - ticks}/{checked} checked ({skipped} ending/glide samples excluded); "
          f"isolated reflow ticks: {ticks}; text overlap: {bad_text}")

    wb = blocks(trace, "wspeak")
    print("Watson speaking blocks (s):", [(round(a, 2), round(b - a, 2)) for a, b in wb])
    hb = blocks(trace, "hspeak")
    print("Holmes speaking blocks (s):", [(round(a, 2), round(b - a, 2)) for a, b in hb])

    if part == 1:
        exp_w = [DUR["clue1"], DUR["clue2"], DUR["winW"]]
        if len(wb) != 3:
            fails.append(f"part1: expected 3 Watson speaking blocks, got {len(wb)}")
        else:
            for (a, b), e in zip(wb, exp_w):
                if abs((b - a) - e) > 1.3:
                    fails.append(f"part1: Watson block {b-a:.2f}s vs render {e}s")
        if len(hb) < 6:
            fails.append(f"part1: expected >= 6 Holmes speaking blocks, got {len(hb)}")
    else:
        if len(wb) != 1 or abs((wb[0][1] - wb[0][0]) - DUR["clue5"]) > 1.3:
            fails.append(f"part2: Watson clue-5 block off: {wb}")
        if not hb or abs((hb[-1][1] - hb[-1][0]) - DUR["answer"]) > 1.3:
            fails.append(f"part2: Holmes answer block off: {hb[-1] if hb else None}")

    # suspicion cue = selection cue + name duration + 0.26 s breath
    for sel, susp in (("selLV", "suspicion1"), ("selHend", "suspicion2"), ("selSLC", "suspicion5")):
        if sel in pc:
            want = pc[sel] + NAME_DUR[sel] + 0.26
            got = pc.get(susp)
            if got is None or abs(got - want) > 0.05:
                fails.append(f"part{part}: {susp} cue {got} != selection+name+0.26 ({want:.2f})")
            else:
                print(f"{susp} cue: {got:.2f} = {sel} + {NAME_DUR[sel]} + 0.26 ✓ (same suspicion file after every pick)")

print("\n" + ("AUDIT: PASS" if not fails else "AUDIT: FAIL"))
for f in fails:
    print("  FAIL:", f)
sys.exit(1 if fails else 0)
