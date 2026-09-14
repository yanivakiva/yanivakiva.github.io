import test from "node:test";
import assert from "node:assert/strict";
import { createJourneyScroll, restoreTourFocus, tourEase } from "./scroll-controller.js";

function fixture({ ready = true, keyboard = false } = {}) {
  const events = new Map(), frames = new Map(), states = [], scrolls = [], rafTimes = [];
  let frameId = 0, options, completed = 0, checks = 0, destroyed = false, lastClock = null;
  const document = { hidden: false };
  const browser = {
    scrollY: 0, innerHeight: 800,
    addEventListener: (name, callback) => events.set(name, callback),
    removeEventListener: name => events.delete(name),
    requestAnimationFrame(callback) { frames.set(++frameId, callback); return frameId; },
    cancelAnimationFrame: id => frames.delete(id),
  };
  const smooth = {
    targetScroll: 0, animatedScroll: 0,
    scrollTo(top, settings) { scrolls.push({ top, settings }); browser.scrollY = top; this.targetScroll = this.animatedScroll = top; },
    stop() { this.targetScroll = this.animatedScroll = browser.scrollY; },
    start() { this.targetScroll = this.animatedScroll = browser.scrollY; },
    resize() { this.targetScroll = this.animatedScroll = browser.scrollY; },
    // Exercise position changes, not just RAF calls. Lenis uses this
    // frame-rate-independent damping for its lerp animation.
    raf(time) {
      rafTimes.push(time);
      if (lastClock !== null) {
        const gap = this.targetScroll - this.animatedScroll;
        this.animatedScroll += gap * (1 - Math.exp(-options.lerp * 60 * (time - lastClock) / 1000));
        if (Math.abs(this.targetScroll - this.animatedScroll) < .5) this.animatedScroll = this.targetScroll;
        browser.scrollY = this.animatedScroll;
      }
      lastClock = time;
    },
    destroy() { destroyed = true; },
  };
  const playback = { current: { travel: 1000, ensurePosition() { checks++; return ready; } } };
  const controller = createJourneyScroll({ browser, document, playback, onTour: state => states.push(state),
    createSmooth(settings) { options = settings; return smooth; } });
  const target = { getBoundingClientRect: () => ({ top: 1000 - browser.scrollY }) };
  const link = { getAttribute: key => key === "data-journey" ? "true" : null, matches: selector => selector === ":focus-visible" && keyboard };
  const tick = time => {
    const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(callback => callback(time));
  };
  return { controller, browser, document, playback, smooth, states, scrolls, rafTimes, tick, target, link,
    get options() { return options; }, get completed() { return completed; }, get checks() { return checks; },
    get destroyed() { return destroyed; }, get pendingFrames() { return frames.size; }, get eventCount() { return events.size; },
    setReady: value => { ready = value; },
    start: () => controller.navigate({ top: 1000, target, link, immediate: false, onComplete: () => completed++ }),
    emit: (type, extra = {}) => events.get(type)?.({ type, ...extra }),
  };
}

test("tour easing stays bounded", () => {
  assert.equal(tourEase(-1), 0); assert.equal(tourEase(0), 0);
  assert.equal(tourEase(1), 1); assert.equal(tourEase(2), 1);
  assert.ok(Math.abs(tourEase(.5) - .5) < 1e-8);
});

test("Pause retains elapsed progress and Resume continues without a wall-clock jump", () => {
  const f = fixture(), reference = fixture();
  f.start(); reference.start(); f.tick(0); reference.tick(0); f.tick(32); reference.tick(32);
  const position = f.browser.scrollY, checks = f.checks;
  f.controller.pause(); f.controller.pause();
  assert.deepEqual(f.states.at(-1), { paused: true, keyboard: false });
  f.tick(200); f.tick(900); f.tick(5000);
  assert.equal(f.browser.scrollY, position); assert.equal(f.checks, checks);
  assert.equal(f.completed, 0);
  f.controller.resume(); f.controller.resume();
  assert.deepEqual(f.states.at(-1), { paused: false, keyboard: false });
  f.tick(6000); assert.equal(f.browser.scrollY, position);
  f.tick(6032); reference.tick(64);
  assert.equal(f.browser.scrollY, reference.browser.scrollY);
  assert.equal(f.states.length, 3, "Repeated Pause/Resume calls are idempotent");
  f.controller.destroy(); reference.controller.destroy();
});

test("tour state marks keyboard activation without requesting focus for mouse activation", () => {
  for (const keyboard of [false, true]) {
    const f = fixture({ keyboard }); f.start();
    assert.deepEqual(f.states, [{ paused: false, keyboard }]);
    f.controller.pause(); assert.equal(f.states.at(-1).keyboard, keyboard);
    f.controller.destroy();
  }
});

test("Space and pointer/touch activation can reach the persistent Pause/Resume and Skip controls", () => {
  const f = fixture(); f.start();
  const button = { closest: selector => ["a, button", "button"].includes(selector) ? button : null };
  const link = { closest: selector => selector === "a, button" ? link : null };
  for (const type of ["pointerdown", "touchstart"]) {
    for (const target of [button, link]) f.emit(type, { target });
  }
  f.emit("keydown", { key: " ", target: button });
  f.emit("keydown", { key: "Enter", target: button });
  assert.equal(f.states.length, 1, "Activation must not unmount controls before their click runs");
  f.controller.pause(); f.emit("keydown", { key: " ", target: button }); f.controller.resume();
  assert.deepEqual(f.states.at(-1), { paused: false, keyboard: false });
  f.emit("touchmove", { target: button });
  assert.equal(f.states.at(-1), null, "A drag beginning on a button is still a native scroll interruption");
  f.controller.destroy();
});

test("native user input cancels playing or paused tours without invoking their completion", () => {
  for (const paused of [false, true]) {
    for (const [type, extra] of [["wheel", {}], ["touchstart", {}], ["touchmove", {}], ["pointerdown", {}], ["keydown", { key: "Escape" }]]) {
      const f = fixture(); f.start(); f.tick(0); f.tick(32);
      if (paused) f.controller.pause();
      const position = f.browser.scrollY;
      f.emit(type, extra); f.tick(64);
      assert.equal(f.states.at(-1), null); assert.equal(f.completed, 0);
      assert.equal(f.browser.scrollY, position);
      f.controller.resume(); assert.equal(f.states.at(-1), null, "Cancelled tours cannot unexpectedly restart");
      f.controller.destroy();
    }
  }
});

test("keyboard, scrollbar/touch, print and explicit cancellation reset ordinary wheel inertia", () => {
  for (const [type, extra] of [["keydown", { key: "Home" }], ["keydown", { key: "PageDown" }], ["keydown", { key: "End" }], ["pointerdown", {}], ["touchstart", {}], ["touchmove", {}], ["beforeprint", {}], [null, {}]]) {
    const f = fixture();
    f.browser.scrollY = 123; f.smooth.animatedScroll = 123; f.smooth.targetScroll = 600;
    if (type) f.emit(type, extra); else f.controller.cancel();
    assert.equal(f.smooth.targetScroll, 123); assert.equal(f.smooth.animatedScroll, 123);
    assert.equal(f.browser.scrollY, 123); assert.equal(f.states.length, 0);
    assert.equal(f.scrolls.length, 0, "Native interruption must not write a scroll that masks the browser's following event");
    f.controller.destroy();
  }
});

test("ordinary wheel input preserves the requested distance and immediately reverses its target", () => {
  const f = fixture();
  f.browser.scrollY = 100; f.smooth.animatedScroll = 100; f.smooth.targetScroll = 500;
  f.emit("wheel"); assert.equal(f.smooth.targetScroll, 500);
  const forward = { deltaX: 0, deltaY: 200, event: { type: "wheel" } };
  f.options.virtualScroll(forward);
  assert.equal(forward.deltaY, 200); assert.equal(f.smooth.targetScroll, 500);
  const oversized = { deltaX: 0, deltaY: 4000, event: { type: "wheel" } };
  f.options.virtualScroll(oversized);
  assert.equal(oversized.deltaY, 4000, "Large wheel input must not be discarded by a garden debt cap");
  const reverse = { deltaX: 0, deltaY: -60, event: { type: "wheel" } };
  f.options.virtualScroll(reverse);
  assert.equal(f.smooth.targetScroll + reverse.deltaY, 40);
  f.controller.destroy();
});

test("manual scrolling keeps moving in both directions even when no next image is ready", () => {
  for (const [from, target] of [[0, 950], [950, 0], [1200, 0]]) {
    const f = fixture({ ready: false });
    f.browser.scrollY = f.smooth.animatedScroll = from;
    f.smooth.targetScroll = target;
    f.tick(0); f.tick(16);
    assert.ok(Math.abs(f.browser.scrollY - from) > 90, "First wheel movement must not wait for decoding");
    for (let time = 32; time <= 1504; time += 16) f.tick(time);
    assert.equal(f.browser.scrollY, target, "Must settle even when every image-readiness check would fail");
    assert.equal(f.checks, 0, "Manual scroll must not compete with the renderer for frame requests");
    f.controller.destroy();
  }
});

test("fast direction changes do not stall at the film or CV boundaries", () => {
  const f = fixture({ ready: false });
  f.browser.scrollY = f.smooth.animatedScroll = 1200;
  f.smooth.targetScroll = 0;
  f.tick(0); f.tick(16); f.tick(32); f.tick(48);
  assert.ok(f.browser.scrollY < 1000, "Reverse scroll must cross from the CV into the film");
  const before = f.browser.scrollY;
  const forward = { deltaX: 0, deltaY: 500, event: { type: "wheel" } };
  f.options.virtualScroll(forward); f.smooth.targetScroll += forward.deltaY;
  f.tick(64);
  assert.ok(f.browser.scrollY > before, "A reversal must move forward on the next tick");
  assert.equal(f.checks, 0); f.controller.destroy();
});

test("manual wheel inertia keeps real speed through expensive decode frames", () => {
  for (const interval of [16, 40, 100, 200]) {
    const f = fixture({ ready: false });
    f.smooth.targetScroll = 1000;
    f.tick(0);
    for (let time = interval; time < 1000; time += interval) f.tick(time);
    f.tick(1000);
    assert.ok(f.browser.scrollY > 999, `Wheel motion must settle in real time at ${interval}ms/frame`);
    assert.equal(f.rafTimes.at(-1) - f.rafTimes[0], 1000);
    f.controller.destroy();
  }
});

test("Skip and history-style immediate navigation leave a paused tour and complete only the new destination", () => {
  for (const immediate of [false, true]) {
    const f = fixture(); f.start(); f.tick(0); f.tick(32); f.controller.pause();
    let skipped = 0;
    f.controller.navigate({ top: 1800, target: f.target, immediate,
      link: { getAttribute: () => null }, onComplete: () => skipped++ });
    assert.equal(f.browser.scrollY, 1800); assert.equal(skipped, 1);
    assert.equal(f.completed, 0); assert.equal(f.states.at(-1), null);
    f.tick(64); assert.equal(f.completed, 0); assert.equal(skipped, 1);
    f.controller.destroy();
  }
});

test("slow decoding does not stall the tour, but hidden/long-frame guards still pause its clock", () => {
  const f = fixture({ ready: false }); f.start(); f.tick(0); f.tick(32);
  assert.ok(f.browser.scrollY > 0, "The clock must advance without lowering image resolution or waiting on every frame");
  f.setReady(true); f.tick(64); const position = f.browser.scrollY;
  assert.ok(position > 0);
  f.tick(1200); assert.equal(f.browser.scrollY, position, "A >1000ms gap must not catch up");
  f.document.hidden = true; f.tick(1232); assert.equal(f.browser.scrollY, position);
  f.document.hidden = false; f.tick(1264); assert.ok(f.browser.scrollY > position);
  f.controller.destroy();
});

for (const ready of [true, false]) test(`the tour reaches the CV in five seconds with decode readiness ${ready}`, () => {
  const f = fixture({ ready }); f.start();
  assert.equal(f.options.lerp, .12); assert.equal(f.options.wheelMultiplier, 1.2);
  for (let time = 0; time <= 4992; time += 32) f.tick(time);
  assert.equal(f.completed, 0);
  assert.ok(f.browser.scrollY > 990);
  f.tick(5024);
  assert.equal(f.browser.scrollY, 1000); assert.equal(f.completed, 1); assert.equal(f.states.at(-1), null);
  f.tick(15000); assert.equal(f.completed, 1);
  f.controller.destroy();
});

test("a lower frame rate does not stretch the five-second guided tour", () => {
  for (const frameInterval of [40, 100, 200]) {
    const f = fixture({ ready: false }); f.start();
    for (let time = 0; time < 5000; time += frameInterval) f.tick(time);
    assert.equal(f.completed, 0);
    f.tick(5000);
    assert.equal(f.completed, 1);
    assert.equal(f.browser.scrollY, 1000);
    f.controller.destroy();
  }
});

test("focus returns to a persistent control only when the disappearing tour subtree owns it", () => {
  const owned = {}, outside = {}, focusCalls = [];
  const controls = { contains: element => element === owned };
  const fallback = { focus: options => focusCalls.push(options) };
  restoreTourFocus(controls, fallback, outside); restoreTourFocus(null, fallback, owned);
  assert.equal(focusCalls.length, 0);
  restoreTourFocus(controls, fallback, owned);
  assert.deepEqual(focusCalls, [{ preventScroll: true }]);
});

test("destroy cancels paused tours and releases all input listeners and RAF work", () => {
  const f = fixture(); f.start(); f.controller.pause(); f.controller.destroy();
  assert.equal(f.states.at(-1), null); assert.equal(f.completed, 0);
  assert.equal(f.pendingFrames, 0); assert.equal(f.eventCount, 0); assert.equal(f.destroyed, true);
});
