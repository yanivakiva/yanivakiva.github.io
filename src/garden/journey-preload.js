// Download compressed media completely before enabling the camera. A blob URL
// prevents subsequent seeking from starting another network range request.
export async function downloadJourney(url, { signal, onProgress = () => {}, fetcher = fetch } = {}) {
  const response = await fetcher(url, { signal });
  if (!response.ok) throw new Error("Journey unavailable");
  const total = Number(response.headers.get("content-length"));
  if (!response.body?.getReader) {
    const blob = await response.blob();
    signal?.throwIfAborted(); onProgress(1); return blob;
  }
  const reader = response.body.getReader(), chunks = [];
  let received = 0;
  try {
    while (true) {
      signal?.throwIfAborted();
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value); received += value.byteLength;
      onProgress(total > 0 ? Math.min(.999, received / total) : 0, received);
    }
    signal?.throwIfAborted();
    if (!received) throw new Error("Empty journey");
    if (total > received && !response.headers.get("content-encoding")) throw new Error("Incomplete journey");
    const blob = new Blob(chunks, { type: response.headers.get("content-type") || "video/webm" });
    onProgress(1); return blob;
  } finally { reader.releaseLock(); }
}

// Only compressed blobs are retained; FrameCache bounds decoded bitmap memory.
export async function preloadJourneyFrames({ count, urlFor, signal, onProgress = () => {}, fetcher = fetch, concurrency = 3 }) {
  const frames = new Map();
  let next = 0, completed = 0, failed = false;
  try {
    await Promise.all(Array.from({ length: Math.min(count, concurrency) }, async () => {
      while (!failed && next < count) {
        signal?.throwIfAborted();
        const index = next++;
        const response = await fetcher(urlFor(index), { signal });
        if (!response.ok) throw new Error("Frame unavailable");
        const blob = await response.blob();
        signal?.throwIfAborted();
        if (failed) return;
        frames.set(index, blob); onProgress(++completed / count);
      }
    }));
    return frames;
  } catch (error) { failed = true; frames.clear(); throw error; }
}
