import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import test from "node:test";
import { buildSync } from "esbuild";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { career } from "./portfolio-data.js";

// Compile JSX in memory: no browser, generated test files, or server required.
const compiled = buildSync({
  entryPoints: [fileURLToPath(new URL("./EditorResume.jsx", import.meta.url))],
  bundle: true,
  write: false,
  platform: "node",
  format: "cjs",
  jsx: "automatic",
  packages: "external",
  loader: { ".css": "empty" },
  logLevel: "silent",
}).outputFiles[0].text;
const loaded = { exports: {} };
runInNewContext(compiled, {
  module: loaded,
  exports: loaded.exports,
  require: createRequire(import.meta.url),
});
const { default: EditorResume, EditorOpening } = loaded.exports;
const render = (Component, props) => renderToStaticMarkup(React.createElement(Component, props));

test("document links reflect the section being read without pretending to be editor widgets", () => {
  const careerHtml = render(EditorOpening, { activeSection: "dokka" });
  assert.match(careerHtml, /<nav[^>]+aria-label="CV documents"/);
  assert.match(careerHtml, /class="editor-tab active" href="#experience" aria-current="location"/);
  const aboutHtml = render(EditorOpening, { activeSection: "about" });
  assert.match(aboutHtml, /class="editor-tab secondary-tab active" href="#about" aria-current="location"/);
  assert.doesNotMatch(aboutHtml, /class="editor-tab active" href="#experience"/);
  assert.doesNotMatch(render(EditorOpening, { activeSection: "contact" }), /aria-current=/);
});

test("decorative preview links are outside the tab order", () => {
  const html = render(EditorOpening, { preview: true });
  assert.match(html, /<nav[^>]+aria-hidden="true"/);
  assert.equal((html.match(/tabindex="-1"/g) || []).length, 2);
  assert.doesNotMatch(html, /aria-current=|id="experience-title"/);
});

test("career destinations have names, focus targets, and distinct disclosure names", () => {
  const html = render(EditorResume);
  for (const role of career) {
    assert.match(html, new RegExp(`<article[^>]+id="${role.slug}"[^>]+aria-labelledby="${role.slug}-title"[^>]+tabindex="-1"`));
    assert.ok(html.includes(`<h3 id="${role.slug}-title">`));
    assert.ok(html.includes(`aria-label="${role.company} technologies"`));
    if (role.more.length) assert.ok(html.includes(`class="sr-only"> for ${role.company}</span>`));
    for (const point of [...role.points, ...role.more]) assert.ok(html.includes(point));
  }
  assert.match(html, /<section id="about"[^>]+tabindex="-1"/);
  assert.match(html, /<section id="contact"[^>]+tabindex="-1"/);
});

test("the editorial redesign preserves every career fact in its own employer chapter", () => {
  const html = render(EditorResume);
  assert.match(html, /<h2 id="experience-title">Selected <em>experience\.<\/em><\/h2>/);
  assert.doesNotMatch(html, /## \d+ \/ EXPERIENCE|role:<\/span>/);
  for (const role of career) {
    const chapter = html.match(new RegExp(`<article[^>]+id="${role.slug}"[\\s\\S]*?<\\/article>`))?.[0];
    assert.ok(chapter, `${role.company} has an independent chapter`);
    assert.match(chapter, /class="resume-role-summary"/);
    assert.match(chapter, /class="resume-role-details"/);
    for (const fact of [role.company, role.role, role.dates, role.title, role.description, ...role.points, ...role.more, ...role.skills]) {
      const escaped = renderToStaticMarkup(React.createElement(React.Fragment, null, fact));
      assert.ok(chapter.includes(escaped), `${role.company} retains: ${fact}`);
    }
  }
});

test("decorative status and icons do not create extra accessible controls", () => {
  const html = render(EditorResume);
  const icons = html.match(/<svg\b[^>]*>/g) || [];
  assert.ok(icons.length > 0);
  for (const icon of icons) {
    assert.match(icon, /aria-hidden="true"/);
    assert.match(icon, /focusable="false"/);
  }
  assert.match(html, /<footer class="editor-status" aria-hidden="true"/);
});

test("full resume preview is inert and has no duplicate IDs or focus destinations", () => {
  const html = render(EditorResume, { preview: true });
  assert.match(html, /^<section class="editor-resume editor-resume-preview" inert="" aria-hidden="true">/);
  assert.doesNotMatch(html, /\sid="|\saria-labelledby="/);
  assert.equal((html.match(/<article\b/g) || []).length, career.length);
  for (const control of html.match(/<(?:a|summary)\b[^>]*>/g) || []) {
    assert.match(control, /tabindex="-1"/);
  }
  for (const destination of html.match(/<(?:section|article)\b[^>]*>/g) || []) {
    assert.doesNotMatch(destination, /tabindex=/);
  }
});

test("preview has exactly the same content and structural markup as the real opening CV", () => {
  const normalize = html => html
    .replace(/ (?:id|tabindex|aria-labelledby|inert|aria-hidden|aria-current)="[^"]*"/g, "")
    .replace("editor-resume editor-resume-preview", "editor-resume");
  assert.equal(normalize(render(EditorResume, { preview: true })), normalize(render(EditorResume)));
});

test("preview effect never touches the DOM or installs scroll, resize, or print handlers", () => {
  const effects = [];
  const require = createRequire(import.meta.url);
  const module = { exports: {} };
  runInNewContext(compiled, {
    module,
    exports: module.exports,
    require: name => name === "react" ? {
      ...require(name),
      useEffect: callback => effects.push(callback),
      useRef: () => ({ current: null }),
      useState: initial => [initial, () => {}],
    } : require(name),
  });
  module.exports.default({ preview: true });
  assert.equal(effects.length, 1);
  // No window, document, ResizeObserver, or mounted node exists in this context.
  assert.equal(effects[0](), undefined);
});
