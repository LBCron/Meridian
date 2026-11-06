import json, math, sys

EV = "/home/hatch/workspace/meridian-detective-evidence"
trace = json.load(open(EV + "/stations-realpage-trace.json"))
cues = json.load(open(EV + "/stations-cues.json"))

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

fails = []
seen = {}
for s in trace:
    if s["state"] not in seen:
        seen[s["state"]] = s["t"]
print("STATE TIMELINE (first occurrence, show s):")
for st, t in seen.items():
    print(f"  {st:10s} {t:6.2f}")

# --- Holmes: zero overlap with the fingertip, clearances hold ---
groups = {}
for s in trace:
    if not s["fvis"]:
        continue
    fx, fy = s["f"]
    if inside(fx, fy, s["h"]):
        fails.append(f"t={s['t']:.2f} state={s['state']}: fingertip INSIDE Holmes box")
    groups.setdefault(s["state"], []).append(box_dist(fx, fy, s["h"]))
print("\nMIN fingertip->Holmes-box distance by state (px):")
for st, ds in groups.items():
    print(f"  {st:10s} min {min(ds):6.1f}  (n={len(ds)})")
for st in ("thinkA", "thinkB"):
    ds = groups.get(st, [])
    if not ds:
        fails.append(f"no visible-finger samples in {st}")
    elif min(ds) < 50:
        fails.append(f"{st} min clearance {min(ds):.1f} < 50")

# --- Holmes: sheet absence ---
sheet_samples = [s for s in trace if s["sheet"]]
if not sheet_samples:
    fails.append("no sheet-open samples found")
else:
    bad = [s for s in sheet_samples if not s["habsent"]]
    if bad:
        fails.append(f"{len(bad)} sheet-open samples with Holmes NOT absent")
    print(f"\nSheet open span: {sheet_samples[0]['t']:.2f}..{sheet_samples[-1]['t']:.2f}s, "
          f"{len(sheet_samples)} samples, Holmes absent in all: {not bad}")

for p, w in (("pauseA", "walk1"), ("pauseB", "walk2")):
    if p in seen and w in seen:
        print(f"{p} -> {w} latency: {seen[w]-seen[p]:.2f}s (design 0.60)")

# --- Watson: at his station, never over the question's text ---
w0 = trace[len(trace) // 2]["w"]
card0 = trace[len(trace) // 2]["card"]
print(f"\nWatson box (viewport): {w0}; clue card: {card0}")
bad_station = 0
bad_text = 0
for s in trace:
    wx, wy, ww, wh = s["w"]
    cx, cy, cw, ch = s["card"]
    # feet on the card's top edge (within 6 px) + box within the card's span
    if abs((wy + wh) - cy) > 6 or wx < cx - 4 or wx + ww > cx + cw + 4:
        bad_station += 1
    if overlap(s["w"], s["qtext"]):
        bad_text += 1
if bad_station:
    fails.append(f"Watson off-station in {bad_station}/{len(trace)} samples")
if bad_text:
    fails.append(f"Watson overlaps the clue TEXT in {bad_text}/{len(trace)} samples")
print(f"Watson at-station samples: {len(trace)-bad_station}/{len(trace)}; "
      f"clue-text overlap samples: {bad_text}")

# --- Watson speaking only during the read window ---
speaking = [s for s in trace if s["wspeak"]]
if not speaking:
    fails.append("Watson never in speaking state")
else:
    span = (speaking[0]["t"], speaking[-1]["t"])
    print(f"Watson speaking span (trace s): {span[0]:.2f}..{span[1]:.2f} "
          f"(cue A wall-logged at {cues.get('watsonLine', -1):.2f} trimmed s; render 8.95 s)")
    if not (7.0 < span[1] - span[0] < 10.5):
        fails.append(f"Watson speaking span {span[1]-span[0]:.2f}s off the 8.95 s render")

print("\n" + ("AUDIT: PASS — zero Holmes/finger overlap, clearances hold, sheet absence total, "
              "Watson at the question throughout, never over its text"
              if not fails else "AUDIT: FAIL"))
for f in fails:
    print("  FAIL:", f)
sys.exit(1 if fails else 0)
