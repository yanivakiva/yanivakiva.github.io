export function scenePhase(progress, motionEnabled) {
  if (!motionEnabled) return progress < 0.6 ? 0 : 2;
  return progress < 0.65 ? 0 : progress < 0.98 ? 1 : 2;
}

export function readingScrollAfterResize(scrollY, previousHeight, nextHeight) {
  if (scrollY >= previousHeight) return scrollY + nextHeight - previousHeight;
  if (scrollY > nextHeight) return nextHeight;
  return scrollY;
}

export function activeCareerIndex(tops, readingLine) {
  return tops.reduce(
    (active, top, index) => (top <= readingLine ? index : active),
    0,
  );
}

export function printDisclosures(getDetails) {
  let printing = false;
  let closed = [];
  return {
    before() {
      if (printing) return;
      printing = true;
      closed = [...getDetails()].filter((detail) => !detail.open);
      closed.forEach((detail) => {
        detail.open = true;
      });
    },
    after() {
      closed.forEach((detail) => {
        detail.open = false;
      });
      closed = [];
      printing = false;
    },
  };
}
