import { useEffect, useRef, useState } from "react";
import { createGarden, FRAME_COUNT } from "./garden-world";

export default function GardenStudio() {
  const canvas = useRef(null), world = useRef(null), stopped = useRef(false);
  const [progress, setProgress] = useState(0), [message, setMessage] = useState("Scene ready · original 3D garden"), [busy, setBusy] = useState(false);
  useEffect(() => {
    stopped.current = false;
    world.current = createGarden(canvas.current);
    return () => { stopped.current = true; world.current?.dispose(); };
  }, []);
  function scrub(value) { setProgress(value); world.current?.render(value); }
  async function exportFrames() {
    setBusy(true);
    try {
      for (const [variant, width, height] of [["wide", 1600, 900], ["portrait", 720, 1000]]) {
        world.current?.dispose(); world.current = createGarden(canvas.current, width, height);
        const frames = [];
        for (let i = 0; i < FRAME_COUNT; i++) {
          if (stopped.current) return;
          const screen = world.current.render(i / (FRAME_COUNT - 1));
          const blob = await new Promise(resolve => canvas.current.toBlob(resolve, "image/webp", .84));
          if (!blob) throw new Error("Frame encoding failed");
          const response = await fetch(`/__garden-export/${variant}/${String(i).padStart(3, "0")}.webp`, { method: "POST", body: blob });
          if (!response.ok) throw new Error(`Export rejected: ${response.status}`);
          frames.push({ screen });
          setMessage(`Rendering ${variant}: ${i + 1} / ${FRAME_COUNT}`); setProgress(i / (FRAME_COUNT - 1));
          if (i % 8 === 0) await new Promise(requestAnimationFrame);
        }
        const response = await fetch(`/__garden-export/${variant}/manifest.json`, { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ version: 1, width, height, count: FRAME_COUNT, fps: 30, frames }) });
        if (!response.ok) throw new Error("Manifest export failed");
      }
      setMessage("Complete: 720 rendered frames · wide + portrait · 360 each");
    } catch (error) { setMessage(`Export failed: ${error.message}`); }
    finally { setBusy(false); }
  }
  return <main style={{ background: "#eee9dc", minHeight: "100vh", padding: 24, color: "#24382b" }}>
    <h1 style={{ font: "32px Georgia", margin: "0 0 16px" }}>Garden motion studio</h1>
    <p role="status">{message}</p>
    <canvas ref={canvas} style={{ display: "block", width: "100%", maxHeight: "74vh", objectFit: "contain" }} />
    <div style={{ display: "flex", gap: 20, alignItems: "center", marginTop: 16 }}>
      <label>Camera <input aria-label="Camera progress" type="range" min="0" max="1" step="0.001" value={progress} disabled={busy} onChange={e => scrub(+e.target.value)} /></label>
      <output>{Math.round(progress * 359)} / 359</output>
      <button disabled={busy} onClick={exportFrames} style={{ padding: "12px 20px" }}>Render both frame sequences</button>
      {[0, .25, .5, .75, .9, 1].map(p => <button key={p} disabled={busy} onClick={() => scrub(p)}>{Math.round(p * 100)}%</button>)}
    </div>
  </main>;
}
