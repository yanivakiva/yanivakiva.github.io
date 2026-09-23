import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { buildSync } from "esbuild";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { canPrepareOpening, createOpeningReadiness, openingBufferFraction, OPENING_WAIT_MS } from "./opening-readiness.js";

const ranges = entries => ({ length: entries.length, start: i => entries[i][0], end: i => entries[i][1] });
function harness() {
  let callback, wait, allowed = true;
  const states = [];
  const gate = createOpeningReadiness({ onChange: state => states.push(state), canStart: () => allowed,
    setTimer: (fn, ms) => { callback = fn; wait = ms; return 1; }, clearTimer: () => { callback = null; } });
  return { gate, states, get wait() { return wait; }, expire() { callback?.(); }, leave() { allowed = false; }, get timer() { return callback; } };
}
test("opening progress uses only contiguous buffered media from the beginning", () => {
  assert.equal(openingBufferFraction(ranges([])), 0);
  assert.equal(openingBufferFraction(ranges([[0, 1.5]])), .5);
  assert.equal(openingBufferFraction(ranges([[5, 16]])), 0);
  assert.equal(openingBufferFraction(ranges([[0, 1], [2, 16]])), 1 / 3);
  assert.equal(openingBufferFraction(ranges([[0, 1], [1.02, 4]])), 1);
});
test("cold readiness requires decoded artwork and a decoded buffered opening", () => {
  const h = harness();
  h.gate.update({ poster: true }); assert.equal(h.gate.state.progress, 33);
  h.gate.update({ companion: true }); assert.equal(h.gate.state.progress, 66);
  h.gate.update({ buffered: 1 }); assert.equal(h.gate.state.status, "loading");
  h.gate.update({ decoded: true }); assert.deepEqual(h.gate.state, { status: "ready", progress: 100, reason: null });
  assert.equal(h.timer, null);
});
test("three-second deadline selects the static route even when nothing loads", () => {
  const h = harness(); assert.equal(h.wait, OPENING_WAIT_MS); assert.equal(h.wait, 3000);
  h.expire(); assert.equal(h.gate.state.status, "static"); assert.equal(h.gate.state.reason, "timeout");
  const count = h.states.length;
  h.gate.update({ poster: true, companion: true, decoded: true, buffered: 1 });
  assert.equal(h.states.length, count, "A late load never expands a static document");
});
test("scrolling and skip navigation permanently settle the current opening", () => {
  for (const reason of ["scroll", "navigation"]) {
    const h = harness(); h.gate.skip(reason); h.expire();
    h.gate.update({ poster: true, companion: true, decoded: true, buffered: 1 });
    assert.equal(h.gate.state.status, "static"); assert.equal(h.gate.state.reason, reason);
    assert.equal(h.timer, null);
  }
});
test("restored positions and deep links bypass the cinematic loading gate", () => {
  assert.equal(canPrepareOpening({ scrollY: 0, hash: "" }), true);
  assert.equal(canPrepareOpening({ scrollY: 0, hash: "#home" }), true);
  for (const hash of ["#experience", "#about", "#contact", "#stealth"]) assert.equal(canPrepareOpening({ scrollY: 0, hash }), false);
  assert.equal(canPrepareOpening({ scrollY: 30, hash: "" }), false);
  const h = harness(); h.leave(); h.gate.update({ poster: true, companion: true, decoded: true, buffered: 1 });
  assert.equal(h.gate.state.status, "static");
});
test("ready openings stay ready during normal scrolling and teardown cancels late callbacks", () => {
  const h = harness(); h.gate.update({ poster: true, companion: true, decoded: true, buffered: 1 });
  h.leave(); h.gate.skip("scroll"); assert.equal(h.gate.state.status, "ready");
  const cold = harness(); const count = cold.states.length; cold.gate.destroy(); cold.expire(); cold.gate.update({ poster: true });
  assert.equal(cold.states.length, count); assert.equal(cold.timer, null);
});

const compiled = buildSync({ entryPoints: [fileURLToPath(new URL("./GardenOpening.jsx", import.meta.url))], bundle: true, write: false,
  platform: "node", format: "cjs", jsx: "automatic", packages: "external", logLevel: "silent" }).outputFiles[0].text;
const loaded = { exports: {} };
runInNewContext(compiled, { module: loaded, exports: loaded.exports, require: createRequire(import.meta.url) });
const render = (opening, animated = false) => renderToStaticMarkup(React.createElement(loaded.exports.default, { opening, animated }));
test("the loading control is a real CV link, never disabled or a queued tour", () => {
  const html = render({ status: "loading", progress: 66 });
  assert.match(html, /role="progressbar"[^>]*aria-valuenow="66"/);
  assert.match(html, /href="#experience"[^>]*>Skip to experience/);
  assert.doesNotMatch(html, /disabled|data-journey="true"/);
});
test("only a ready opening offers the cinematic tour; slow and motion-off states go directly to work", () => {
  assert.match(render({ status: "ready", progress: 100 }, true), /data-journey="true"[^>]*>Explore my work/);
  for (const status of ["static", "off"]) {
    const html = render({ status, reason: "timeout" });
    assert.match(html, /View my experience/); assert.doesNotMatch(html, /data-journey="true"|disabled/);
  }
});
