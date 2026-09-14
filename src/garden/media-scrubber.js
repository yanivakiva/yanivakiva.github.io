import { clamp } from "./camera-math.js";

// One seek in flight. Overwriting currentTime on every wheel event restarts
// network/decoder work; coalescing to the newest target guarantees progress.
export function createMediaScrubber(video, { count, fps, onFrame, onError,
  requestFrame = requestAnimationFrame, cancelFrame = cancelAnimationFrame }) {
  let target = 0, presented = -1, closed = false, failed = false, raf = 0, callback = 0;
  const listeners = [];
  const supportsFrames = typeof video.requestVideoFrameCallback === "function";
  const stats = { seeks: 0, presented: 0 };
  const frameAtTime = time => clamp(Math.round(time * fps), 0, count - 1);
  function publish(time) {
    if (closed || failed) return;
    const index = frameAtTime(time);
    if (index !== presented) { presented = index; stats.presented++; onFrame(index); }
  }
  function schedule() { if (!closed && !failed && !raf) raf = requestFrame(pump); }
  function pump() {
    raf = 0;
    if (closed || failed || video.readyState < 2 || video.seeking) return;
    const time = target / fps + .0001;
    if (Math.abs(video.currentTime - time) < .45 / fps) return;
    try { stats.seeks++; video.currentTime = time; } catch { fail(); }
  }
  function fail() { if (!closed && !failed) { failed = true; onError(); } }
  function loaded() { publish(video.currentTime); schedule(); }
  function seeked() {
    // Also reveal a paused video's first sought frame: a fully transparent
    // layer may not receive compositor callbacks until it becomes visible.
    publish(video.currentTime);
    // Yield to the compositor before asking it to decode the latest target.
    schedule();
  }
  function presentedFrame(_, metadata) {
    callback = 0;
    if (closed || failed) return;
    // A compositor callback from the previous seek can arrive after seeked
    // has already published the new frame. Never roll its overlays backward.
    if (!video.seeking && Math.abs(metadata.mediaTime - video.currentTime) < .45 / fps) publish(metadata.mediaTime);
    callback = video.requestVideoFrameCallback(presentedFrame);
  }
  function listen(name, handler) { video.addEventListener(name, handler); listeners.push([name, handler]); }
  listen("loadeddata", loaded); listen("seeked", seeked); listen("canplay", schedule); listen("error", fail);
  if (supportsFrames) callback = video.requestVideoFrameCallback(presentedFrame);
  return {
    stats,
    request(index) { target = clamp(Math.round(index), 0, count - 1); schedule(); },
    ready(index) { return !failed && video.readyState >= 2 && Math.abs(index - presented) <= 1; },
    destroy() {
      closed = true; cancelFrame(raf);
      if (callback) video.cancelVideoFrameCallback?.(callback);
      listeners.forEach(([name, handler]) => video.removeEventListener(name, handler));
      video.pause(); video.removeAttribute("src"); video.load();
    },
  };
}
