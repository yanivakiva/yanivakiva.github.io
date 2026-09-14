import { clamp, coverRect } from "./camera-math.js";
export const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
export const cinematicFrame = (progress, count, filmEnd = .8) => Math.round(clamp(progress / filmEnd) * (count - 1));
// Complementary opacity removes the old all-empty .935–.956 interval.
export function portalHandoff(progress) {
  const document = smooth((progress - .94) / .045);
  return { terminal: 1 - document, document };
}
export function portalGeometry(screen, sourceWidth, sourceHeight, width, height, amount) {
  if (!Array.isArray(screen) || screen.length !== 4
    || !screen.every(point => Array.isArray(point) && point.length === 2 && point.every(Number.isFinite))
    || ![sourceWidth, sourceHeight, width, height].every(value => Number.isFinite(value) && value > 0)
    || !Number.isFinite(amount)) return null;
  const rect = coverRect(sourceWidth, sourceHeight, width, height);
  const original = screen.map(([x, y]) => [rect.x + x * rect.width, rect.y + y * rect.height]);
  const center = original.reduce((sum, point) => [sum[0] + point[0] / 4, sum[1] + point[1] / 4], [0, 0]);
  const area = original.reduce((sum, [x, y], i) => {
    const next = original[(i + 1) % 4];
    return sum + x * next[1] - y * next[0];
  }, 0);
  if (!Number.isFinite(area) || Math.abs(area) < 1e-9) return null;
  const orientation = Math.sign(area);
  let coverScale = 1;
  for (let i = 0; i < 4; i++) {
    const a = original[i], b = original[(i + 1) % 4], c = original[(i + 2) % 4];
    const dx = b[0] - a[0], dy = b[1] - a[1];
    // Require an ordered, convex LCD quadrilateral.
    if ((dx * (c[1] - b[1]) - dy * (c[0] - b[0])) * orientation <= 0) return null;
    const nx = -dy * orientation, ny = dx * orientation;
    const distance = nx * (center[0] - a[0]) + ny * (center[1] - a[1]);
    if (distance <= 0) return null;
    // The farthest viewport corner must fit inside each scaled LCD edge.
    // Using edge planes preserves perspective and also handles rotated screens.
    const extent = Math.abs(nx) * width / 2 + Math.abs(ny) * height / 2;
    coverScale = Math.max(coverScale, extent / distance);
  }
  const q = smooth(amount / .82), targetScale = coverScale * 1.04;
  const scale = 1 + (targetScale - 1) * q;
  const x = (width / 2 - center[0] * targetScale) * q;
  const y = (height / 2 - center[1] * targetScale) * q;
  const points = original.map(([px, py]) => [px * scale + x, py * scale + y]);
  return { scale, x, y, points };
}
