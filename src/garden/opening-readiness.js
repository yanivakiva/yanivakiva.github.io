export const OPENING_WAIT_MS = 3000;
export const OPENING_BUFFER_SECONDS = 3;

// Only contiguous media starting at zero can prepare the opening. A buffered
// island near the end must not make a cold journey look ready.
export function openingBufferFraction(ranges, seconds = OPENING_BUFFER_SECONDS) {
  let end = 0;
  for (let i = 0; i < ranges.length; i++) {
    if (ranges.start(i) > end + .05) break;
    end = Math.max(end, ranges.end(i));
  }
  return Math.max(0, Math.min(1, end / seconds));
}

export function canPrepareOpening({ scrollY, hash }) {
  return scrollY <= 2 && (!hash || hash === "#home");
}

// This gate owns only the cinematic enhancement, never browser scrolling.
// The soft deadline changes the message, not the media lifecycle. Only leaving
// the opening (or an actual error) settles the static route, so a late download
// can recover at the top without lengthening the document beneath a reader.
export function createOpeningReadiness({ onChange, canStart = () => true,
  setTimer = setTimeout, clearTimer = clearTimeout }) {
  let state = { status: "loading", progress: 0, reason: null }, closed = false, timer;
  const assets = { poster: false, companion: false, decoded: false, buffered: 0 };
  const pending = () => !closed && (state.status === "loading" || state.status === "slow");
  function finish(status, reason = null) {
    if (!pending()) return;
    clearTimer(timer);
    state = { status, progress: status === "ready" ? 100 : state.progress, reason };
    onChange(state);
  }
  timer = setTimer(() => {
    if (!pending()) return;
    if (!canStart()) { finish("static", "navigation"); return; }
    state = { ...state, status: "slow" };
    onChange(state);
  }, OPENING_WAIT_MS);
  onChange(state);
  if (!canStart()) finish("static", "navigation");
  return {
    get state() { return state; },
    update(patch) {
      if (!pending()) return;
      Object.assign(assets, patch);
      if (!canStart()) { finish("static", "navigation"); return; }
      const media = assets.decoded ? Math.max(0, Math.min(1, assets.buffered)) : 0;
      const progress = Math.floor((Number(assets.poster) + Number(assets.companion) + media) / 3 * 100);
      if (assets.poster && assets.companion && assets.decoded && media === 1) finish("ready");
      else if (progress !== state.progress) { state = { ...state, progress }; onChange(state); }
    },
    skip(reason = "navigation") { finish("static", reason); },
    destroy() { closed = true; clearTimer(timer); },
  };
}
