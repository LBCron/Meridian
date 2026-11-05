/**
 * Real-page serving for the WAYPOINT REAL-PAGE mockup capture.
 * A plain-JS port of the repo's own E2E serving model
 * (tests/e2e/helpers.ts `serveBuiltArtifact`): the built Pages artifact
 * is fulfilled from disk while the page keeps the production base URL
 * http://127.0.0.1:4123/Meridian/. The artifact served is the local
 * build of main `7b04f28` (build-meta.json buildId verified).
 *
 * Differences from the E2E helper, all harness-side:
 *  - the telemetry ingest host is fulfilled 204 without a ledger;
 *  - tileMode chooses how server.arcgisonline.com is answered:
 *    "live"  — pass through to the real tile host;
 *    "proxy" — the capture process fetches the real tile and fulfills
 *              it (used only if Chromium itself cannot reach the host);
 *    "stub"  — the repo E2E's 1x1 PNG stub (helpers.ts TILE_STUB).
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

export const DIST = "/home/hatch/workspace/meridian-354-bench-main/dist/client";
export const BASE_URL = "http://127.0.0.1:4123/Meridian/";
export const CHROME =
  "/home/hatch/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome";
export const LAUNCH_ARGS = [
  "--disable-dev-shm-usage",
  "--use-gl=angle",
  "--use-angle=swiftshader",
];

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".mp3": "audio/mpeg",
  ".webmanifest": "application/manifest+json",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
};

// The repo E2E's 1x1 transparent PNG tile stub (tests/e2e/helpers.ts).
const TILE_STUB = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGNgAAIAAAUAAXpeqz8AAAAASUVORK5CYII=",
  "base64",
);

export function loadPlaywright() {
  const req = createRequire(import.meta.url);
  try {
    return req("playwright");
  } catch {
    return req("/home/hatch/workspace/meridian-home-ship/node_modules/playwright");
  }
}

/** The harness device spoof, ported from tests/e2e/helpers.ts
 * (spoofCapableDevice): the app's own capability probe honestly reaches
 * "capable" on this SwiftShader VM. Installed BEFORE navigation. */
export async function installHarnessInitScripts(context) {
  // Force the clipboard share path (mirrors geodetective.spec.ts).
  await context.addInitScript(() => {
    try {
      Object.defineProperty(navigator, "share", {
        value: undefined,
        configurable: true,
      });
    } catch {
      /* navigator.share stays */
    }
  });
  await context.addInitScript(() => {
    const gb = 8;
    const NVIDIA =
      "ANGLE (NVIDIA, NVIDIA GeForce RTX 4090 (0x00002684) Direct3D11 vs_5_0 ps_5_0, D3D11)";
    const R = 0x9246;
    const V = 0x9245;
    const proto = HTMLCanvasElement.prototype;
    const origGetContext = proto.getContext;
    proto.getContext = function (type, opts) {
      const ctx = origGetContext.call(this, type, opts);
      if (ctx && (type === "webgl" || type === "webgl2" || type === "experimental-webgl")) {
        const origGetExtension = ctx.getExtension.bind(ctx);
        const origGetParameter = ctx.getParameter.bind(ctx);
        ctx.getExtension = (name) => {
          if (name === "WEBGL_debug_renderer_info") {
            return { UNMASKED_RENDERER_WEBGL: R, UNMASKED_VENDOR_WEBGL: V };
          }
          return origGetExtension(name);
        };
        ctx.getParameter = (p) => {
          if (p === R) return NVIDIA;
          if (p === V) return "Google Inc. (NVIDIA)";
          return origGetParameter(p);
        };
      }
      return ctx;
    };
    Object.defineProperty(Navigator.prototype, "deviceMemory", {
      get: () => gb,
      configurable: true,
    });
  });
}

export async function serveRealArtifact(context, { tileMode = "live", onTile = null } = {}) {
  await context.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === "meridian-crash-report.knowledgetest.workers.dev") {
      return route.fulfill({ status: 204, body: "" });
    }
    if (url.hostname === "server.arcgisonline.com") {
      if (onTile) onTile(url.href);
      if (tileMode === "stub") {
        return route.fulfill({ status: 200, body: TILE_STUB, contentType: "image/png" });
      }
      if (tileMode === "proxy") {
        try {
          const res = await fetch(url.href);
          const body = Buffer.from(await res.arrayBuffer());
          return route.fulfill({
            status: res.status,
            body,
            contentType: res.headers.get("content-type") || "image/png",
          });
        } catch {
          return route.fulfill({ status: 200, body: TILE_STUB, contentType: "image/png" });
        }
      }
      return route.continue();
    }
    if (url.hostname !== "127.0.0.1" && url.hostname !== "localhost") {
      return route.continue();
    }
    let p = decodeURIComponent(url.pathname);
    if (p === "/Meridian" || p === "/Meridian/") p = "/_shell.html";
    else if (p.startsWith("/Meridian/")) p = p.slice("/Meridian".length);
    if (p.endsWith("/")) p += "_shell.html";
    const file = path.normalize(path.join(DIST, p));
    if (!file.startsWith(DIST + path.sep) && file !== DIST) {
      return route.fulfill({ status: 403, body: "forbidden" });
    }
    try {
      const body = await fs.promises.readFile(file);
      const ext = path.extname(file).toLowerCase();
      return route.fulfill({
        status: 200,
        body,
        contentType: MIME[ext] ?? "application/octet-stream",
      });
    } catch {
      return route.fulfill({ status: 404, body: "not found" });
    }
  });
}
