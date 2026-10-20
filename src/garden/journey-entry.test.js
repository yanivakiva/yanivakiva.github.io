import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { buildSync } from "esbuild";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createOpeningReadiness, OPENING_WAIT_MS, OPENING_STALL_MS } from "./opening-readiness.js";
import { downloadJourney, preloadJourneyFrames } from "./journey-preload.js";
import { lockJourneyOpening } from "./journey-lock.js";

const all = { poster: true, companion: true, arrival: true, screen: true, decoded: true, downloaded: 1 };
function readiness() {
  const timers = new Map(), states = []; let id = 0;
  const gate = createOpeningReadiness({ onChange: s => states.push(s),
    setTimer: (fn, ms) => { timers.set(++id, { fn, ms }); return id; }, clearTimer: key => timers.delete(key) });
  return { gate, timers, states, expire(ms) {
    for (const [key, value] of [...timers]) if (value.ms === ms) { timers.delete(key); value.fn(); }
  } };
}
test("the ENTIRE journey, first decode, terminal and both endpoint plates are required", () => {
  for (const key of Object.keys(all)) {
    const h = readiness();
    h.gate.update({ ...all, [key]: key === "downloaded" ? .999 : false });
    assert.equal(h.gate.state.status, "loading", key);
    assert.ok(h.gate.state.progress < 100);
    h.gate.update({ [key]: all[key] });
    assert.deepEqual(h.gate.state, { status: "ready", progress: 100, reason: null });
    assert.equal(h.timers.size, 0);
  }
});
test("progress reflects download bytes before decoding, not a made-up timer", () => {
  const h = readiness(); h.gate.update({ downloaded: .5 });
  assert.equal(h.gate.state.progress, 37);
  h.expire(OPENING_WAIT_MS);
  assert.equal(h.gate.state.status, "slow"); assert.equal(h.gate.state.progress, 37);
  h.gate.update(all); assert.equal(h.gate.state.status, "ready");
});
test("a stalled request is an error, never a CV route; late completions cannot unlock it", () => {
  const h = readiness(); h.expire(OPENING_STALL_MS);
  assert.equal(h.gate.state.status, "error"); assert.equal(h.gate.state.reason, "stalled");
  assert.equal(h.timers.size, 0);
  h.gate.update(all); assert.equal(h.gate.state.status, "error");
});
test("new progress resets the stall timer, repeated events do not postpone it forever", () => {
  const h = readiness(), before = [...h.timers.keys()].at(-1);
  h.gate.update({ downloaded: .01 });
  const after = [...h.timers.keys()].at(-1); assert.notEqual(after, before);
  h.gate.update({ downloaded: .01 }); assert.equal([...h.timers.keys()].at(-1), after);
  h.gate.destroy(); assert.equal(h.timers.size, 0);
});
test("failure and teardown ignore late downloads; retry is a fresh gate", () => {
  const h = readiness(); h.gate.fail(); h.gate.update(all);
  assert.equal(h.gate.state.status, "error");
  const retry = readiness(); retry.gate.update(all); assert.equal(retry.gate.state.status, "ready");
  const cold = readiness(), count = cold.states.length;
  cold.gate.destroy(); cold.gate.update(all); cold.gate.fail();
  assert.equal(cold.states.length, count); assert.equal(cold.timers.size, 0);
});
test("a decoder fallback re-locks until the entire replacement sequence is ready", () => {
  const h = readiness(); h.gate.update(all); h.gate.prepareMedia();
  assert.equal(h.gate.state.status, "loading"); assert.equal(h.gate.state.progress, 20);
  h.gate.update({ downloaded: 1 }); assert.equal(h.gate.state.status, "loading");
  h.gate.update({ decoded: true }); assert.equal(h.gate.state.status, "ready");
  h.gate.fail(); assert.equal(h.gate.state.status, "error");
});
test("whole-file download exposes 100% only after EOF and preserves bytes and MIME", async () => {
  const progress = [];
  const response = new Response(new ReadableStream({ start(c) {
    c.enqueue(new Uint8Array([1, 2])); c.enqueue(new Uint8Array([3, 4])); c.close();
  } }), { headers: { "content-length": "4", "content-type": "video/webm" } });
  const blob = await downloadJourney("film", { fetcher: async () => response, onProgress: p => progress.push(p) });
  assert.deepEqual(progress, [.5, .999, 1]);
  assert.equal(blob.type, "video/webm");
  assert.deepEqual([...new Uint8Array(await blob.arrayBuffer())], [1, 2, 3, 4]);
});
test("a broken, empty or aborted movie never reports ready", async () => {
  await assert.rejects(downloadJourney("film", { fetcher: async () => new Response(null, { status: 503 }) }));
  await assert.rejects(downloadJourney("film", { fetcher: async () => new Response("") }));
  const controller = new AbortController(); controller.abort();
  await assert.rejects(downloadJourney("film", { signal: controller.signal, fetcher: async () => new Response("video") }), { name: "AbortError" });
});
test("a stream failure cannot report 100%, even if its Content-Length was received", async () => {
  const progress = []; let read = 0;
  await assert.rejects(downloadJourney("film", { onProgress: p => progress.push(p), fetcher: async () => ({
    ok: true, headers: new Headers({ "content-length": "1" }),
    body: { getReader: () => ({ releaseLock() {}, read() {
      if (++read === 1) return Promise.resolve({ value: new Uint8Array([1]), done: false });
      return Promise.reject(new Error("connection closed"));
    } }) },
  }) }));
  assert.deepEqual(progress, [.999]);
});
test("fallback preloads every compressed frame without decoding them; concurrency is bounded", async () => {
  let active = 0, max = 0; const progress = [];
  const frames = await preloadJourneyFrames({ count: 12, urlFor: i => `frame-${i}`, onProgress: p => progress.push(p),
    fetcher: async url => {
      max = Math.max(max, ++active); await new Promise(resolve => setImmediate(resolve)); active--;
      return new Response(url);
    } });
  assert.equal(frames.size, 12); assert.equal(max, 3); assert.equal(progress.at(-1), 1);
  for (let i = 0; i < 12; i++) assert.equal(await frames.get(i).text(), `frame-${i}`);
});
test("failed fallback frames do not produce a partial ready sequence", async () => {
  await assert.rejects(preloadJourneyFrames({ count: 10, urlFor: i => `${i}`,
    fetcher: async i => new Response("frame", { status: i === "2" ? 404 : 200 }) }));
});
test("unknown-length transfers still report activity, while truncated transfers reject", async () => {
  const updates = [];
  await downloadJourney("film", { fetcher: async () => new Response("video"), onProgress: (p, bytes) => updates.push([p, bytes]) });
  assert.deepEqual(updates[0], [0, 5]); assert.equal(updates.at(-1)[0], 1);
  await assert.rejects(downloadJourney("film", { fetcher: async () => new Response("cut", { headers: { "content-length": "50" } }) }), /Incomplete/);
});

function scrollFixture() {
  const listeners = new Map(), scrolls = [];
  function style() {
    const props = new Map();
    return { setProperty: (k, v, p = "") => props.set(k, [v, p]), getPropertyValue: k => props.get(k)?.[0] || "",
      getPropertyPriority: k => props.get(k)?.[1] || "", removeProperty: k => props.delete(k) };
  }
  const document = { documentElement: { style: style() }, body: { style: style() } };
  const browser = { document, history: { scrollRestoration: "auto" }, scrollTo: o => scrolls.push(o),
    addEventListener: (name, fn, opts) => listeners.set(name, { fn, opts }), removeEventListener: name => listeners.delete(name) };
  function fire(type, extra = {}) {
    let prevented = false;
    listeners.get(type)?.fn({ type, cancelable: true, preventDefault: () => { prevented = true; }, ...extra });
    return prevented;
  }
  return { document, browser, listeners, scrolls, fire };
}
test("opening lock covers native wheel, touch and scroll keys, and restores all document state", () => {
  const f = scrollFixture(); f.document.body.style.setProperty("position", "relative", "important");
  const unlock = lockJourneyOpening(f);
  assert.equal(f.document.body.style.getPropertyValue("position"), "fixed");
  assert.equal(f.browser.history.scrollRestoration, "manual");
  assert.equal(f.fire("wheel"), true); assert.equal(f.fire("touchmove"), true);
  for (const key of ["ArrowDown", "PageDown", " ", "End", "Home"]) assert.equal(f.fire("keydown", { key }), true);
  assert.equal(f.listeners.get("touchmove").opts.passive, false);
  unlock();
  assert.equal(f.document.body.style.getPropertyValue("position"), "relative");
  assert.equal(f.document.body.style.getPropertyPriority("position"), "important");
  assert.equal(f.document.documentElement.style.getPropertyValue("overflow"), "");
  assert.equal(f.browser.history.scrollRestoration, "auto");
  assert.equal(f.listeners.size, 0); assert.equal(f.scrolls.at(-1).top, 0);
});
test("scroll lock preserves zoom, Tab, Enter and keyboard Retry activation", () => {
  const f = scrollFixture(), unlock = lockJourneyOpening(f);
  for (const key of ["Tab", "Enter"]) assert.equal(f.fire("keydown", { key }), false);
  assert.equal(f.fire("keydown", { key: " ", target: { closest: () => ({}) } }), false);
  assert.equal(f.fire("wheel", { ctrlKey: true }), false);
  assert.equal(f.fire("touchmove", { touches: [{}, {}] }), false);
  unlock();
});

const compiled = buildSync({ entryPoints: [fileURLToPath(new URL("./GardenOpening.jsx", import.meta.url))], bundle: true, write: false,
  platform: "node", format: "cjs", jsx: "automatic", packages: "external", logLevel: "silent" }).outputFiles[0].text;
const loaded = { exports: {} };
runInNewContext(compiled, { module: loaded, exports: loaded.exports, require: createRequire(import.meta.url) });
const render = status => renderToStaticMarkup(React.createElement(loaded.exports.default, { opening: { status, progress: 66 } }));
test("loading and slow UI have progress but no CV link or premature explore button", () => {
  for (const status of ["loading", "slow"]) {
    assert.match(render(status), /role="progressbar"[^>]*aria-valuenow="66"/);
    assert.doesNotMatch(render(status), /href=|<button|Skip|keep browsing/);
  }
});
test("ready UI starts a journey, and failure UI offers only Retry", () => {
  assert.match(render("ready"), /<button[^>]*data-journey="true"[^>]*>Explore my work/);
  assert.match(render("error"), /role="alert"/); assert.match(render("error"), /Retry loading/);
  assert.doesNotMatch(render("error"), /href=|Skip|Explore my work/);
});

const portfolioCode = buildSync({ entryPoints: [fileURLToPath(new URL("./CameraPortfolio.jsx", import.meta.url))], bundle: true, write: false,
  platform: "node", format: "cjs", jsx: "automatic", external: ["react", "react-dom"], loader: { ".css": "empty" }, logLevel: "silent" }).outputFiles[0].text;
test("system and legacy motion settings cannot select a static path or bypass the garden", t => {
  // This test inspects initial HTML only; neither effect runs in SSR.
  t.mock.method(React, "useLayoutEffect", React.useEffect);
  for (const reduced of [false, true]) for (const saved of [null, "off", "on"]) {
    const module = { exports: {} };
    runInNewContext(portfolioCode, { module, exports: module.exports, require: createRequire(import.meta.url),
      matchMedia: () => ({ matches: reduced }), localStorage: { getItem: key => key === "garden.motion" ? saved : null } });
    const html = renderToStaticMarkup(React.createElement(module.exports.default));
    assert.match(html, /data-journey-complete="false" data-loading="true"/);
    assert.match(html, /<section id="experience" class="editor-resume camera-cv-pending" inert="" aria-hidden="true"><\/section>/);
    assert.doesNotMatch(html, /id="about"|id="contact"|id="stealth"|Skip to|Continue|camera-motion|Motion off/);
    assert.match(html, /class="camera-skip" disabled=""/);
    assert.match(html, /data-motion="on"/);
    assert.match(html, /Start garden tour/);
  }
});
