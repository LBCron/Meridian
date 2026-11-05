#!/usr/bin/env python3
"""Generate prototype/animated-sheet.html from detective-moments-animated.html.

The sheet reuses the rig's exact character markup: the cured pair standing
together, plus head busts in all three expressions for each detective.
Run: python3 prototype/build-sheet.py
"""
import re, pathlib

HERE = pathlib.Path(__file__).parent
src = (HERE / "detective-moments-animated.html").read_text()

def char_block(cid):
    m = re.search(r'<div class="char idle" id="%s".*?</svg>\s*</div></div>\s*<div class="shadow"></div>\s*</div>' % cid, src, re.S)
    assert m, cid
    block = m.group(0)
    block = block.replace(' style="transform:translateX(-170px)"', "").replace(' style="transform:translateX(520px)"', "")
    block = block.replace('class="char idle"', 'class="char sheetchar"')
    return block

holmes = char_block("holmes")
watson = char_block("watson")

def bust(block, expr, label):
    cls = ("expr-" + expr) if expr else ""
    return f'<div class="bustwrap {cls}"><div class="bust">{block}</div><p>{label}</p></div>'

sheet = f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<title>Holmes &amp; Watson — cured character sheet (animated build)</title>
<style>
  * {{ margin:0; padding:0; box-sizing:border-box; }}
  body {{ font-family: ui-sans-system, system-ui, "Segoe UI", Roboto, sans-serif; background:#f4ecda; color:#3a3128; width:480px; margin:0 auto; }}
  h1 {{ font-family: Georgia, serif; font-size:30px; padding:18px 20px 0; color:#33291d; }}
  .sub {{ padding:2px 20px 8px; font-size:12px; letter-spacing:.18em; color:#8a7a5c; }}
  .pair {{ position:relative; height:250px; background:linear-gradient(180deg,#efe3c4,#d3ba85); border-top:2px solid #c9b183; border-bottom:2px solid #c9b183; }}
  .sheetchar {{ position:absolute; bottom:10px; }}
  .pair #holmes {{ left:56px; }} .pair #watson {{ left:238px; }}
  .char svg {{ display:block; overflow:visible; }}
  .char .shadow {{ position:absolute; left:50%; bottom:-4px; width:78%; height:13px; transform:translateX(-50%); background:radial-gradient(ellipse at center, rgba(74,55,25,.35), rgba(74,55,25,0) 70%); }}
  .names {{ display:flex; gap:0; padding:8px 20px 0; font-size:13px; }}
  .names div {{ width:50%; }} .names b {{ display:block; font-size:15px; }} .names span {{ color:#8a7a5c; font-size:12px; }}
  h2 {{ font-size:12px; letter-spacing:.18em; color:#8a7a5c; padding:16px 20px 6px; }}
  .row {{ display:flex; gap:10px; padding:0 20px 6px; }}
  .bustwrap {{ text-align:center; }}
  .bustwrap p {{ font-size:11.5px; color:#6b5d49; padding-top:2px; }}
  .bust {{ width:132px; height:118px; overflow:hidden; position:relative; background:#efe3c4; border-radius:12px; }}
  .bust .sheetchar {{ position:absolute; }}
  .bust .shadow {{ display:none; }}
  .bust.holmesbust .sheetchar {{ left:50%; bottom:auto; top:2px; transform:translateX(-50%) scale(1.55); transform-origin:top center; }}
  .bust.watsonbust .sheetchar {{ left:50%; bottom:auto; top:2px; transform:translateX(-54%) scale(1.6); transform-origin:top center; }}
  .face-surprised, .face-delighted {{ display:none; }}
  .expr-surprised .face-neutral, .expr-surprised .face-delighted {{ display:none; }}
  .expr-surprised .face-surprised {{ display:block; }}
  .expr-delighted .face-neutral, .expr-delighted .face-surprised {{ display:none; }}
  .expr-delighted .face-delighted {{ display:block; }}
  .cluecard {{ display:none; }}
  .notebook {{ }}
  .foot {{ padding:10px 20px 18px; font-size:12px; color:#8a7a5c; line-height:1.5; }}
</style></head>
<body>
<h1>The Detectives</h1>
<p class="sub">CHARACTER SHEET · ANIMATED BUILD · CURES APPLIED</p>
<div class="pair">{holmes}{watson}</div>
<div class="names">
  <div><b>SHERLOCK HOLMES</b><span>deerstalker · plaid cape-coat · magnifying glass — no pipe</span></div>
  <div><b>DR WATSON</b><span>bowler · small moustache, mouth beneath · notebook</span></div>
</div>
<h2>HOLMES — EXPRESSIONS</h2>
<div class="row">{bust(holmes.replace('class="char sheetchar" id="holmes"','class="char sheetchar"'), '', 'neutral')}{bust(holmes, 'surprised', 'surprised')}{bust(holmes, 'delighted', 'delighted')}</div>
<h2>WATSON — EXPRESSIONS</h2>
<div class="row">{bust(watson, '', 'neutral')}{bust(watson, 'surprised', 'surprised')}{bust(watson, 'delighted', 'delighted')}</div>
<p class="foot">Watson stands ≈75% of Holmes's height and wider — the reference's contrast. Both mouths sit clear of hat and moustache: they are speaking characters, and the mouth flaps on their lines.</p>
</body></html>
"""

# bust wrappers need per-character classes for the crop offsets:
# first three busts are Holmes's row, the next three are Watson's.
_count = [0]
def _bustcls(m):
    _count[0] += 1
    return '<div class="bust holmesbust">' if _count[0] <= 3 else '<div class="bust watsonbust">'
sheet = re.sub(r'<div class="bust">', _bustcls, sheet)

out = HERE / "animated-sheet.html"
out.write_text(sheet)
print("wrote", out, len(sheet), "bytes")
