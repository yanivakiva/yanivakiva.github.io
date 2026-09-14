import Lenis from "lenis";

const bounded = (v, low, high) => Math.max(low, Math.min(high, v));
export const SCROLL_TUNING = Object.freeze({
  lerp: .12,
  wheelMultiplier: 1.2,
  tourDuration: 5000,
  minimumTourDuration: 1400,
});
export const INTERRUPT_KEYS = new Set(["Escape", "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "]);
export function restoreTourFocus(controls, fallback, activeElement) {
  if (controls?.contains(activeElement)) fallback?.focus({ preventScroll: true });
}
export function tourEase(t) {
  const p = bounded(t, 0, 1), ramp = .12;
  if (p < ramp) return p * p / (2 * ramp * (1 - ramp));
  if (p > 1 - ramp) return 1 - (1 - p) ** 2 / (2 * ramp * (1 - ramp));
  return (p - ramp / 2) / (1 - ramp);
}
/** Keep the browser's real scroll position authoritative, including keyboard and touch. */
export function createJourneyScroll({ browser = window, document = window.document, playback, onTour = () => {}, createSmooth = options => new Lenis(options) }) {
  let tour = null, frame = 0, last = null, clock = 1, disposed = false;
  const smooth = createSmooth({ autoRaf: false, lerp: SCROLL_TUNING.lerp, wheelMultiplier: SCROLL_TUNING.wheelMultiplier, syncTouch: false,
    virtualScroll(data) {
      if (data.event.type !== "wheel" || data.event.ctrlKey || Math.abs(data.deltaX) > Math.abs(data.deltaY)) return;
      if (tour) cancel();
      const film = playback.current;
      if (film && browser.scrollY < film.travel && browser.scrollY >= 0) {
        // Reverse immediately instead of working through old forward momentum.
        // Do not truncate wheel distance: that makes repeated flicks feel ignored.
        const debt = smooth.targetScroll - smooth.animatedScroll;
        if (Math.sign(data.deltaY) !== Math.sign(debt)) data.deltaY -= debt;
      }
    },
  });
  function cancel() {
    const wasTouring = Boolean(tour);
    tour = null;
    if (wasTouring) onTour(null);
    // Native keyboard/scrollbar input, printing and motion changes must also
    // stop ordinary wheel inertia, even when no guided tour is running.
    // The public stop/start pair resets inertia without a programmatic scroll
    // that would make Lenis ignore the keyboard's following native scroll.
    smooth.stop(); smooth.start();
  }
  function pause() {
    if (!tour || tour.paused) return;
    tour.paused = true; last = null;
    smooth.scrollTo(browser.scrollY, { immediate: true, force: true });
    onTour({ paused: true, keyboard: tour.keyboard });
  }
  function resume() {
    if (!tour || !tour.paused) return;
    tour.paused = false; last = null;
    onTour({ paused: false, keyboard: tour.keyboard });
  }
  function interrupt(event) {
    if (event.type === "keydown" && !INTERRUPT_KEYS.has(event.key)) return;
    const interactive = event.target?.closest?.("a, button");
    // Let pointer/touch activation reach Pause, Resume, Skip and header links.
    if ((event.type === "pointerdown" || event.type === "touchstart") && interactive) return;
    if (event.type === "keydown" && event.key === " " && event.target?.closest?.("button")) return;
    // Ordinary wheel events keep accumulating a bounded target; only native
    // input or an active tour needs an explicit inertia reset here.
    if (event.type === "wheel" && !tour) return;
    cancel();
  }
  function frameLoop(time) {
    if (disposed) return;
    const elapsed = last === null || time - last > 1000 || document.hidden ? 0 : Math.max(0, time - last);
    last = time;
    const film = playback.current;
    if (tour) {
      if (!film) {
        const current = tour; tour = null; onTour(null);
        smooth.resize(); smooth.scrollTo(current.target.getBoundingClientRect().top + browser.scrollY, { immediate: true }); current.complete();
      } else if (!tour.paused) {
        // The guided tour has a real five-second clock. Request the next sharp
        // image without stopping for every decode; the renderer retains the
        // nearest full-resolution frame while the next one becomes available.
        const next = Math.min(tour.duration, tour.elapsed + elapsed);
        const end = tour.target.getBoundingClientRect().top + browser.scrollY;
        const position = tour.from + (end - tour.from) * tourEase(next / tour.duration);
        film.ensurePosition(position);
        tour.elapsed = next; smooth.scrollTo(position, { immediate: true });
        if (next === tour.duration) { const complete = tour.complete; tour = null; onTour(null); complete(); }
      }
    } else {
      // Manual input owns the page, not the decoder. Advance the smoother on
      // real elapsed time even when a requested image is still loading. The
      // renderer retains its sharp last frame and catches up independently.
      // The optional tour has its own clock; neither input path blocks on decode.
      // Lenis already applies time-based damping. Capping its clock to 32ms
      // made a 100ms decode frame advance only 32ms, stretching wheel inertia
      // and making the page feel stuck precisely when the browser was busy.
      clock += elapsed; smooth.raf(clock);
    }
    frame = browser.requestAnimationFrame(frameLoop);
  }
  function navigate({ top, target, link, immediate, onComplete }) {
    cancel(); smooth.resize();
    const film = playback.current;
    if (!immediate && link?.getAttribute("data-journey") === "true" && film && browser.scrollY < film.travel * .95) {
      const fraction = bounded((top - browser.scrollY) / film.travel, 0, 1);
      tour = { from: browser.scrollY, target, duration: Math.max(SCROLL_TUNING.minimumTourDuration, SCROLL_TUNING.tourDuration * fraction), elapsed: 0,
        paused: false, keyboard: Boolean(link.matches?.(":focus-visible")), complete: onComplete };
      smooth.scrollTo(browser.scrollY, { immediate: true }); onTour({ paused: false, keyboard: tour.keyboard });
      return cancel;
    }
    smooth.scrollTo(top, { immediate: true, force: true }); onComplete();
    return cancel;
  }
  const events = ["wheel", "touchstart", "touchmove", "keydown", "pointerdown"];
  for (const name of events) browser.addEventListener(name, interrupt, { passive: true, capture: true });
  const resize = () => { cancel(); smooth.resize(); last = null; };
  browser.addEventListener("resize", resize);
  browser.addEventListener("beforeprint", cancel);
  frame = browser.requestAnimationFrame(frameLoop);
  return { navigate, cancel, pause, resume, destroy() {
    disposed = true; cancel(); browser.cancelAnimationFrame(frame); smooth.destroy();
    for (const name of events) browser.removeEventListener(name, interrupt, { capture: true });
    browser.removeEventListener("resize", resize); browser.removeEventListener("beforeprint", cancel);
  } };
}
