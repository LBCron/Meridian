/**
 * Probe: real-page geometry for the STATIONS mockup — where the Clue 1
 * article sits relative to the map at the show framing, so Watson's
 * overlay berth at the question can be solved from real rects.
 * Run: flock ~/workspace/.e2e.lock node prototype/probe-stations.mjs
 */
import path from "node:path";
import {
  BASE_URL,
  CHROME,
  LAUNCH_ARGS,
  installHarnessInitScripts,
  loadPlaywright,
  serveRealArtifact,
} from "./realpage-serve.mjs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const { chromium } = loadPlaywright();
const browser = await chromium.launch({ executablePath: CHROME, args: LAUNCH_ARGS });
const ctx = await browser.newContext({ viewport: { width: 480, height: 950 } });
await installHarnessInitScripts(ctx);
await serveRealArtifact(ctx, { tileMode: "proxy" });
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log("pageerror:", e.message.slice(0, 120)));

await page.goto(`${BASE_URL}?loop-puzzle=137`);
await page.getByRole("button", { name: "GeoDetective: Solve a mystery" }).click();
await page.getByRole("heading", { name: "GeoDetective" }).waitFor({ timeout: 30_000 });
await page.getByRole("article", { name: /Clue 1: Geography/ }).waitFor({ timeout: 30_000 });
await page.getByTestId("loop-map").waitFor({ timeout: 30_000 });
await page.evaluate(
  () =>
    new Promise((resolve) => {
      const el = document.querySelector('[data-testid="loop-map"]');
      const m = el && el.__loopMap;
      if (!m) return resolve("no-map");
      m.once("idle", () => resolve("idle"));
      setTimeout(() => resolve("timeout"), 20_000);
    }),
);
await page.evaluate(() => {
  const el = document.querySelector('[data-testid="loop-map"]');
  el.__loopMap.jumpTo({ center: [-114.98194, 36.0397], zoom: 9.5 });
});
await sleep(1500);
await page.evaluate(() => window.scrollTo(0, 0));
await sleep(400);

const rects = await page.evaluate(() => {
  const R = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), bottom: Math.round(r.bottom), right: Math.round(r.right) };
  };
  const article = document.querySelector('article[aria-label^="Clue 1"]') ||
    [...document.querySelectorAll("article")].find((a) => /Clue 1/.test(a.getAttribute("aria-label") || ""));
  const kids = article ? [...article.querySelectorAll("*")].map((k) => ({
    tag: k.tagName, cls: (k.className || "").toString().slice(0, 40),
    text: (k.textContent || "").slice(0, 50), rect: R(k),
  })) : [];
  return {
    scrollY: window.scrollY,
    map: R(document.querySelector('[data-testid="loop-map"]')),
    search: R(document.querySelector('[role="combobox"]')),
    article: R(article),
    articleKids: kids,
    clue2: R([...document.querySelectorAll("article")].find((a) => /Clue 2/.test(a.getAttribute("aria-label") || ""))),
  };
});
console.log(JSON.stringify(rects, null, 1));
await page.screenshot({ path: "/home/hatch/workspace/.waypoint-rec/probe-stations.png" });
await browser.close();
