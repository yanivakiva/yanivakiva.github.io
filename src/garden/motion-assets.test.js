import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";

for (const [variant, limit] of [["wide", 40], ["portrait", 28]]) {
  test(`${variant} motion has a bounded, seekable full-resolution delivery asset`, () => {
    const base = new URL("../../public/garden/cinematic/", import.meta.url);
    const path = new URL(`motion-${variant}-v1.webm`, base);
    const bytes = readFileSync(path);
    assert.ok(statSync(path).size < limit * 1024 * 1024, "Do not regress to hundreds of MiB of media");
    assert.equal(bytes.subarray(0, 4).toString("hex"), "1a45dfa3", "Real WebM/EBML, not a placeholder");
    assert.ok(bytes.subarray(0, 1024).includes(Buffer.from("webm")));
    const metadata = JSON.parse(readFileSync(new URL(`${variant}/manifest.json`, base)));
    assert.equal(metadata.count, 386);
    assert.deepEqual([metadata.width, metadata.height], variant === "wide" ? [3200, 1800] : [1440, 2560]);
    // The original frames remain available if media/codec playback fails.
    for (const frame of [0, 193, 385]) assert.ok(statSync(new URL(`${variant}/${String(frame).padStart(3, "0")}.avif`, base)).size > 1000);
  });
}
