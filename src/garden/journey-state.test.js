import test from "node:test";
import assert from "node:assert/strict";
import {
  scenePhase,
  readingScrollAfterResize,
  activeCareerIndex,
  printDisclosures,
} from "./journey-state.js";

test("camera phases have an arrival, bridge and workshop, reversible without replay", () => {
  assert.deepEqual(
    [0, 0.64, 0.65, 0.8, 0.98, 1, 0.8, 0].map((p) => scenePhase(p, true)),
    [0, 0, 1, 1, 2, 2, 1, 0],
  );
});
test("static mode omits the bridge transition", () => {
  assert.deepEqual(
    [0, 0.59, 0.6, 1].map((p) => scenePhase(p, false)),
    [0, 0, 2, 2],
  );
});
test("turning motion off preserves career reading position", () => {
  assert.equal(readingScrollAfterResize(2200, 1680, 700), 1220);
});
test("turning motion back on preserves career reading position", () => {
  assert.equal(readingScrollAfterResize(1220, 700, 1680), 2200);
});
test("changing motion during the hero does not move visible copy", () => {
  assert.equal(readingScrollAfterResize(300, 1680, 700), 300);
});
test("changing motion inside a removed passage goes to the career destination", () => {
  assert.equal(readingScrollAfterResize(1100, 1680, 700), 700);
});
test("mobile mode changes with unchanged geometry do not move the page", () => {
  assert.equal(readingScrollAfterResize(1600, 930, 930), 1600);
});
test("active employer derives from measured positions, including expanded details", () => {
  assert.equal(activeCareerIndex([400, 1000, 1500], 250), 0);
  assert.equal(activeCareerIndex([-700, 100, 800], 250), 1);
  assert.equal(activeCareerIndex([-700, 300, 1000], 250), 0);
  assert.equal(activeCareerIndex([-1200, -500, 100], 250), 2);
});
test("printing includes closed disclosures and preserves already-open ones", () => {
  const details = [{ open: false }, { open: true }, { open: false }];
  const controller = printDisclosures(() => details);
  controller.before();
  assert.deepEqual(
    details.map((d) => d.open),
    [true, true, true],
  );
  controller.after();
  assert.deepEqual(
    details.map((d) => d.open),
    [false, true, false],
  );
});
test("repeated beforeprint and afterprint events are idempotent", () => {
  const details = [{ open: false }];
  const controller = printDisclosures(() => details);
  controller.before();
  controller.before();
  controller.after();
  controller.after();
  assert.equal(details[0].open, false);
  controller.before();
  controller.after();
  assert.equal(details[0].open, false);
});
