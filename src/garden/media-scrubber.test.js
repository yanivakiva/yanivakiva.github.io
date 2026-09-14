import assert from "node:assert/strict";
import test from "node:test";
import { createMediaScrubber } from "./media-scrubber.js";

function harness({ ready = 2, frames = true } = {}) {
  const listeners = new Map(), rafs = new Map(), callbacks = new Map(), seeks = [], painted = [];
  let sequence = 0, time = 0, errors = 0;
  const video = { readyState: ready, seeking: false, paused: true, src: "/film.mp4",
    get currentTime() { return time; },
    set currentTime(value) { seeks.push(value); time = value; this.seeking = true; },
    addEventListener(n, f) { listeners.set(n, f); }, removeEventListener(n) { listeners.delete(n); },
    pause() { this.paused = true; }, removeAttribute() { this.src = ""; }, load() {},
  };
  if (frames) {
    video.requestVideoFrameCallback = f => { const id = ++sequence; callbacks.set(id, f); return id; };
    video.cancelVideoFrameCallback = id => callbacks.delete(id);
  }
  const player = createMediaScrubber(video, { count: 386, fps: 24, onFrame: f => painted.push(f), onError: () => errors++,
    requestFrame: f => { const id = ++sequence; rafs.set(id, f); return id; }, cancelFrame: id => rafs.delete(id) });
  const tick = () => { const work = [...rafs.values()]; rafs.clear(); work.forEach(f => f()); };
  const emit = name => listeners.get(name)?.();
  const finish = () => {
    video.seeking = false;
    const work = [...callbacks.values()]; callbacks.clear(); work.forEach(f => f(0, { mediaTime: time }));
    emit("seeked");
  };
  return { video, player, seeks, painted, callbacks, rafs, tick, emit, finish, get errors() { return errors; } };
}
test("scroll updates coalesce without restarting an in-flight network seek", () => {
  const h = harness(); h.emit("loadeddata"); h.player.request(10); h.tick();
  assert.equal(h.seeks.length, 1);
  for (let frame = 11; frame < 200; frame++) { h.player.request(frame); h.tick(); }
  assert.equal(h.seeks.length, 1, "Never repeatedly overwrite currentTime while seeking");
  h.finish(); h.tick();
  assert.equal(h.seeks.length, 2); assert.ok(Math.abs(h.seeks.at(-1) - 199 / 24) < .001);
  h.finish(); assert.equal(h.painted.at(-1), 199); h.player.destroy();
});
test("rapid reversal goes to the latest target, not a queue of obsolete frames", () => {
  const h = harness(); h.player.request(300); h.tick(); h.player.request(385); h.player.request(4); h.tick();
  assert.equal(h.seeks.length, 1); h.finish(); h.tick();
  assert.ok(Math.abs(h.seeks.at(-1) - 4 / 24) < .001); h.finish(); assert.equal(h.painted.at(-1), 4);
  h.player.destroy();
});
test("slow initial media loading never owns or blocks scroll; readiness starts the latest seek", () => {
  const h = harness({ ready: 0 }); h.player.request(180); h.tick(); assert.equal(h.seeks.length, 0);
  assert.equal(h.player.ready(180), false); h.video.readyState = 2; h.emit("loadeddata"); h.tick();
  assert.ok(Math.abs(h.seeks[0] - 180 / 24) < .001); h.finish(); assert.equal(h.player.ready(180), true);
  h.player.destroy();
});
test("older browsers publish on seeked, and errors request only one fallback", () => {
  const h = harness({ frames: false }); h.player.request(385); h.tick(); h.finish();
  assert.equal(h.painted.at(-1), 385); h.emit("error"); h.emit("error"); assert.equal(h.errors, 1);
  h.player.request(0); h.tick(); assert.equal(h.seeks.length, 1); h.player.destroy();
});
test("unmount releases media, callback and animation resources", () => {
  const h = harness(); h.player.request(12); h.player.destroy(); h.tick(); h.finish();
  assert.equal(h.seeks.length, 0); assert.equal(h.callbacks.size, 0); assert.equal(h.rafs.size, 0);
  assert.equal(h.video.src, ""); assert.equal(h.painted.length, 0);
});

test("a delayed compositor callback cannot roll back a completed seek", () => {
  const h = harness(); h.player.request(120); h.tick(); h.finish();
  assert.equal(h.painted.at(-1), 120);
  const callbacks = [...h.callbacks.values()]; h.callbacks.clear();
  callbacks.forEach(callback => callback(0, { mediaTime: 1 }));
  assert.equal(h.painted.at(-1), 120);
  h.player.destroy();
});
