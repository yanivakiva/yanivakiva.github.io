import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { buildSync } from "esbuild";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { career, expertise, profile } from "./portfolio-data.js";

const compiled=buildSync({entryPoints:[fileURLToPath(new URL("./BuildLog.jsx",import.meta.url))],bundle:true,write:false,platform:"node",format:"cjs",jsx:"automatic",packages:"external",loader:{".css":"empty"},logLevel:"silent"}).outputFiles[0].text;
const loaded={exports:{}};
runInNewContext(compiled,{module:loaded,exports:loaded.exports,require:createRequire(import.meta.url)});
const render=props=>renderToStaticMarkup(React.createElement(loaded.exports.default,props));
const escape=value=>renderToStaticMarkup(React.createElement(React.Fragment,null,value));

test("approved build log opens the stealth company and offers all four real roles",()=>{
  const html=render();
  assert.ok(html.includes('i build stuff sometimes'));
  assert.equal((html.match(/class="build-index-row"/g)||[]).length,4);
  assert.equal((html.match(/aria-pressed="true"/g)||[]).length,1);
  assert.match(html,/<article class="build-role" id="stealth" aria-labelledby="stealth-title" tabindex="-1">/);
  assert.doesNotMatch(html,/Selected <em>experience|3 petabytes|approximately 30%/);
  assert.ok(html.includes("more than 5 PB"));
});
test("the stealth name is genuinely removed, not visually hidden over identifying text",()=>{
  assert.equal(career[0].company,"Stealth Labs");
  assert.equal(career[0].redacted,true);
  assert.equal(Object.hasOwn(career[0],"url"),false);
  const metadata=readFileSync(new URL("../../index.html",import.meta.url),"utf8");
  const terminal=readFileSync(new URL("../../public/garden/terminal-screen.svg",import.meta.url),"utf8");
  assert.match(terminal,/aria-label="Stealth Labs"/);
  for(const preview of [false,true]) {
    const html=render({preview});
    assert.match(html,/<span class="build-redaction" aria-hidden="true"><\/span><span class="sr-only">Stealth<\/span> Labs/);
    assert.doesNotMatch(html+compiled+metadata+terminal+JSON.stringify({profile,career}),/fidesa/i);
    assert.match(html,/stealth\.log/);
  }
});
test("each selection exposes only its panel, with matching controls and accessible headings",()=>{
  for(const selected of career.map(role=>role.slug)) {
    const html=render({selected});
    for(const role of career) {
      const tag=html.match(new RegExp('<article[^>]+id="'+role.slug+'"[^>]*>'))?.[0];
      assert.ok(tag);
      assert.equal(tag.includes('hidden=""'),role.slug!==selected);
      assert.ok(html.includes('aria-controls="'+role.slug+'"'));
      assert.ok(html.includes('<h3 id="'+role.slug+'-title">'));
    }
  }
});
test("the new CV keeps every updated description, point, date and outcome qualifier",()=>{
  const html=render();
  for(const role of career) for(const fact of [role.company,role.role,role.dates,role.title,role.description,role.proof,...role.points,...role.more,...role.stack.flat()]) assert.ok(html.includes(escape(fact)),fact);
  for(const row of expertise) for(const fact of row) assert.ok(html.includes(escape(fact)));
  assert.match(html,/approximately 30× lower compute requirements and comparable or better task quality/);
  assert.match(html,/Our platform autonomously turns customer requirements into purpose-built AI models/);
});
test("the supplied portrait is a real local asset",()=>{
  const html=render();
  assert.ok(html.includes('src="'+profile.portrait+'" width="1023" height="1091"'));
  assert.ok(html.includes('mailto:'+profile.email));
  assert.ok(readFileSync(new URL('../../public'+profile.portrait,import.meta.url)).length>10000);
});
test("the private source PDF is not published and contact uses only the approved address",()=>{
  const html=render();
  assert.equal(profile.email,"contact@yanivakiva.com");
  assert.equal(Object.hasOwn(profile,"cv"),false);
  assert.deepEqual([...new Set(html.match(/mailto:[^"\s]+/g))],["mailto:contact@yanivakiva.com"]);
  assert.doesNotMatch(html,/href="[^"]*\.pdf|href="tel:/);
  for(const directory of ["public","dist"]) assert.equal(existsSync(new URL('../../'+directory+'/garden/yaniv-akiva-cv.pdf',import.meta.url)),false);
});
test("DOKKA and IDF reflect the latest source wording, not superseded claims",()=>{
  const dokka=career.find(role=>role.slug==="dokka"), idf=career.find(role=>role.slug==="idf");
  assert.match(dokka.points.join(" "),/queue-based processing and autoscaling workers/);
  assert.doesNotMatch(JSON.stringify(dokka),/KEDA|RabbitMQ|API and worker/);
  assert.match(idf.points.join(" "),/architecture and engineering of two mission-critical intelligence systems/);
  assert.doesNotMatch(JSON.stringify(idf),/principal architect|remained in service/);
});
test("customer delivery remains anonymous and the requested toolbox row is omitted",()=>{
  const html=render();
  assert.ok(html.includes("Led customer discovery and pilot delivery, turning requirements into model specifications and evaluation plans."));
  assert.doesNotMatch(html,/Reco AI|ML infrastructure|ONNX|inference benchmarking|model monitoring/);
  assert.equal(expertise.length,4);
});
test("the portal preview is inert, unlabelled by duplicate IDs, and outside the tab order",()=>{
  const html=render({preview:true});
  assert.match(html,/inert="" aria-hidden="true"/);
  assert.doesNotMatch(html,/\sid="|\saria-labelledby="|\saria-controls="/);
  for(const tag of html.match(/<(?:a|button|summary)\b[^>]*>/g)||[]) assert.match(tag,/tabindex="-1"/);
});
test("preview and live CV share the exact selected content and structure",()=>{
  const normalize=html=>html.replace(/ (?:id|tabindex|aria-labelledby|aria-controls|inert|aria-hidden)="[^"]*"/g,"").replace(' editor-resume-preview','');
  for(const selected of career.map(role=>role.slug)) assert.equal(normalize(render({preview:true,selected})),normalize(render({selected})));
});
