import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
const manifest = JSON.parse(readFileSync(new URL("../../public/manifest.json", import.meta.url), "utf8"));
const publicFile = name => readFileSync(new URL("../../public/" + name, import.meta.url));
const meta = name => source.match(new RegExp(`<meta (?:property|name)="${name}" content="([^"]+)"`))?.[1];

test("sharing metadata is in the static head and points at the approved public image", () => {
  const url = new URL(meta("og:image"));
  assert.equal(url.origin, "https://yanivakiva.com");
  assert.equal(url.pathname, "/og.png");
  assert.equal(meta("twitter:image"), url.href);
  assert.equal(meta("twitter:card"), "summary_large_image");
  assert.equal(meta("og:image:type"), "image/png");
  assert.equal(meta("og:image:width"), "1200");
  assert.equal(meta("og:image:height"), "630");
  assert.match(meta("og:image:alt"), /origami fox/);
  assert.equal(meta("twitter:image:alt"), meta("og:image:alt"));
  assert.doesNotMatch(source, /\.pdf|Groot|groot|mailto:(?!contact@yanivakiva\.com)/);
});

test("sharing and home-screen assets are real PNGs at their advertised sizes", () => {
  for (const [name, width, height] of [["og.png",1200,630],["favicon-16.png",16,16],["favicon-32.png",32,32],["apple-touch-icon.png",180,180],["logo192.png",192,192],["logo512.png",512,512]]) {
    const bytes = publicFile(name);
    assert.deepEqual([...bytes.subarray(0,8)], [137,80,78,71,13,10,26,10], name);
    assert.equal(bytes.readUInt32BE(16), width, name);
    assert.equal(bytes.readUInt32BE(20), height, name);
  }
});

test("fallback favicon contains every advertised resolution and complete PNG payloads", () => {
  const bytes = publicFile("favicon.ico");
  assert.equal(bytes.readUInt16LE(2), 1);
  assert.equal(bytes.readUInt16LE(4), 6);
  const sizes = [];
  for (let i = 0; i < 6; i++) {
    const entry = 6 + 16 * i;
    sizes.push(bytes[entry] || 256);
    const length = bytes.readUInt32LE(entry + 8), offset = bytes.readUInt32LE(entry + 12);
    assert.ok(offset + length <= bytes.length);
    assert.equal(bytes.subarray(offset + 1, offset + 4).toString(), "PNG");
  }
  assert.deepEqual(sizes, [16,32,48,64,128,256]);
  for (const icon of manifest.icons) assert.ok(publicFile(icon.src.split("?")[0]).length > 0);
  assert.equal(manifest.background_color, "#11171e");
});
