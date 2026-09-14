import test from "node:test";
import assert from "node:assert/strict";
import { cinematicFrame, portalGeometry, portalHandoff, smooth } from "./cinematic-math.js";

test("laptop and real-document opacities remain complementary through the handoff", () => {
  assert.deepEqual(portalHandoff(.935), { terminal:1, document:0 });
  assert.deepEqual(portalHandoff(1), { terminal:0, document:1 });
  for (let p=.88;p<=1;p+=.001) {
    const result=portalHandoff(p);
    assert.ok(Math.abs(result.terminal+result.document-1)<1e-8);
    assert.ok(Math.max(result.terminal,result.document)>=.5, "No blank gap between laptop and CV");
  }
});

test("film frames are scrubbed reversibly before the screen zoom", () => {
  assert.equal(cinematicFrame(0, 386), 0);
  assert.equal(cinematicFrame(.4, 386), 193);
  assert.equal(cinematicFrame(.8, 386), 385);
  assert.equal(cinematicFrame(1, 386), 385);
  assert.equal(cinematicFrame(-1, 386), 0);
});
const screen = [[.295,.232],[.705,.227],[.708,.671],[.293,.672]];
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} ≈ ${expected}`);
const viewports = [[1440,810],[390,844],[760,900],[2000,800],[320,568],[844,390],[768,1024],[3840,2160]];

function assertCovered(points, width, height) {
  const corners = [[0,0],[width,0],[width,height],[0,height]];
  const area = points.reduce((sum, [x, y], i) => {
    const b = points[(i + 1) % 4];
    return sum + x * b[1] - y * b[0];
  }, 0);
  const orientation = Math.sign(area);
  for (let i = 0; i < 4; i++) {
    const a = points[i], b = points[(i + 1) % 4];
    for (const corner of corners) {
      const cross = (b[0] - a[0]) * (corner[1] - a[1]) - (b[1] - a[1]) * (corner[0] - a[0]);
      assert.ok(cross * orientation >= -1e-8, "Every viewport corner stays inside every LCD edge");
    }
  }
}

for (const [width,height] of viewports) {
  test(`portal preserves uniform screen geometry and covers ${width}×${height} by .82`, () => {
    const geometry = amount => portalGeometry(screen,1440,810,width,height,amount);
    const initial = geometry(0), final = geometry(1);
    assert.ok(final.scale > 1);
    assert.deepEqual(geometry(.82), final);
    assert.deepEqual(geometry(2), final);
    assert.deepEqual(geometry(-1), initial);
    assert.notDeepEqual(final.points, [[0,0],[width,0],[width,height],[0,height]]);
    assertCovered(final.points, width, height);
    const forward = Array.from({ length: 101 }, (_, i) => geometry(i / 100));
    for (let step = 100; step >= 0; step--) {
      const amount = step / 100, result = geometry(amount);
      assert.deepEqual(result, forward[step], "Reverse scrubbing reproduces exactly the same geometry");
      assert.ok([result.scale, result.x, result.y, ...result.points.flat()].every(Number.isFinite));
      close(result.scale, 1 + (final.scale - 1) * smooth(amount / .82));
      for (let i = 0; i < 4; i++) {
        close(result.points[i][0], initial.points[i][0] * result.scale + result.x);
        close(result.points[i][1], initial.points[i][1] * result.scale + result.y);
      }
    }
    // At completion, a 1.04 uniform safety margin remains on the limiting edge.
    const center = final.points.reduce((sum, point) => [sum[0] + point[0] / 4, sum[1] + point[1] / 4], [0,0]);
    close(center[0], width / 2); close(center[1], height / 2);
    const margins = final.points.map((a, i) => {
      const b = final.points[(i + 1) % 4], nx = a[1] - b[1], ny = b[0] - a[0];
      const distance = nx * (center[0] - a[0]) + ny * (center[1] - a[1]);
      return distance / (Math.abs(nx) * width / 2 + Math.abs(ny) * height / 2);
    });
    close(Math.min(...margins), 1.04);
  });
}

test("rotated and perspective-skewed LCDs cover viewport corners without corner morphing", () => {
  const skewed = [[.4,.15],[.78,.3],[.69,.74],[.26,.58]];
  for (const points of [skewed, [...skewed].reverse()]) {
    for (const [width, height] of viewports) {
      const result = portalGeometry(points, 1440, 810, width, height, .82);
      assert.ok(result);
      assertCovered(result.points, width, height);
    }
  }
});

test("invalid or unavailable screen geometry cannot project HTML", () => {
  assert.equal(portalGeometry(null,1440,810,390,844,1),null);
  assert.equal(portalGeometry([[0,0],[0,0],[0,0],[0,0]],1440,810,390,844,1),null);
  assert.equal(portalGeometry([[0,0],[1,1],[1,0],[0,1]],1440,810,390,844,1),null);
  assert.equal(portalGeometry([[0,0],[1,0],[.2,.2],[0,1]],1440,810,390,844,1),null);
  assert.equal(portalGeometry([[0,0],[1,0],[1,1],[NaN,1]],1440,810,390,844,1),null);
  assert.equal(portalGeometry([[0,0],[1,0],[1,1],[0]],1440,810,390,844,1),null);
  assert.equal(portalGeometry(screen,0,810,390,844,1),null);
  assert.equal(portalGeometry(screen,1440,Infinity,390,844,1),null);
  assert.equal(portalGeometry(screen,1440,810,0,844,1),null);
  assert.equal(portalGeometry(screen,1440,810,390,844,NaN),null);
});
