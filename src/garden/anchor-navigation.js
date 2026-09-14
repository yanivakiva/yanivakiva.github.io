export function hashTargetId(hash) {
  if (typeof hash !== "string" || !hash.startsWith("#") || hash.length < 2) return null;
  try { return decodeURIComponent(hash.slice(1)) || null; } catch { return null; }
}

export function localAnchor(href, currentUrl) {
  try {
    const current = new URL(currentUrl), next = new URL(href, current);
    if (next.origin !== current.origin || next.pathname !== current.pathname || next.search !== current.search) return null;
    const id = hashTargetId(next.hash);
    return id ? { id, hash: next.hash } : null;
  } catch { return null; }
}

export function plainAnchorActivation(event, { target = "", download = false, inert = false } = {}) {
  return !event.defaultPrevented && event.button === 0
    && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
    && !download && !inert && (!target || target.toLowerCase() === "_self");
}

export function anchorScrollTop(rectTop, scrollY, scrollMarginTop = 0) {
  if (!Number.isFinite(rectTop) || !Number.isFinite(scrollY)) return null;
  const margin = Number.parseFloat(scrollMarginTop);
  return Math.max(0, rectTop + scrollY - (Number.isFinite(margin) ? margin : 0));
}

/** Keep real hrefs/history, but do not rely on native scrolling to hidden React targets. */
export function installAnchorNavigation({ browser, document, root, onNavigate = () => {}, onResolveTarget = () => {}, scrollTo }) {
  let pending = 0, focusing = 0, restoreFocus = null, disposed = false, cancelScroll = null, generation = 0;
  const cancel = () => {
    generation++; cancelScroll?.(); cancelScroll = null;
    browser.cancelAnimationFrame(pending); browser.cancelAnimationFrame(focusing);
    pending = 0; focusing = 0;
  };
  const targetFor = id => {
    // A deep link may name an inactive build-log panel. Reveal it before
    // measuring the destination, including Back/Forward and initial hashes.
    if (id) onResolveTarget(id);
    const target = id && document.getElementById(id);
    return target && root.contains(target) && !target.closest("[inert]") ? target : null;
  };
  function navigate(target, { link, immediate = true } = {}) {
    cancel();
    const current = generation;
    const top = anchorScrollTop(target.getBoundingClientRect().top, browser.scrollY, browser.getComputedStyle(target).scrollMarginTop);
    if (top === null) return;
    function complete() {
    if (disposed || current !== generation) return;
    onNavigate();
    focusing = browser.requestAnimationFrame(() => {
      focusing = 0;
      if (disposed || !root.contains(target)) return;
      restoreFocus?.();
      // #home is not normally a tab stop; existing section tabindex values remain intact.
      if (!target.hasAttribute("tabindex")) {
        target.setAttribute("tabindex", "-1");
        const restore = () => {
          if (target.getAttribute("tabindex") === "-1") target.removeAttribute("tabindex");
          target.removeEventListener("blur", restore);
          if (restoreFocus === restore) restoreFocus = null;
        };
        restoreFocus = restore;
        target.addEventListener("blur", restore, { once: true });
      }
      target.focus({ preventScroll: true });
    });
    }
    if (scrollTo) cancelScroll = scrollTo({ top, target, link, immediate, onComplete: complete });
    else { browser.scrollTo({ top, behavior: "instant" }); complete(); }
  }
  function fromLocation() {
    cancel();
    // Run after initial React commit or the browser's history restoration step.
    pending = browser.requestAnimationFrame(() => {
      pending = 0;
      if (disposed) return;
      const target = targetFor(hashTargetId(browser.location.hash));
      if (target) navigate(target);
      // Empty/invalid hashes leave native saved-scroll restoration untouched.
    });
  }
  function click(event) {
    const element = event.target?.closest ? event.target : event.target?.parentElement;
    const link = element?.closest("a[href]");
    if (!link || !root.contains(link) || !plainAnchorActivation(event, {
      target: link.getAttribute("target") || "",
      download: link.hasAttribute("download"),
      inert: Boolean(link.closest("[inert]")),
    })) return;
    const destination = localAnchor(link.getAttribute("href"), browser.location.href);
    const target = destination && targetFor(destination.id);
    if (!target) return;
    if (browser.location.hash !== destination.hash) {
      try { browser.history.pushState(browser.history.state, "", destination.hash); }
      catch { return; } // If history is unavailable, leave the anchor native.
    }
    event.preventDefault();
    navigate(target, { link, immediate: false });
  }
  root.addEventListener("click", click);
  browser.addEventListener("popstate", fromLocation);
  browser.addEventListener("hashchange", fromLocation);
  fromLocation();
  return () => {
    disposed = true; cancel(); restoreFocus?.();
    root.removeEventListener("click", click);
    browser.removeEventListener("popstate", fromLocation);
    browser.removeEventListener("hashchange", fromLocation);
  };
}
