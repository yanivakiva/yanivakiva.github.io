// Package the accepted full-resolution frames for hardware-decoded scroll seeking.
// Regeneration only: Node + FFmpeg with libsvtav1. Deployment uses committed WebM.
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawn } from "node:child_process";

const variants = process.argv.slice(2);
if (!variants.length || variants.some(v => !["wide", "portrait"].includes(v))) {
  throw new Error("Usage: node scripts/build-seek-films.mjs wide [portrait]");
}
for (const variant of variants) {
  const directory = `public/garden/cinematic/${variant}`;
  const metadata = JSON.parse(readFileSync(`${directory}/manifest.json`, "utf8"));
  mkdirSync("output/garden-film", { recursive: true });
  const list = `output/garden-film/seek-${variant}.ffconcat`;
  writeFileSync(list, "ffconcat version 1.0\n" + Array.from({ length: metadata.count }, (_, i) =>
    `file '${resolve(directory, String(i).padStart(3, "0") + ".avif")}'\nduration ${1 / metadata.fps}\n`).join(""));
  await new Promise((resolve, reject) => {
    const child = spawn("ffmpeg", ["-hide_banner", "-loglevel", "warning", "-y",
      "-r", String(metadata.fps), "-f", "concat", "-safe", "0", "-i", list,
      // Still-image containers have a 1-second timebase. Assign frame PTS
      // explicitly so concatenation never duplicates/drops intermediate images.
      "-vf", `settb=1/${metadata.fps},setpts=N`, "-fps_mode", "passthrough",
      "-frames:v", String(metadata.count), "-an", "-c:v", "libsvtav1",
      "-preset", "8", "-crf", "38", "-pix_fmt", "yuv420p",
      "-g", "12", "-svtav1-params", "lp=4",
      "-cues_to_front", "1", "-cluster_time_limit", "500",
      `public/garden/cinematic/motion-${variant}-v1.webm`], { stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", code => code === 0 ? resolve() : reject(new Error(`FFmpeg failed: ${code}`)));
  });
  console.log(`Exported ${variant}: ${metadata.count} frames, ${metadata.width}×${metadata.height}, ${metadata.fps} fps.`);
}
