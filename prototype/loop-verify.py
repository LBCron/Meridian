"""Final-video verification for the FULL LOOP mockup.

- Speech windows: RMS of the final mp4 inside every cue window must
  be clearly audible; sampled mid-beat gaps must be silent.
- Frame grabs at the beats (Watson reading, Holmes searching in the
  new colours, the shifted search, the celebration apex, the pout),
  saved full-width and at 390 px for the read-at-game-size check.
- Contrast sample: Holmes's torso patch vs the map ring around him in
  the search frame (mean RGB distance + luminance ratio).
"""
import json, subprocess, sys

EV = "/home/hatch/workspace/meridian-detective-evidence"
FINAL = EV + "/loop-realpage.mp4"
DUR = {"clue1": 8.95, "ack1": 1.87, "selLV": 3.29, "suspicion": 3.14, "ask": 2.21,
       "clue2": 11.42, "ack4": 1.97, "selHend": 3.19, "winH": 1.46, "winW": 3.58,
       "clue5": 10.03, "ack3": 1.49, "selSLC": 4.01, "answer": 5.83}

def probe_dur(p):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                          "-of", "csv=p=0", p], capture_output=True, text=True)
    return float(out.stdout.strip())

def rms(path, t, dur):
    out = subprocess.run(["ffmpeg", "-ss", str(t), "-i", path, "-t", str(dur),
                          "-af", "astats=metadata=1", "-f", "null", "-"],
                         capture_output=True, text=True)
    for line in out.stderr.splitlines():
        if "RMS level dB" in line:
            return float(line.rsplit(":", 1)[1])
    return None

cues = json.load(open(EV + "/loop-cues.json"))
p1 = probe_dur(EV + "/loop-part1.mp4")
p2 = probe_dur(EV + "/loop-part2.mp4")
off2 = p1 + 0.8
print(f"part1 {p1:.2f}s + gap 0.8 + part2 {p2:.2f}s = {p1 + 0.8 + p2:.2f}s total")

windows = []
for k, t in cues["part1"].items():
    key = "suspicion" if k.startswith("suspicion") else k
    windows.append((f"p1 {k}", t + 0.25, DUR[key] - 0.4))
for k, t in cues["part2"].items():
    key = "suspicion" if k.startswith("suspicion") else k
    windows.append((f"p2 {k}", off2 + t + 0.25, DUR[key] - 0.4))

fails = []
print("\nSPEECH WINDOWS (final mp4):")
for name, t, d in windows:
    r = rms(FINAL, t, d)
    ok = r is not None and r > -45
    print(f"  {name:14s} @{t:7.2f}s  RMS {r:7.2f} dB  {'OK' if ok else 'FAIL'}")
    if not ok:
        fails.append(f"speech window {name} RMS {r}")

gaps = [
    ("p1 search silence", cues["part1"]["ack1"] + 2.6, 2.0),
    ("p1 between cycles", cues["part1"]["ask"] + 2.6, 1.2),
    ("join gap", p1 + 0.1, 0.6),
    ("p2 search silence", off2 + cues["part2"]["ack3"] + 2.2, 1.6),
    ("p2 pout hold", off2 + cues["part2"]["answer"] + 7.5, 2.0),
]
print("\nGAP WINDOWS (must be silent):")
for name, t, d in gaps:
    r = rms(FINAL, t, d)
    ok = r is not None and r < -50
    print(f"  {name:18s} @{t:7.2f}s  RMS {r} dB  {'OK' if ok else 'FAIL'}")
    if not ok:
        fails.append(f"gap window {name} RMS {r}")

c1 = cues["part1"]
frames = {
    "read": c1["clue1"] + 4.5,
    "search": c1["ack1"] + 5.5,
    "shift": c1["selLV"] - 3.2,
    "celebrate": c1["winW"] + 3.58 + 0.85,
    "pout": off2 + cues["part2"]["answer"] + 7.0,
}
print("\nFRAME GRABS:")
for name, t in frames.items():
    out = f"{EV}/loop-frame-{name}.png"
    subprocess.run(["ffmpeg", "-y", "-ss", str(t), "-i", FINAL, "-frames:v", "1", out],
                   capture_output=True)
    subprocess.run(["ffmpeg", "-y", "-i", out, "-vf", "scale=390:-1",
                    f"{EV}/loop-frame-{name}-390.png"], capture_output=True)
    print(f"  {name:10s} @{t:7.2f}s -> loop-frame-{name}.png (+ -390)")

# Contrast sample on the search frame: Holmes's box from the trace.
try:
    from PIL import Image
    tr = json.load(open(EV + "/loop-trace-part1.json"))
    t_search = cues["part1"]["ack1"] + 5.5
    s = min(tr, key=lambda s: abs(s["t"] - t_search))
    hx, hy, hw, hh = [int(v) for v in s["h"]]
    img = Image.open(EV + "/loop-frame-search.png").convert("RGB")
    torso = img.crop((hx + hw // 3, hy + hh // 3, hx + 2 * hw // 3, hy + 2 * hh // 3))
    ring = img.crop((max(0, hx - 30), max(0, hy - 30), hx + hw + 30, hy + hh + 30))
    def mean(im):
        px = list(im.getdata())
        n = len(px)
        return tuple(sum(c[i] for c in px) / n for i in range(3))
    mt, mr = mean(torso), mean(ring)
    lum = lambda c: 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
    dist = sum(abs(a - b) for a, b in zip(mt, mr))
    print(f"\nCONTRAST (search frame): Holmes torso mean RGB {tuple(round(v) for v in mt)} "
          f"vs map ring {tuple(round(v) for v in mr)}; RGB distance {dist:.0f}, "
          f"luminance {lum(mt):.0f} vs {lum(mr):.0f}")
    if dist < 60:
        fails.append(f"low torso/map colour distance {dist:.0f}")
except ImportError:
    print("\n(PIL unavailable — contrast judged on the frame grabs + sheet)")

print("\n" + ("VERIFY: PASS" if not fails else "VERIFY: FAIL"))
for f in fails:
    print("  FAIL:", f)
sys.exit(1 if fails else 0)
