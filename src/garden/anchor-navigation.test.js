import assert from "node:assert/strict";
import test from "node:test";
import { anchorScrollTop, hashTargetId, installAnchorNavigation, localAnchor, plainAnchorActivation } from "./anchor-navigation.js";

const currentUrl = "http://localhost:5173/?mode=preview#home";
test("only valid same-document fragments are resolved, without CSS selectors", () => {
  assert.deepEqual(localAnchor("#about", currentUrl), { id: "about", hash: "#about" });
  assert.deepEqual(localAnchor("?mode=preview#experience", currentUrl), { id: "experience", hash: "#experience" });
  assert.equal(localAnchor("https://elsewhere.test/#about", currentUrl), null);
  assert.equal(localAnchor("/other#about", currentUrl), null);
  assert.equal(localAnchor("?mode=other#about", currentUrl), null);
  assert.equal(localAnchor("mailto:contact@yanivakiva.com", currentUrl), null);
  assert.equal(localAnchor("javascript:alert(1)", currentUrl), null);
  assert.equal(localAnchor("#", currentUrl), null);
  assert.equal(hashTargetId("#caf%C3%A9"), "café");
  assert.equal(hashTargetId("#%E0%A4%A"), null);
  assert.equal(hashTargetId(null), null);
  assert.equal(hashTargetId("about"), null);
});

test("modified, secondary, download, new-tab, prevented and inert activations remain native", () => {
  assert.equal(plainAnchorActivation({ button: 0 }), true);
  assert.equal(plainAnchorActivation({ button: 0 }, { target: "_SELF" }), true);
  for (const flag of ["metaKey", "ctrlKey", "shiftKey", "altKey", "defaultPrevented"]) {
    assert.equal(plainAnchorActivation({ button: 0, [flag]: true }), false);
  }
  assert.equal(plainAnchorActivation({ button: 1 }), false);
  assert.equal(plainAnchorActivation({ button: 2 }), false);
  for (const options of [{ download: true }, { inert: true }, { target: "_blank" }, { target: "other-frame" }]) {
    assert.equal(plainAnchorActivation({ button: 0 }, options), false);
  }
});

test("anchor position explicitly subtracts only the target scroll margin", () => {
  assert.equal(anchorScrollTop(300, 2500, "106px"), 2694);
  assert.equal(anchorScrollTop(-500, 500, "0px"), 0);
  assert.equal(anchorScrollTop(15, 0, "106px"), 0);
  assert.equal(anchorScrollTop(200, 300, "auto"), 500);
  assert.equal(anchorScrollTop(200, 300, "-10px"), 510);
  assert.equal(anchorScrollTop(NaN, 300, 0), null);
});

function fixture(hash = "", options = {}) {
  const callbacks = new Map(), frames = new Map(), rootCallbacks = new Map();
  const scrolls = [], pushes = [], focused = [], order = [];
  let frameId = 0;
  const browser = {
    scrollY: 0,
    location: { href: `http://localhost:5173/${hash}`, hash },
    history: { state: { preserved: true }, pushState(state, title, next) {
      pushes.push({ state, next }); setLocation(next);
    } },
    scrollTo(options) { scrolls.push(options); browser.scrollY = options.top; order.push("scroll"); },
    getComputedStyle: node => ({ scrollMarginTop: node.margin }),
    requestAnimationFrame(callback) { frames.set(++frameId, callback); return frameId; },
    cancelAnimationFrame(id) { frames.delete(id); },
    addEventListener(name, callback) { callbacks.set(name, callback); },
    removeEventListener(name, callback) { if (callbacks.get(name) === callback) callbacks.delete(name); },
  };
  function setLocation(next) {
    const url = new URL(next, browser.location.href);
    browser.location.href = url.href; browser.location.hash = url.hash;
  }
  function node(id, top, margin = "0px", attributes = {}) {
    const attrs = new Map(Object.entries(attributes)), listeners = new Map();
    return { id, local: true, margin,
      getBoundingClientRect: () => ({ top: top - browser.scrollY }),
      closest: () => null,
      hasAttribute: key => attrs.has(key), getAttribute: key => attrs.get(key) ?? null,
      setAttribute: (key, value) => attrs.set(key, value), removeAttribute: key => attrs.delete(key),
      addEventListener: (name, callback) => listeners.set(name, callback),
      removeEventListener: name => listeners.delete(name),
      focus(options) { focused.push({ id, options }); order.push("focus"); },
      blur() { listeners.get("blur")?.(); },
    };
  }
  const targets = {
    home: node("home", 0),
    experience: node("experience", 3200, "0px", { tabindex: "-1" }),
    about: node("about", 6000, "106px", { tabindex: "-1" }),
  };
  const root = {
    contains: node => Boolean(node?.local),
    addEventListener: (name, callback) => rootCallbacks.set(name, callback),
    removeEventListener: name => rootCallbacks.delete(name),
  };
  const stop = installAnchorNavigation({ browser, document: { getElementById: id => targets[id] }, root, onNavigate: () => order.push("reading-update"), ...options });
  function flushFrame() {
    const current = [...frames.entries()];
    current.forEach(([id]) => frames.delete(id)); current.forEach(([, callback]) => callback());
  }
  function click(href, options = {}) {
    const attrs = { href, ...options.attributes };
    const link = { local: true, getAttribute: name => attrs[name] ?? null,
      hasAttribute: name => Object.hasOwn(attrs, name),
      closest: selector => selector === "a[href]" ? link : options.inert ? {} : null,
    };
    let prevented = false;
    rootCallbacks.get("click")?.({ target: link, button: 0, ...options.event, preventDefault() { prevented = true; } });
    return prevented;
  }
  return { browser, targets, stop, scrolls, pushes, focused, order, flushFrame, click, setLocation, emit: name => callbacks.get(name)?.(), callbacks, rootCallbacks };
}

test("initial hidden-target hash scrolls after mount, updates reading, then focuses", () => {
  const f = fixture("#about");
  assert.equal(f.scrolls.length, 0);
  f.flushFrame();
  assert.deepEqual(f.scrolls, [{ top: 5894, behavior: "instant" }]);
  assert.deepEqual(f.order, ["scroll", "reading-update"]);
  f.flushFrame();
  assert.deepEqual(f.focused, [{ id: "about", options: { preventScroll: true } }]);
  assert.deepEqual(f.order, ["scroll", "reading-update", "focus"]);
  assert.equal(f.pushes.length, 0);
  f.stop();
});

test("a selected-role destination is revealed before its position is measured", () => {
  let revealed = false;
  const f = fixture("#about", { onResolveTarget: id => { if (id === "about") revealed = true; } });
  f.targets.about.getBoundingClientRect = () => ({ top: revealed ? 6000 - f.browser.scrollY : 0 });
  f.flushFrame();
  assert.equal(revealed, true);
  assert.equal(f.scrolls.at(-1).top, 5894);
  f.flushFrame();
  assert.equal(f.focused.at(-1).id, "about");
  f.stop();
});

test("delegated tour navigation defers focus, while a newer anchor invalidates its completion", () => {
  const jobs=[];let cancellations=0;
  const f=fixture("",{scrollTo:options=>{jobs.push(options);return()=>cancellations++;}});f.flushFrame();
  f.click("#experience",{attributes:{"data-journey":"true"}});f.flushFrame();
  assert.equal(jobs[0].immediate,false);assert.equal(jobs[0].link.getAttribute("data-journey"),"true");
  assert.equal(f.focused.length,0);assert.equal(f.scrolls.length,0);
  f.click("#about");assert.equal(cancellations,1);
  jobs[0].onComplete();f.flushFrame();assert.equal(f.focused.length,0);
  jobs[1].onComplete();f.flushFrame();assert.equal(f.focused.at(-1).id,"about");f.stop();
});

test("initial hash and history always request immediate navigation, never an automatic tour", () => {
  const jobs=[];const f=fixture("#experience",{scrollTo:options=>{jobs.push(options);return()=>{};}});
  f.flushFrame();assert.equal(jobs[0].immediate,true);assert.equal(jobs[0].link,undefined);
  f.setLocation("#home");f.emit("popstate");f.flushFrame();assert.equal(jobs[1].immediate,true);f.stop();
});

test("plain local clicks preserve history state and repeated hashes do not duplicate entries", () => {
  const f = fixture(); f.flushFrame();
  assert.equal(f.click("#experience"), true);
  assert.equal(f.scrolls.at(-1).top, 3200);
  assert.deepEqual(f.pushes, [{ state: { preserved: true }, next: "#experience" }]);
  f.flushFrame();
  assert.equal(f.targets.experience.getAttribute("tabindex"), "-1");
  f.browser.scrollY += 200;
  assert.equal(f.browser.location.hash, "#experience", "Manual scrolling never changes the hash");
  assert.equal(f.click("#experience"), true);
  assert.equal(f.pushes.length, 1);
  assert.equal(f.scrolls.at(-1).top, 3200);
  f.stop();
});

test("history traversal navigates valid hashes without pushing and leaves empty/invalid hashes native", () => {
  const f = fixture("#experience"); f.flushFrame(); f.flushFrame();
  f.setLocation("#about"); f.emit("popstate"); f.emit("hashchange");
  f.flushFrame(); f.flushFrame();
  assert.equal(f.scrolls.length, 2, "popstate + hashchange coalesce into one navigation");
  assert.equal(f.focused.at(-1).id, "about");
  assert.equal(f.pushes.length, 0);
  for (const hash of ["", "#missing", "#%E0%A4%A"]) {
    f.setLocation(`/${hash}`); f.emit("popstate"); f.flushFrame(); f.flushFrame();
    assert.equal(f.scrolls.length, 2);
  }
  f.stop();
});

test("invalid and external clicks do not intercept or mutate history", () => {
  const f = fixture(); f.flushFrame();
  for (const href of ["#missing", "#%E0%A4%A", "#", "https://elsewhere.test/#about", "/different#about", "mailto:contact@yanivakiva.com"]) {
    assert.equal(f.click(href), false);
  }
  assert.equal(f.click("#about", { event: { ctrlKey: true } }), false);
  assert.equal(f.click("#about", { attributes: { download: "" } }), false);
  assert.equal(f.click("#about", { attributes: { target: "_blank" } }), false);
  assert.equal(f.click("#about", { inert: true }), false);
  assert.equal(f.pushes.length, 0); assert.equal(f.scrolls.length, 0);
  f.stop();
});

test("home gets a temporary focus target, and cleanup cancels listeners and pending work", () => {
  const f = fixture(); f.flushFrame();
  assert.equal(f.click("#home"), true); f.flushFrame();
  assert.equal(f.focused.at(-1).id, "home");
  assert.equal(f.targets.home.getAttribute("tabindex"), "-1");
  f.targets.home.blur(); assert.equal(f.targets.home.hasAttribute("tabindex"), false);
  f.click("#about"); f.stop(); f.flushFrame();
  assert.equal(f.focused.at(-1).id, "home");
  assert.equal(f.callbacks.size, 0); assert.equal(f.rootCallbacks.size, 0);
});
