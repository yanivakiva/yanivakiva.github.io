const SCROLL_KEYS = new Set(["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "]);

/** Pin the opening on mobile and desktop; never accumulate wheel input. */
export function lockJourneyOpening({ browser = window, document = browser.document } = {}) {
  const html = document.documentElement, body = document.body;
  const properties = [[html, "overflow", "hidden"], [html, "overscroll-behavior", "none"],
    [body, "position", "fixed"], [body, "top", "0px"], [body, "left", "0px"],
    [body, "width", "100%"], [body, "overflow", "hidden"]];
  const saved = properties.map(([node, key]) => [node, key, node.style.getPropertyValue(key), node.style.getPropertyPriority(key)]);
  const restoration = browser.history.scrollRestoration;
  browser.history.scrollRestoration = "manual";
  browser.scrollTo({ top: 0, left: 0, behavior: "instant" });
  for (const [node, key, value] of properties) node.style.setProperty(key, value);
  function block(event) {
    // Preserve zoom, tab navigation and Retry activation with Space/Enter.
    if (event.ctrlKey || event.metaKey || event.touches?.length > 1) return;
    if (event.type === "keydown" && (!SCROLL_KEYS.has(event.key) ||
      (event.key === " " && event.target?.closest?.("button, input, textarea, select, [contenteditable]")))) return;
    if (event.cancelable) event.preventDefault();
  }
  const options = { passive: false, capture: true };
  for (const type of ["wheel", "touchmove", "keydown"]) browser.addEventListener(type, block, options);
  return () => {
    for (const type of ["wheel", "touchmove", "keydown"]) browser.removeEventListener(type, block, options);
    for (const [node, key, value, priority] of saved) {
      if (value) node.style.setProperty(key, value, priority); else node.style.removeProperty(key);
    }
    browser.scrollTo({ top: 0, left: 0, behavior: "instant" });
    browser.history.scrollRestoration = restoration;
  };
}
