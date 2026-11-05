/**
 * PROBE for the waypoint real-page mockup: serve the real built app
 * (main 7b04f28), drive the real loop to Henderson (?loop-puzzle=137),
 * test whether live ArcGIS tiles load inside Chromium, screenshot.
 * Run: flock ~/workspace/.e2e.lock node prototype/probe-realpage.mjs
 */
import fs from "node:fs";
import {
  BASE_URL,
  CHROME,
  LAUNCH_ARGS,
  installHarnessInitScripts,
  loadPlaywright,
  serveRealArtifact,
} from "./realpage-serve.mjs";

const OUT = "/home/hatch/workspace/.waypoint-rec";
fs.mkdirSync(OUT, { recursive: true });

const { chromium } = loadPlaywright();
const tileEvents = [];
const browser = await chromium.launch({ executablePath: CHROME, args: LAUNCH_ARGS });
const ctx = await browser.newContext({ viewport: { width: 480, height: 950 } });
await installHarnessInitScripts(ctx);
await serveRealArtifact(ctx, { tileMode: "live", onTile: (u) => tileEvents.push(u) });
const page = await ctx.newPage();
page.on("response", (r) => {
  if (r.url().includes("arcgisonline")) console.log("tile resp:", r.status(), r.url().slice(-40));
});
page.on("requestfailed", (r) => {
  if (r.url().includes("arcgisonline")) console.log("tile FAILED:", r.failure()?.errorText, r.url().slice(-40));
});
page.on("console", (m) => {
  if (m.type() === "error") console.log("console error:", m.text().slice(0, 200));
});

await page.goto(`${BASE_URL}?loop-puzzle=137`);
await page.getByRole("button", { name: "GeoDetective: Solve a mystery" }).click();
await page.getByRole("heading", { name: "GeoDetective" }).waitFor({ timeout: 30_000 });
await page.getByRole("article", { name: /Clue 1: Geography/ }).waitFor({ timeout: 30_000 });
await page.getByTestId("loop-map").waitFor({ timeout: 30_000 });
console.log("loop screen up");
await page.waitForTimeout(10_000);

const info = await page.evaluate(() => {
  const store = JSON.parse(localStorage.getItem("meridian.loop.v2") || "null");
  const mapEl = document.querySelector('[data-testid="loop-map"]');
  const r = mapEl?.getBoundingClientRect();
  return {
    index: store?.current?.index,
    status: store?.current?.status,
    hasLoopMap: !!(mapEl && mapEl.__loopMap),
    mapRect: r ? { x: r.x, y: r.y, w: r.width, h: r.height } : null,
    scrollH: document.documentElement.scrollHeight,
    buildId: document.querySelector('meta[name="meridian-build"]')?.getAttribute("content") ?? null,
  };
});
console.log("page info:", JSON.stringify(info));
console.log("tile requests seen:", tileEvents.length);
await page.screenshot({ path: OUT + "/probe-full.png" });
const mapEl = page.getByTestId("loop-map");
await mapEl.screenshot({ path: OUT + "/probe-map.png" }).catch((e) => console.log("map shot failed", e.message));
await browser.close();
console.log("probe done");
