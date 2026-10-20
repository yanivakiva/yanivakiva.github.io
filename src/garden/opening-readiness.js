export const OPENING_WAIT_MS = 3000;
export const OPENING_STALL_MS = 45000;

// Slow transfers keep loading. Failed/stalled transfers offer Retry, never CV.
export function createOpeningReadiness({ onChange, setTimer = setTimeout, clearTimer = clearTimeout }) {
  let state = { status: "loading", progress: 0, reason: null }, closed = false, slowTimer, stallTimer;
  const assets = { poster: false, companion: false, arrival: false, screen: false, decoded: false, downloaded: 0 };
  const pending = () => !closed && ["loading", "slow"].includes(state.status);
  const clear = () => { clearTimer(slowTimer); clearTimer(stallTimer); };
  function fail(reason = "unavailable") {
    if (closed || state.status === "error") return;
    clear(); state = { ...state, status: "error", reason }; onChange(state);
  }
  function touch() {
    clearTimer(stallTimer);
    stallTimer = setTimer(() => fail("stalled"), OPENING_STALL_MS);
  }
  slowTimer = setTimer(() => {
    if (pending()) { state = { ...state, status: "slow" }; onChange(state); }
  }, OPENING_WAIT_MS);
  touch(); onChange(state);
  return {
    get state() { return state; },
    update(patch) {
      if (!pending()) return;
      if (Object.entries(patch).some(([key, value]) => assets[key] !== value)) touch();
      Object.assign(assets, patch);
      const artwork = ["poster", "companion", "arrival", "screen"].filter(key => assets[key]).length;
      const downloaded = Math.max(0, Math.min(1, assets.downloaded));
      const complete = artwork === 4 && assets.decoded && downloaded === 1;
      const progress = Math.min(complete ? 100 : 99, Math.floor(artwork * 5 + downloaded * 75 + Number(assets.decoded) * 5));
      if (complete) {
        clear(); state = { status: "ready", progress: 100, reason: null }; onChange(state);
      } else if (state.progress !== progress) {
        state = { ...state, progress }; onChange(state);
      }
    },
    fail,
    prepareMedia() {
      if (closed || state.status === "error") return;
      clear(); assets.decoded = false; assets.downloaded = 0;
      state = { status: "loading", progress: ["poster", "companion", "arrival", "screen"].filter(key => assets[key]).length * 5, reason: null };
      slowTimer = setTimer(() => {
        if (pending()) { state = { ...state, status: "slow" }; onChange(state); }
      }, OPENING_WAIT_MS);
      touch(); onChange(state);
    },
    destroy() { closed = true; clear(); },
  };
}
