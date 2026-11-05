/**
 * Capture for the casting MOCKUP (owner gate round): four stills only.
 *   ?scene=sheet -> mockup-sheet.png        (element shot)
 *   ?scene=instr -> mockup-instructions.png (full page)
 *   ?scene=hook  -> mockup-hook.png         (full page)
 *   ?scene=win   -> mockup-win.png          (full page)
 * Playwright resolves from the sibling meridian-home-ship checkout, as
 * with capture.mjs — the design branch grows no dependency tree.
 * Run: flock ~/workspace/.e2e.lock node prototype/capture-mockup.mjs
 */
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  ({ chromium } = require(
    "/home/hatch/workspace/meridian-home-ship/node_modules/playwright",
  ));
}

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PAGE = "file://" + path.join(HERE, "mockup.html");
const EVIDENCE = "/home/hatch/workspace/meridian-detective-evidence";
const CHROME =
  "/home/hatch/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome";

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: 480, height: 900 } });

await page.goto(PAGE + "?scene=sheet");
await page.waitForTimeout(400);
await page
  .locator("#sheet")
  .screenshot({ path: path.join(EVIDENCE, "mockup-sheet.png") });
console.log("saved mockup-sheet.png");

for (const [scene, name] of [
  ["instr", "mockup-instructions.png"],
  ["hook", "mockup-hook.png"],
  ["win", "mockup-win.png"],
]) {
  await page.goto(PAGE + "?scene=" + scene);
  await page.waitForTimeout(400);
  await page.screenshot({
    path: path.join(EVIDENCE, name),
    fullPage: true,
  });
  console.log("saved", name);
}
await browser.close();
