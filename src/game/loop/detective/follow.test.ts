/**
 * follow.test.ts — the proximity-follow solver + tier machine.
 * Geometry only, no game data (the answer-blindness discipline).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  baseTierFor,
  createFollowTierMachine,
  dockPerch,
  followTravelMs,
  solveFollow,
  CLEARANCE_DESKTOP_PX,
  CLEARANCE_TOUCH_PX,
  type FollowInput,
} from "./follow.ts";

const BOX = { w: 70, h: 104 };
const VP = { w: 1280, h: 800 };

function input(over: Partial<FollowInput> = {}): FollowInput {
  return {
    pointer: { x: 640, y: 400 },
    holmesBox: BOX,
    viewport: VP,
    forbidden: [],
    pointerType: "mouse",
    currentCentre: null,
    ...over,
  };
}

describe("solveFollow", () => {
  it("berths on the park ring around the pointer", () => {
    const r = solveFollow(input());
    assert.ok(r);
    const cx = r.x + BOX.w / 2;
    const cy = r.y + BOX.h / 2;
    const d = Math.hypot(cx - 640, cy - 400);
    assert.ok(d >= 80 && d <= 130, `centre distance ${d}`);
    assert.equal(r.kind, "ring");
  });

  it("honours the desktop clearance bubble (>= 56 px edge distance)", () => {
    const r = solveFollow(input())!;
    const cx = r.x + BOX.w / 2;
    const cy = r.y + BOX.h / 2;
    const dx = Math.max(Math.abs(640 - cx) - BOX.w / 2, 0);
    const dy = Math.max(Math.abs(400 - cy) - BOX.h / 2, 0);
    assert.ok(Math.hypot(dx, dy) >= CLEARANCE_DESKTOP_PX - 0.01);
  });

  it("honours the touch clearance bubble (>= 64 px edge distance)", () => {
    const r = solveFollow(input({ pointerType: "touch" }))!;
    const cx = r.x + BOX.w / 2;
    const cy = r.y + BOX.h / 2;
    const dx = Math.max(Math.abs(640 - cx) - BOX.w / 2, 0);
    const dy = Math.max(Math.abs(400 - cy) - BOX.h / 2, 0);
    assert.ok(Math.hypot(dx, dy) >= CLEARANCE_TOUCH_PX - 0.01);
  });

  it("never intersects a forbidden rect", () => {
    const card = { x: 500, y: 250, w: 280, h: 300 };
    const r = solveFollow(input({ forbidden: [card] }))!;
    const hit =
      r.x < card.x + card.w && r.x + BOX.w > card.x &&
      r.y < card.y + card.h && r.y + BOX.h > card.y;
    assert.equal(hit, false);
  });

  it("never returns a dock: a far pointer still gets a nearby berth", () => {
    // The old engine's >320 px remote rule is deleted: a pointer in
    // the far corner berths Holmes beside IT, not at any home spot.
    const r = solveFollow(input({ pointer: { x: 1200, y: 120 } }))!;
    const cx = r.x + BOX.w / 2;
    assert.ok(cx > 900, `centre x ${cx} should be near the pointer`);
  });

  it("falls back to an edge perch when the ring is fully forbidden", () => {
    // Wall off everything except the left edge strip.
    const r = solveFollow(
      input({
        forbidden: [{ x: 120, y: 0, w: 1160, h: 800 }],
        pointer: { x: 900, y: 400 },
      }),
    );
    assert.ok(r);
    assert.equal(r.kind, "perch");
    assert.ok(r.x <= 60);
  });

  it("returns null when nothing is legal (host keeps current position)", () => {
    const r = solveFollow(
      input({ forbidden: [{ x: 0, y: 0, w: 1280, h: 800 }] }),
    );
    assert.equal(r, null);
  });

  it("same-side hysteresis: prefers staying on his current side", () => {
    const left = solveFollow(
      input({ currentCentre: { x: 500, y: 400 } }),
    )!;
    const cx = left.x + BOX.w / 2;
    assert.ok(cx < 640, `expected left-side berth, got centre x ${cx}`);
  });

  it("stays fully on screen at the corners", () => {
    const r = solveFollow(input({ pointer: { x: 30, y: 30 } }))!;
    assert.ok(r.x >= 0 && r.y >= 0);
    assert.ok(r.x + BOX.w <= VP.w && r.y + BOX.h <= VP.h);
  });
});

describe("followTravelMs", () => {
  it("clamps into the 0.3–0.8 s band", () => {
    assert.equal(followTravelMs(0), 300);
    assert.equal(followTravelMs(10000), 800);
    const mid = followTravelMs(225);
    assert.ok(mid >= 300 && mid <= 800);
  });
});

describe("tier machine", () => {
  it("base tiers: flag on = PAGE_FOLLOW, off = PAUSE_BERTH, constrained = DOCK_ONLY", () => {
    assert.equal(baseTierFor({ followFlagOn: true, dockOnlyDevice: false }), "PAGE_FOLLOW");
    assert.equal(baseTierFor({ followFlagOn: false, dockOnlyDevice: false }), "PAUSE_BERTH");
    assert.equal(baseTierFor({ followFlagOn: true, dockOnlyDevice: true }), "DOCK_ONLY");
    assert.equal(baseTierFor({ followFlagOn: false, dockOnlyDevice: true }), "DOCK_ONLY");
  });

  it("steps down on kill and back up on re-qualification, never above base", () => {
    const m = createFollowTierMachine("PAGE_FOLLOW");
    assert.equal(m.stepDown(), "PAUSE_BERTH");
    assert.equal(m.stepDown(), "DOCK_ONLY");
    assert.equal(m.stepDown(), "DOCK_ONLY");
    assert.equal(m.requalify(), "PAUSE_BERTH");
    assert.equal(m.requalify(), "PAGE_FOLLOW");
    assert.equal(m.requalify(), "PAGE_FOLLOW");
  });

  it("flag-off base never steps up to PAGE_FOLLOW", () => {
    const m = createFollowTierMachine("PAUSE_BERTH");
    m.stepDown();
    assert.equal(m.tier, "DOCK_ONLY");
    m.requalify();
    m.requalify();
    assert.equal(m.tier, "PAUSE_BERTH");
  });
});

describe("dockPerch", () => {
  it("is the viewport bottom-left inset", () => {
    assert.deepEqual(dockPerch(BOX, VP), { x: 12, y: 800 - 12 - 104 });
  });
});
