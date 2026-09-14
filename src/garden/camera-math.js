export const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
export const frameAt = (progress, count) => Math.round(clamp(progress) * Math.max(0, count - 1));
export function coverRect(sourceWidth, sourceHeight, width, height) {
  const scale = Math.max(width / sourceWidth, height / sourceHeight);
  return { x: (width - sourceWidth * scale) / 2, y: (height - sourceHeight * scale) / 2,
    width: sourceWidth * scale, height: sourceHeight * scale };
}
export function screenMatrix(points, width = 1000, height = 625) {
  // Project a rectangular HTML surface onto the rendered screen quadrilateral.
  const inputs = [[0, 0], [width, 0], [width, height], [0, height]];
  const rows = inputs.flatMap(([x, y], i) => {
    const [u, v] = points[i];
    return [[x, y, 1, 0, 0, 0, -u * x, -u * y, u], [0, 0, 0, x, y, 1, -v * x, -v * y, v]];
  });
  for (let column = 0; column < 8; column++) {
    let best = column;
    for (let row = column + 1; row < 8; row++) if (Math.abs(rows[row][column]) > Math.abs(rows[best][column])) best = row;
    [rows[column], rows[best]] = [rows[best], rows[column]];
    const divisor = rows[column][column];
    if (Math.abs(divisor) < 1e-10) return null;
    for (let i = column; i < 9; i++) rows[column][i] /= divisor;
    for (let row = 0; row < 8; row++) if (row !== column) {
      const factor = rows[row][column];
      for (let i = column; i < 9; i++) rows[row][i] -= factor * rows[column][i];
    }
  }
  const [a, b, c, d, e, f, g, h] = rows.map(row => row[8]);
  return [a, d, 0, g, b, e, 0, h, 0, 0, 1, 0, c, f, 0, 1];
}

export class FrameCache {
  constructor({ count, load, paint, onError = () => {}, budget = 84 * 1024 * 1024, frameBytes = 0, concurrency = 4 }) {
    Object.assign(this, { count, load, paint, onError, budget, frameBytes });
    this.concurrency = clamp(Math.floor(concurrency), 1, 4);
    this.frames = new Map(); this.pending = new Map(); this.queue = []; this.target = 0; this.closed = false;
    this.direction = 1; this.failed = new Set(); this.paintedFrame = null; this.paintedIndex = null;
    this.decoding = new WeakSet();
  }
  candidates() {
    // Learn decoded size from the first bitmap, or accept it from a manifest.
    // Until then, start only one concurrent batch rather than a full window.
    const capacity = this.frameBytes ? Math.max(1, Math.floor(this.budget / this.frameBytes)) : 4;
    const limit = Math.min(25, capacity, this.count), candidates = [this.target];
    for (let distance = 1; distance < 25 && candidates.length < limit; distance++) {
      for (const index of [this.target + distance * this.direction, this.target - distance * this.direction]) {
        if (index >= 0 && index < this.count && candidates.length < limit) candidates.push(index);
      }
    }
    return candidates;
  }
  refreshQueue() {
    this.queue = this.candidates().filter(i => !this.frames.has(i) && !this.pending.has(i) && !this.failed.has(i));
  }
  request(index) {
    if (this.closed) return;
    const old = this.target; this.target = clamp(index, 0, this.count - 1);
    // Repeated scroll events within one frame must not flip an even-sized
    // prefetch window back to the forward direction after a reversal.
    if (this.target !== old) this.direction = Math.sign(this.target - old);
    this.failed.clear(); this.refreshQueue();
    const wanted = new Set(this.candidates());
    // Cancel obsolete network work, but let an uncancellable bitmap decode
    // finish. Otherwise a slow decoder can miss every six-frame window and
    // never advance the image while scrolling. Neither phase releases its
    // concurrency slot until the actual load promise settles.
    for (const [i, controller] of this.pending) {
      if (!wanted.has(i) && !this.decoding.has(controller)) controller.abort();
    }
    this.draw(); this.pump();
  }
  useful(index, direction) {
    if (this.candidates().includes(index)) return true;
    const distances = [...this.frames.keys()].map(i => Math.abs(i - this.target));
    if (this.paintedIndex !== null) distances.push(Math.abs(this.paintedIndex - this.target));
    // With no image yet, allow late forward progress, not a stale image from
    // before an initial reversal. Once painted, only move closer to the target.
    return distances.length ? Math.abs(index - this.target) < Math.min(...distances) : direction === this.direction;
  }
  draw(force = false) {
    if (!this.frames.size || this.closed) return;
    const nearest = [...this.frames.keys()].sort((a, b) => Math.abs(a - this.target) - Math.abs(b - this.target))[0];
    const frame = this.frames.get(nearest);
    if (!force && frame === this.paintedFrame && nearest === this.paintedIndex) return;
    this.paint(frame, nearest);
    if (!this.closed) { this.paintedFrame = frame; this.paintedIndex = nearest; }
  }
  trim() {
    let bytes = [...this.frames.values()].reduce((sum, frame) => sum + frame.width * frame.height * 4, 0);
    const wanted = new Set(this.candidates());
    const distant = [...this.frames.keys()].sort((a, b) =>
      Number(wanted.has(a)) - Number(wanted.has(b)) || Math.abs(b - this.target) - Math.abs(a - this.target));
    for (const i of distant) {
      if (bytes <= this.budget || this.frames.size <= 1) break;
      const frame = this.frames.get(i); bytes -= frame.width * frame.height * 4;
      frame.close?.(); this.frames.delete(i);
    }
  }
  pump() {
    while (!this.closed && this.pending.size < this.concurrency && this.queue.length) {
      const i = this.queue.shift();
      if (this.frames.has(i) || this.pending.has(i)) continue;
      const controller = new AbortController(); this.pending.set(i, controller);
      const direction = this.direction;
      // Call immediately before createImageBitmap, after fetching the bytes.
      // A false result lets the loader avoid starting an already-obsolete decode.
      const onDecodeStart = () => {
        if (this.closed || controller.signal.aborted) return false;
        this.decoding.add(controller); return true;
      };
      this.load(i, controller.signal, { onDecodeStart }).then(frame => {
        if (this.closed || controller.signal.aborted || !this.useful(i, direction)) { frame.close?.(); return; }
        this.frameBytes = Math.max(this.frameBytes, frame.width * frame.height * 4);
        this.frames.set(i, frame); this.trim(); this.refreshQueue(); this.draw();
      }).catch(error => {
        if (!this.closed && !controller.signal.aborted) { this.failed.add(i); this.onError(error, i); }
      })
        .finally(() => {
          if (this.pending.get(i) === controller) this.pending.delete(i);
          // A quick out-and-back can target an aborted request before its
          // rejection settles. Rebuild the budgeted window so that frame is
          // retried without resurrecting prefetch outside the current window.
          if (!this.closed && controller.signal.aborted) this.refreshQueue();
          this.pump();
        });
    }
  }
  destroy() {
    this.closed = true; this.queue = [];
    this.pending.forEach(controller => controller.abort());
    this.frames.forEach(frame => frame.close?.()); this.frames.clear();
    this.failed.clear(); this.paintedFrame = null; this.paintedIndex = null;
  }
}
