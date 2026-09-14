import test from "node:test";
import assert from "node:assert/strict";
import { clamp, coverRect, frameAt, FrameCache, screenMatrix } from "./camera-math.js";
import { portalGeometry } from "./cinematic-math.js";
import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";

async function settle(cache) {
  const deadline = Date.now() + 1000;
  while (cache.pending.size || cache.queue.length) {
    assert.ok(Date.now() < deadline, "Frame cache did not settle");
    await new Promise(resolve => setTimeout(resolve, 1));
  }
}

const flushLoads = () => new Promise(resolve => setImmediate(resolve));
const residentBytes = cache => [...cache.frames.values()].reduce((sum, frame) => sum + frame.width * frame.height * 4, 0);
function controlledFrames({ width = 3200, height = 1800, decoding = true } = {}) {
  const jobs = new Map(), started = [], bitmaps = [];
  let active = 0, peak = 0;
  return {
    jobs, started, bitmaps,
    get active() { return active; }, get peak() { return peak; },
    load(index, signal, { onDecodeStart }) {
      started.push(index); active++; peak = Math.max(peak, active);
      if (decoding) assert.equal(onDecodeStart(), true);
      return new Promise(resolve => jobs.set(index, { signal, onDecodeStart, finish() {
        assert.ok(jobs.delete(index), "A load must settle only once"); active--;
        const frame = { index, width, height, closed: false, close() {
          assert.equal(this.closed, false, "A bitmap must be closed only once"); this.closed = true;
        } };
        bitmaps.push(frame); resolve(frame);
      } }));
    },
  };
}
async function finishControlledLoads(loader) {
  let batches = 0;
  while (loader.jobs.size) {
    assert.ok(++batches < 100, "Controlled frame loads did not settle");
    [...loader.jobs.values()].forEach(job => job.finish());
    await flushLoads();
  }
}

test("frame selection is bounded, deterministic and reversible", () => {
  assert.equal(frameAt(-1, 360), 0); assert.equal(frameAt(1.5, 360), 359);
  const samples = Array.from({ length: 101 }, (_, i) => i / 100);
  assert.deepEqual(samples.map(p => frameAt(p, 360)).reverse(), samples.reverse().map(p => frameAt(p, 360)));
  assert.equal(clamp(.25), .25);
});
test("cover geometry preserves aspect ratio and centers the crop", () => {
  assert.deepEqual(coverRect(1600, 900, 800, 450), { x:0, y:0, width:800, height:450 });
  const portrait = coverRect(720, 1000, 390, 844);
  assert.equal(portrait.height, 844); assert.ok(portrait.x < 0); assert.equal(portrait.y, 0);
});
test("projective screen mapping aligns all four corners", () => {
  const destinations = [[10,20],[230,35],[220,155],[0,170]];
  const matrix = screenMatrix(destinations, 1000, 625);
  [[0,0],[1000,0],[1000,625],[0,625]].forEach(([x,y], i) => {
    const w = matrix[3] * x + matrix[7] * y + 1;
    assert.ok(Math.abs((matrix[0] * x + matrix[4] * y + matrix[12]) / w - destinations[i][0]) < .0001);
    assert.ok(Math.abs((matrix[1] * x + matrix[5] * y + matrix[13]) / w - destinations[i][1]) < .0001);
  });
});
test("cache bounds decoded memory and closes evicted bitmaps", async () => {
  let closed = 0, painted = [];
  const cache = new FrameCache({ count: 60, budget: 4 * 10 * 10 * 4,
    load: async index => ({ index, width:10, height:10, close: () => closed++ }),
    paint: (_, index) => painted.push(index) });
  cache.request(30); await settle(cache);
  assert.equal(cache.frames.size, 4); assert.ok(cache.frames.has(30)); assert.equal(closed, 0);
  assert.equal(painted.at(-1), 30);
  cache.request(5); await settle(cache);
  assert.equal(cache.frames.size, 4); assert.ok(closed > 0);
  assert.ok(cache.frames.has(5)); assert.equal(painted.at(-1), 5);
  cache.destroy(); assert.equal(cache.frames.size, 0);
});
for (const [variant, width, height, budget] of [
  ["wide", 1600, 900, 84 * 1024 * 1024],
  ["portrait", 720, 1000, 40 * 1024 * 1024],
]) test(`${variant}: budgeted prefetch does not reload or repaint a stable target`, async () => {
  let loads = 0, paints = 0;
  const cache = new FrameCache({ count: 360, budget,
    load: async () => { loads++; return { width, height, close() {} }; },
    paint: () => paints++ });
  cache.request(180); await settle(cache);
  const capacity = Math.floor(budget / (width * height * 4));
  assert.equal(cache.frames.size, capacity);
  assert.equal(loads, capacity);
  assert.equal(paints, 1, "Neighbor arrivals should not repaint the exact target");
  cache.request(180); cache.request(180); await settle(cache);
  assert.equal(loads, capacity, "Settled neighbors must not be decoded again");
  assert.equal(paints, 1);
  cache.draw(true); assert.equal(paints, 2, "Resize can explicitly redraw the same bitmap");
  cache.destroy();
});
test("an even-capacity cache retains its reverse window on repeated requests", async () => {
  const budget = 4 * 10 * 10 * 4;
  let loads = 0;
  const painted = [];
  const cache = new FrameCache({ count: 100, budget,
    load: async index => { loads++; return { index, width: 10, height: 10, closed: false, close() { this.closed = true; } }; },
    paint: (frame, index) => { assert.equal(frame.closed, false); painted.push(index); } });
  for (const target of [20, 21, 20]) {
    cache.request(target); await settle(cache);
    assert.equal(painted.at(-1), target);
    assert.ok([...cache.frames.values()].reduce((sum, frame) => sum + frame.width * frame.height * 4, 0) <= budget);
  }
  assert.deepEqual([...cache.frames.keys()].sort((a, b) => a - b), [18, 19, 20, 21]);
  const before = { loads, paints: painted.length };
  cache.request(20); await settle(cache);
  assert.equal(loads, before.loads); assert.equal(painted.length, before.paints);
  cache.destroy();
});
test("manifest frame size bounds the first prefetch batch", async () => {
  const requests = [];
  const cache = new FrameCache({ count: 60, budget: 800, frameBytes: 400,
    load: async index => { requests.push(index); return { width: 10, height: 10, close() {} }; }, paint() {} });
  cache.request(30); await settle(cache);
  assert.deepEqual(requests, [30, 31]); assert.equal(cache.frames.size, 2);
  cache.destroy();
});
test("high-resolution decode concurrency stays bounded without changing source dimensions", async () => {
  let active = 0, peak = 0;
  const cache = new FrameCache({ count: 12, concurrency: 2, frameBytes: 3200 * 1800 * 4, budget: 144 * 1024 * 1024,
    load: async () => {
      active++; peak = Math.max(peak, active);
      await new Promise(resolve => setTimeout(resolve, 2)); active--;
      return { width: 3200, height: 1800, close() {} };
    }, paint: frame => { assert.equal(frame.width, 3200); assert.equal(frame.height, 1800); } });
  cache.request(6); await settle(cache);
  assert.equal(peak, 2); assert.ok(cache.frames.has(6)); assert.equal(cache.frames.size, 6);
  cache.destroy();
});
test("a six-frame high-resolution window aborts wrong-direction downloads without releasing their slots early", async () => {
  const jobs = new Map(), started = [], closed = [], painted = [];
  let active = 0, peak = 0;
  const cache = new FrameCache({ count: 386, concurrency: 2,
    frameBytes: 3200 * 1800 * 4, budget: 144 * 1024 * 1024,
    load: (index, signal) => {
      started.push(index); active++; peak = Math.max(peak, active);
      return new Promise(resolve => jobs.set(index, { signal, finish() {
        active--;
        resolve({ width: 3200, height: 1800, close: () => closed.push(index) });
      } }));
    }, paint: (_, index) => painted.push(index) });
  cache.request(100);
  assert.deepEqual(started, [100, 101]);
  cache.request(0);
  assert.equal(cache.candidates().length, 6);
  assert.ok(jobs.get(100).signal.aborted); assert.ok(jobs.get(101).signal.aborted);
  assert.deepEqual(started, [100, 101], "An abort cannot free a decoder before it settles");
  assert.equal(cache.pending.size, 2);
  jobs.get(100).finish();
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(started, [100, 101, 0], "The exact current target takes the first available slot");
  assert.deepEqual(closed, [100]); assert.deepEqual(painted, []);
  jobs.get(101).finish();
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(closed, [100, 101]); assert.deepEqual(painted, []);
  jobs.get(0).finish();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(painted.at(-1), 0); assert.equal(peak, 2);
  cache.destroy();
  for (const index of cache.pending.keys()) jobs.get(index).finish();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(active, 0);
});
test("useful in-flight decodes advance a fast target without freeing physical slots early", async () => {
  const loader = controlledFrames(), painted = [], budget = 144 * 1024 * 1024;
  const cache = new FrameCache({ count: 386, concurrency: 2, frameBytes: 3200 * 1800 * 4, budget,
    load: loader.load, paint: (frame, index) => {
      assert.equal(frame.closed, false); assert.ok(residentBytes(cache) <= budget); painted.push(index);
    } });
  cache.request(100); cache.request(110);
  assert.deepEqual(loader.started, [100, 101]);
  assert.equal(loader.jobs.get(100).signal.aborted, false);
  assert.equal(loader.jobs.get(101).signal.aborted, false);
  assert.equal(cache.pending.size, 2);
  loader.jobs.get(100).finish(); await flushLoads();
  assert.deepEqual(painted, [100], "A useful late image must not be discarded outside the six-frame window");
  assert.deepEqual(loader.started, [100, 101, 110], "The newest target takes the next genuinely free slot");
  loader.jobs.get(101).finish(); await flushLoads();
  assert.deepEqual(painted, [100, 101]);
  await finishControlledLoads(loader);
  assert.equal(painted.at(-1), 110); assert.ok(cache.frames.has(110));
  assert.equal(cache.frames.size, 6); assert.equal(loader.peak, 2);
  cache.destroy(); await finishControlledLoads(loader);
  assert.equal(loader.active, 0); assert.ok(loader.bitmaps.every(frame => frame.closed));
});
test("a reversal closes out-of-window decodes instead of flashing the old direction", async () => {
  const loader = controlledFrames(), painted = [];
  const cache = new FrameCache({ count: 386, concurrency: 2, frameBytes: 3200 * 1800 * 4,
    budget: 144 * 1024 * 1024, load: loader.load, paint: (_, index) => painted.push(index) });
  cache.request(100); cache.request(0);
  loader.jobs.get(100).finish(); await flushLoads();
  loader.jobs.get(101).finish(); await flushLoads();
  assert.deepEqual(painted, []);
  assert.ok(loader.bitmaps.every(frame => frame.closed), "Wrong-direction results are disposed immediately");
  assert.deepEqual(loader.started.slice(0, 4), [100, 101, 0, 1]);
  await finishControlledLoads(loader);
  assert.deepEqual(painted, [0]); assert.equal(loader.peak, 2);
  cache.destroy(); assert.ok(loader.bitmaps.every(frame => frame.closed));
});
test("rapid out-and-back reuses decodes already in flight", async () => {
  const loader = controlledFrames(), painted = [];
  const cache = new FrameCache({ count: 386, concurrency: 2, frameBytes: 3200 * 1800 * 4,
    budget: 144 * 1024 * 1024, load: loader.load, paint: (_, index) => painted.push(index) });
  cache.request(0); cache.request(80); cache.request(0);
  assert.equal(loader.jobs.get(0).signal.aborted, false);
  await finishControlledLoads(loader);
  assert.deepEqual(painted, [0]); assert.equal(loader.started.filter(index => index === 0).length, 1);
  assert.ok(cache.frames.has(0)); assert.equal(loader.peak, 2);
  cache.destroy(); assert.ok(loader.bitmaps.every(frame => frame.closed));
});
test("obsolete fetches cannot enter decoding and late aborted results are disposed", async () => {
  const loader = controlledFrames({ decoding: false }), painted = [];
  const cache = new FrameCache({ count: 386, concurrency: 2, frameBytes: 3200 * 1800 * 4,
    budget: 144 * 1024 * 1024, load: loader.load, paint: (_, index) => painted.push(index) });
  cache.request(100); cache.request(0);
  assert.equal(loader.jobs.get(100).signal.aborted, true);
  assert.equal(loader.jobs.get(100).onDecodeStart(), false);
  assert.equal(loader.started.length, 2, "An aborted fetch still owns its slot until settled");
  loader.jobs.get(100).finish(); await flushLoads();
  assert.equal(loader.bitmaps[0].closed, true); assert.deepEqual(painted, []);
  await finishControlledLoads(loader);
  assert.equal(painted.at(-1), 0); assert.equal(loader.peak, 2);
  cache.destroy(); assert.ok(loader.bitmaps.every(frame => frame.closed));
});
test("180ms network responses keep advancing while the target outruns the decoded window", async () => {
  let now = 0, jobs = [], aborted = 0;
  const painted = [], budget = 144 * 1024 * 1024;
  const cache = new FrameCache({ count: 386, concurrency: 2, frameBytes: 3200 * 1800 * 4, budget,
    load: (index, signal, { onDecodeStart }) => new Promise((resolve, reject) => {
      const job = { at: now + 180, finish() {
        if (!onDecodeStart()) return reject(new DOMException("Stale", "AbortError"));
        resolve({ width: 3200, height: 1800, close() {} });
      } };
      jobs.push(job);
      signal.addEventListener("abort", () => { aborted++; jobs = jobs.filter(j => j !== job); reject(new DOMException("Aborted", "AbortError")); }, { once: true });
    }), paint: (_, index) => painted.push({ now, index }) });
  for (now = 0; now <= 1200; now += 16) {
    cache.request(Math.floor(now / 16) * 3);
    const ready = jobs.filter(j => j.at <= now); jobs = jobs.filter(j => j.at > now);
    ready.forEach(j => j.finish()); await flushLoads();
    assert.ok(residentBytes(cache) <= budget); assert.ok(cache.pending.size <= 2);
  }
  assert.equal(aborted, 0, "Forward progress must not restart unfinished network transfers");
  assert.ok(painted.length >= 10, "The scene must move before scrolling stops");
  assert.ok(painted.at(-1).index >= 150);
  cache.destroy(); await flushLoads();
});
test("destroy disposes uncancellable decodes without painting or starting replacement work", async () => {
  const loader = controlledFrames();
  const cache = new FrameCache({ count: 386, concurrency: 2, load: loader.load,
    paint() { assert.fail("An unmounted sequence must not paint"); } });
  cache.request(0); cache.destroy();
  assert.ok([...loader.jobs.values()].every(job => job.signal.aborted && !job.onDecodeStart()));
  await finishControlledLoads(loader);
  assert.equal(loader.active, 0); assert.equal(cache.pending.size, 0); assert.equal(loader.started.length, 2);
  assert.ok(loader.bitmaps.every(frame => frame.closed));
});
for (const latency of [80, 120]) test(`${latency}ms uncancellable decodes keep advancing during 40fps target movement`, async () => {
  let now = 0, nextRequest = 0, jobs = [], active = 0, peak = 0;
  const painted = [], bitmaps = [], duration = 1200, interval = 25, budget = 144 * 1024 * 1024;
  const cache = new FrameCache({ count: 386, concurrency: 2, frameBytes: 3200 * 1800 * 4, budget,
    load: (index, signal, { onDecodeStart }) => {
      assert.equal(onDecodeStart(), true); active++; peak = Math.max(peak, active);
      return new Promise(resolve => jobs.push({ at: now + latency, finish() {
        active--; assert.equal(signal.aborted, false, "Scrolling must not abort an active decoder");
        const frame = { width: 3200, height: 1800, closed: false, close() {
          assert.equal(this.closed, false); this.closed = true;
        } };
        bitmaps.push(frame); resolve(frame);
      } }));
    },
    paint: (frame, index) => {
      assert.equal(frame.closed, false); assert.ok(residentBytes(cache) <= budget);
      painted.push({ time: now, index });
    },
  });
  // Virtual time makes the starvation regression deterministic, with no real
  // 1.2s sleep. Decode completion cannot be cancelled, as with createImageBitmap.
  while (nextRequest <= duration || jobs.length) {
    const nextCompletion = jobs.length ? Math.min(...jobs.map(job => job.at)) : Infinity;
    now = Math.min(nextRequest <= duration ? nextRequest : Infinity, nextCompletion);
    if (nextRequest <= duration && nextRequest <= nextCompletion) {
      cache.request(nextRequest / interval); nextRequest += interval;
    } else {
      const due = jobs.filter(job => job.at === now); jobs = jobs.filter(job => job.at !== now);
      due.forEach(job => job.finish());
    }
    await flushLoads();
    assert.ok(residentBytes(cache) <= budget); assert.ok(active <= 2); assert.ok(cache.pending.size <= 2);
  }
  const moving = painted.filter(frame => frame.time <= duration);
  assert.equal(moving[0].time, latency, "The scene must advance before the user stops scrolling");
  assert.ok(new Set(moving.map(frame => frame.time)).size >= Math.floor(duration / latency));
  assert.ok(moving.at(-1).index >= duration / interval - 8);
  assert.ok(painted.every((frame, i) => i === 0 || frame.index >= painted[i - 1].index), "Late results must not move a forward camera backward");
  assert.equal(painted.at(-1).index, duration / interval); assert.equal(peak, 2); assert.equal(active, 0);
  cache.destroy(); assert.ok(bitmaps.every(frame => frame.closed));
});
test("late frame decode after unmount is disposed, never painted", async () => {
  let resolve, closed = 0, painted = 0;
  const cache = new FrameCache({ count:1, load: () => new Promise(r => { resolve = r; }), paint: () => painted++ });
  cache.request(0); cache.destroy(); resolve({ width:10, height:10, close: () => closed++ });
  await new Promise(r => setTimeout(r, 0)); assert.equal(closed, 1); assert.equal(painted, 0);
});
test("failed optional frames do not blank the last painted frame", async () => {
  const painted = [];
  const cache = new FrameCache({ count: 3, load: async index => {
    if (index > 0) throw new Error("Offline"); return {width:10,height:10,close() {}};
  }, paint: (_, index) => painted.push(index) });
  cache.request(0); await new Promise(r => setTimeout(r, 10));
  cache.request(2); await new Promise(r => setTimeout(r, 10));
  assert.equal(painted.at(-1), 0); cache.destroy();
});
test("rapid out-and-back requeues an exact frame with a pending abort", async () => {
  const cache = new FrameCache({ count:100, paint() {}, load: (index, signal) => new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve({ width:10, height:10, index, close() {} }), 4);
    signal.addEventListener("abort", () => { clearTimeout(timer); setTimeout(() => reject(new Error("Aborted")), 1); });
  }) });
  cache.request(0); cache.request(80); cache.request(0);
  await new Promise(resolve => setTimeout(resolve, 100));
  assert.ok(cache.frames.has(0)); assert.equal(cache.target, 0); cache.destroy();
});
test("a completely unavailable sequence reports load failures", async () => {
  let errors = 0;
  const cache = new FrameCache({ count:3, paint() { assert.fail("No frame should paint"); }, onError: () => errors++, load: async () => { throw new Error("Network unavailable"); } });
  cache.request(0); await new Promise(resolve => setTimeout(resolve, 10));
  assert.equal(errors, 3); cache.destroy();
});
// Read the single-image AVIF layout emitted by the production encoder. This
// validates the stored image dimensions, not merely the manifest or extension.
function avifDimensions(bytes, label) {
  const dimensions = [], brands = [];
  function boxes(start, end) {
    for (let offset = start; offset < end;) {
      assert.ok(offset + 8 <= end, `${label}: truncated box header`);
      let size = bytes.readUInt32BE(offset), header = 8;
      const type = bytes.toString("ascii", offset + 4, offset + 8);
      if (size === 1) {
        assert.ok(offset + 16 <= end, `${label}: truncated extended box header`);
        size = Number(bytes.readBigUInt64BE(offset + 8)); header = 16;
      } else if (size === 0) size = end - offset;
      assert.ok(Number.isSafeInteger(size) && size >= header && offset + size <= end, `${label}: invalid ${type} box bounds`);
      const content = offset + header, limit = offset + size;
      if (type === "ftyp") {
        assert.ok(content + 8 <= limit && (limit - content) % 4 === 0, `${label}: invalid file-type box`);
        brands.push(bytes.toString("ascii", content, content + 4));
        for (let i = content + 8; i < limit; i += 4) brands.push(bytes.toString("ascii", i, i + 4));
      } else if (type === "ispe") {
        assert.ok(content + 12 <= limit, `${label}: truncated spatial extent`);
        dimensions.push([bytes.readUInt32BE(content + 4), bytes.readUInt32BE(content + 8)]);
      } else if (type === "meta" || type === "iprp" || type === "ipco") {
        const children = content + (type === "meta" ? 4 : 0);
        assert.ok(children <= limit, `${label}: truncated container`);
        boxes(children, limit);
      }
      offset = limit;
    }
  }
  boxes(0, bytes.length);
  assert.ok(brands.includes("avif"), `${label}: AVIF file-type brand is required`);
  assert.equal(dimensions.length, 1, `${label}: expected the encoder's single spatial extent`);
  return dimensions[0];
}

function assertNormalizedScreen(screen, label) {
  assert.ok(Array.isArray(screen) && screen.length === 4, `${label}: four screen corners are required`);
  screen.forEach(point => assert.ok(Array.isArray(point) && point.length === 2
    && point.every(value => Number.isFinite(value) && value >= 0 && value <= 1), `${label}: coordinates must be normalized and finite`));
  const turns = screen.map((a, i) => {
    const b = screen[(i + 1) % 4], c = screen[(i + 2) % 4];
    return (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
  });
  assert.ok(turns.every(turn => Math.abs(turn) > 1e-8 && Math.sign(turn) === Math.sign(turns[0])), `${label}: screen must be ordered, convex and nondegenerate`);
}

function assertPortalCovers(points, width, height, label) {
  const corners = [[0, 0], [width, 0], [width, height], [0, height]];
  const area = points.reduce((sum, [x, y], i) => {
    const b = points[(i + 1) % 4]; return sum + x * b[1] - y * b[0];
  }, 0);
  assert.ok(Number.isFinite(area) && Math.abs(area) > 1e-8, `${label}: projected screen has area`);
  points.forEach((a, i) => {
    const b = points[(i + 1) % 4];
    corners.forEach(corner => {
      const cross = (b[0] - a[0]) * (corner[1] - a[1]) - (b[1] - a[1]) * (corner[0] - a[0]);
      assert.ok(cross * Math.sign(area) >= -1e-8, `${label}: every viewport corner must be inside the screen`);
    });
  });
}

for (const [variant, width, height, viewports] of [
  ["wide", 3200, 1800, [[1440, 810], [844, 390], [1920, 1080], [3840, 2160]]],
  ["portrait", 1440, 2560, [[320, 568], [390, 844], [768, 1024], [820, 1180], [900, 900]]],
]) {
  const folder = new URL(`../../public/garden/cinematic/${variant}/`, import.meta.url);
  const readManifest = () => JSON.parse(readFileSync(new URL("manifest.json", folder)));
  test(`${variant}: v3 delivers all 386 full-resolution AVIF65 frames from enhanced 24fps sources`, () => {
    const manifest = readManifest();
    assert.equal(manifest.version, 3, "Promote the enhanced v3 assets; legacy v2 is not the accepted delivery contract");
    assert.equal(manifest.format, "avif"); assert.equal(manifest.quality, 65);
    assert.deepEqual([manifest.width, manifest.height], [width, height]);
    assert.equal(manifest.count, 386); assert.equal(manifest.frames.length, 386);
    assert.equal(manifest.fps, 24); assert.equal(manifest.filmEnd, .8);
    assert.ok(Array.isArray(manifest.sources)); assert.equal(manifest.sources.length, 2);
    assert.deepEqual(manifest.sources.map(source => source.clip), [`${variant}-01.mp4`, `${variant}-02.mp4`]);
    manifest.sources.forEach(source => {
      assert.ok(Number.isInteger(source.width) && source.width >= width, `${source.clip}: source width cannot be below delivery width`);
      assert.ok(Number.isInteger(source.height) && source.height >= height, `${source.clip}: source height cannot be below delivery height`);
      assert.equal(source.fps, 24, `${source.clip}: source timing must stay at 24fps`);
    });
    const files = readdirSync(folder).filter(name => name.endsWith(".avif")).sort();
    assert.deepEqual(files, Array.from({ length: 386 }, (_, i) => `${String(i).padStart(3, "0")}.avif`));
    const hashes = new Set();
    files.forEach(file => {
      const bytes = readFileSync(new URL(file, folder));
      assert.deepEqual(avifDimensions(bytes, `${variant}/${file}`), [width, height], `${file}: encoded dimensions must match delivery`);
      hashes.add(createHash("sha256").update(bytes).digest("hex"));
    });
    assert.ok(hashes.size > 30, `Only ${hashes.size} distinct frames`);
  });
  test(`${variant}: every actual tracked LCD is normalized, convex and nondegenerate`, () => {
    const manifest = readManifest();
    assert.equal(manifest.frames.length, 386);
    assert.ok(manifest.frames.at(-1).screen, "The film must finish at a tracked display");
    manifest.frames.forEach((frame, index) => {
      if (frame.screen === null) return;
      assertNormalizedScreen(frame.screen, `${variant} frame ${index}`);
      assert.ok(portalGeometry(frame.screen, manifest.width, manifest.height, width, height, 0), `${variant} frame ${index}: actual geometry must project`);
    });
  });
  test(`${variant}: actual manifest endpoint fills matching viewports by .82 without changing geometry`, () => {
    const manifest = readManifest(), screen = manifest.frames.at(-1).screen;
    assertNormalizedScreen(screen, `${variant} endpoint`);
    for (const [viewportWidth, viewportHeight] of viewports) {
      const label = `${variant} ${viewportWidth}×${viewportHeight}`;
      const initial = portalGeometry(screen, manifest.width, manifest.height, viewportWidth, viewportHeight, 0);
      const final = portalGeometry(screen, manifest.width, manifest.height, viewportWidth, viewportHeight, 1);
      assert.ok(initial && final, `${label}: actual endpoint must project`);
      assert.deepEqual(portalGeometry(screen, manifest.width, manifest.height, viewportWidth, viewportHeight, .82), final);
      assert.ok([final.scale, final.x, final.y, ...final.points.flat()].every(Number.isFinite));
      final.points.forEach(([x, y], i) => {
        assert.ok(Math.abs(x - (initial.points[i][0] * final.scale + final.x)) < 1e-8);
        assert.ok(Math.abs(y - (initial.points[i][1] * final.scale + final.y)) < 1e-8);
      });
      assertPortalCovers(final.points, viewportWidth, viewportHeight, label);
    }
  });
}
