/**
 * LOOP POSE SHEET capture — renders the pair in their NEW colours in
 * the five key poses of the full-loop mockup (read-think, search,
 * suspicion, celebrate, pout) over a real Esri satellite backdrop of
 * the case area (Henderson, NV), at the characters' true game sizes.
 * Output: ~/workspace/meridian-detective-evidence/loop-sheet.png
 *
 * The CSS + SVG rigs are extracted verbatim from
 * prototype/loop-overlay.js so the sheet can never drift from the
 * staging rig.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { loadPlaywright } from "./realpage-serve.mjs";

const { chromium } = loadPlaywright();

const CHROME = "/home/hatch/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome";
const PROTO = "/home/hatch/workspace/meridian-detective-proto/prototype";
const EVID = "/home/hatch/workspace/meridian-detective-evidence";

const src = await fs.readFile(path.join(PROTO, "loop-overlay.js"), "utf-8");
const grab = (name) => {
  const m = src.match(new RegExp("const " + name + " = `([\\s\\S]*?)`;"));
  if (!m) throw new Error("cannot extract " + name);
  return m[1];
};
let css = grab("css").replaceAll(".lwStage ", "");
// Drop stage/finger/slate/flash-only rule blocks (not needed on a sheet).
css = css.split("}").filter((b) => {
  const sel = b.split("{")[0] || "";
  return !/#wpStage|#stStage|\.lwStage \{|#wpFinger|#wpSlate|#wpFlash/.test(sel);
}).join("}");
const holmesSvg = grab("holmesSvg");
const watsonSvg = grab("watsonSvg");

// Real Esri World Imagery tiles around Henderson NV, z12: x 728-729, y 1607-1608.
const tiles = [];
for (const [x, y] of [[728, 1607], [729, 1607], [728, 1608], [729, 1608]]) {
  const url = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/12/${y}/${x}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("tile fetch failed: " + url + " " + res.status);
  const buf = Buffer.from(await res.arrayBuffer());
  tiles.push(`data:image/jpeg;base64,${buf.toString("base64")}`);
}
const backdrop = `
  <div style="position:absolute;inset:0;display:grid;grid-template-columns:256px 256px;grid-template-rows:256px 256px;opacity:.92">
    ${tiles.map((t) => `<img src="${t}" style="width:256px;height:256px">`).join("")}
  </div>
  <div style="position:absolute;inset:0;background:rgba(24,32,20,.18)"></div>`;

const row = (label, inner) => `
  <section style="position:relative;height:212px;overflow:hidden;border-bottom:3px solid #141b26">
    ${backdrop}
    <div style="position:absolute;left:10px;top:8px;z-index:20;font:600 11px/1.3 system-ui;letter-spacing:.14em;color:#fdf6e3;background:rgba(16,20,8,.62);padding:4px 9px;border-radius:6px">${label}</div>
    ${inner}
  </section>`;

const H = (style, cls, flipCls = "", jump = "") => `
  <div class="char idle ${cls}" id="wpHolmes" style="${style}">
    <div class="jumpwrap" style="${jump}"><div class="flipwrap ${flipCls}">${holmesSvg}</div></div>
    <div class="shadow"></div>
  </div>`;
const W = (style, cls, flipCls = "", jump = "") => `
  <div class="char idle ${cls}" id="stWatson" style="${style}">
    <div class="jumpwrap" style="${jump}"><div class="flipwrap ${flipCls}">${watsonSvg}</div></div>
    <div class="shadow"></div>
  </div>`;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  * { animation-play-state: paused !important; }
  body { margin:0; background:#20242c; font-family:system-ui; }
  ${css}
</style></head><body>
<div style="width:480px;margin:0 auto;background:#20242c">
  <div style="padding:12px 14px 10px;color:#f4ecda;font:700 15px/1.35 system-ui">
    HOLMES &amp; WATSON — NEW COLOURS, KEY POSES<br>
    <span style="font-weight:500;font-size:12px;color:#cfc4a6">Real satellite backdrop (Henderson NV) · true game size · loop mockup rig</span>
  </div>
  ${row("1 · WATSON READS + THINKS — HOLMES ACKNOWLEDGES",
    W("left:26px;top:86px", "reading ponder pose-notebookup speaking") +
    H("left:330px;top:72px", "speaking"))}
  ${row("2 · HOLMES SEARCHES THE MAP — WATSON WAITS AT THE CARD",
    H("left:120px;top:64px", "walking pose-peer") +
    W("left:330px;top:86px", "penciltap"))}
  ${row("3 · SUSPICION — “HMM… IT COULD BE IT.”",
    H("left:170px;top:66px", "pose-think pose-gaze speaking") +
    W("left:300px;top:86px", "expr-surprised"))}
  ${row("4 · SOLVE — JUMP + HIGH-FIVE (THEN CLAPS)",
    H("left:140px;top:70px", "pose-hi expr-delighted", "", "transform:translateY(-13px)") +
    W("left:190px;top:81px", "pose-hi expr-delighted", "", "transform:translateY(-14px)") +
    `<svg style="position:absolute;left:185px;top:52px;width:40px;height:40px;z-index:8" viewBox="0 0 54 54"><path d="M27,2 L32,20 L50,14 L36,26 L48,38 L31,34 L27,52 L23,34 L6,38 L18,26 L4,14 L22,20 Z" fill="#f4c542" stroke="#a87c14" stroke-width="1.6"/></svg>`)}
  ${row("5 · OUT OF GUESSES — THE POUT",
    H("left:160px;top:70px", "pose-slump expr-pout pose-crouch") +
    W("left:238px;top:81px", "pose-slump expr-pout"))}
</div></body></html>`;

const htmlPath = path.join(PROTO, "loop-sheet.html");
await fs.writeFile(htmlPath, html);

const browser = await chromium.launch({
  executablePath: CHROME,
  args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 480, height: 1240 } });
await page.goto("file://" + htmlPath);
await page.waitForTimeout(600);
await page.screenshot({ path: path.join(EVID, "loop-sheet.png"), fullPage: true });
await browser.close();
console.log("sheet written:", path.join(EVID, "loop-sheet.png"));
