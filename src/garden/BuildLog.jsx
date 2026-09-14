import { useEffect, useRef } from "react";
import { ArrowUpRight, Github, Linkedin, Plus, Printer } from "lucide-react";
import { career, expertise, profile } from "./portfolio-data";
import { printDisclosures } from "./journey-state";
import "./build-log.css";

export function EditorOpening({ preview = false }) {
  return <div className="build-opening">
    <p className="build-path"><strong>YANIV AKIVA</strong><span aria-hidden="true"> / </span>~/work</p>
    <h2 id={preview ? undefined : "experience-title"}>i build stuff sometimes<span className="build-cursor" aria-hidden="true" /></h2>
    <p className="build-intro">Currently building <a href="https://fidesa.ai" target="_blank" rel="noreferrer" tabIndex={preview ? -1 : undefined}>Fidesa<span className="sr-only"> (opens in new tab)</span></a>. Previously Sygnia, DOKKA, and IDF Intelligence.</p>
  </div>;
}
export default function BuildLog({ preview = false, selected = career[0].slug, onSelect = () => {} } = {}) {
  const root = useRef(null);
  useEffect(() => {
    if (preview) return;
    const print = printDisclosures(() => root.current.querySelectorAll("details"));
    window.addEventListener("beforeprint", print.before); window.addEventListener("afterprint", print.after);
    return () => { print.after(); window.removeEventListener("beforeprint", print.before); window.removeEventListener("afterprint", print.after); };
  }, [preview]);
  const active = career.some(role => role.slug === selected) ? selected : career[0].slug;
  const focus = preview ? -1 : undefined;
  return <section id={preview ? undefined : "experience"} className={`editor-resume build-log${preview ? " editor-resume-preview" : ""}`} ref={root} aria-labelledby={preview ? undefined : "experience-title"} tabIndex={preview ? undefined : -1} inert={preview ? "" : undefined} aria-hidden={preview || undefined}>
    <div className="build-container">
      <EditorOpening preview={preview} />
      <div className="build-sectionline"><span>EXPERIENCE</span><span>04 entries / latest first</span></div>
      <div className="build-index" role="group" aria-label="Choose an experience to read">
        <div className="build-index-head" aria-hidden="true"><span>#</span><span>COMPANY</span><span className="build-index-role">ROLE</span><span className="build-index-date">PERIOD</span><span /></div>
        {career.map(role => <button type="button" key={role.slug} className="build-index-row" aria-pressed={role.slug === active} aria-controls={preview ? undefined : role.slug} tabIndex={focus} onClick={() => onSelect(role.slug)}>
          <span className="build-index-number">{role.number}</span><span className="build-company">{role.company}</span><span className="build-index-role">{role.role}</span><span className="build-index-date">{role.dates}</span><span className="build-index-symbol" aria-hidden="true">{role.slug === active ? "−" : "+"}</span>
        </button>)}
      </div>
      <div className="build-panels">
        {career.map(role => <article className="build-role" id={preview ? undefined : role.slug} key={role.slug} hidden={role.slug !== active} aria-labelledby={preview ? undefined : `${role.slug}-title`} tabIndex={preview ? undefined : -1}>
          <div className="build-role-main">
            <p className="build-path">{role.slug}.log <span aria-hidden="true">/</span> {role.fullRole || role.role}</p>
            <h3 id={preview ? undefined : `${role.slug}-title`}>{role.title}</h3>
            <p className="build-print-role">{role.company} · {role.role} · {role.dates}</p>
            <p className="build-description">{role.description}</p>
            <ul className="build-achievements">{role.points.map(point => <li key={point}>{point}</li>)}</ul>
            <details className="build-details"><summary tabIndex={focus}><Plus size={16} aria-hidden="true" focusable="false" /> More implementation detail<span className="sr-only"> for {role.company}</span></summary><ul className="build-achievements">{role.more.map(point => <li key={point}>{point}</li>)}</ul></details>
          </div>
          <aside className="build-stack" aria-label={`${role.company} technologies and impact`}>
            <h4>UNDER THE HOOD</h4><dl>{role.stack.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
            <p className="build-proof">{role.proof}</p>
            {role.url && <a className="build-company-link" href={role.url} target="_blank" rel="noreferrer" tabIndex={focus}>{role.company} <ArrowUpRight size={16} aria-hidden="true" focusable="false" /><span className="sr-only"> (opens in new tab)</span></a>}
          </aside>
        </article>)}
      </div>
      <div className="build-section-end" aria-hidden="true"><span>yaniv@work:~ $</span><span>Python · Rust · systems that ship</span></div>
      <section id={preview ? undefined : "about"} className="build-about" aria-labelledby={preview ? undefined : "about-title"} tabIndex={preview ? undefined : -1}>
        <div className="build-sectionline"><span>ABOUT</span><span>about.md</span></div>
        <div className="build-about-grid"><div><p className="build-path">// the person behind the keyboard</p><h2 id={preview ? undefined : "about-title"}>hey, I’m Yaniv.</h2>
          <p>I’m a co-founder and hands-on engineer at Fidesa, based in Israel. I work across Python, Rust, distributed systems, and the infrastructure that gets AI models into production.</p>
          <p>Before Fidesa, I worked on security platforms at Sygnia, document intelligence at DOKKA, and led an engineering team in the IDF Intelligence Corps.</p>
          <div className="build-social"><a href="https://github.com/yanivakiva" target="_blank" rel="noreferrer" tabIndex={focus}><Github size={18} aria-hidden="true" focusable="false" /> GitHub<span className="sr-only"> (opens in new tab)</span></a><a href="https://www.linkedin.com/in/yanivakiva" target="_blank" rel="noreferrer" tabIndex={focus}><Linkedin size={18} aria-hidden="true" focusable="false" /> LinkedIn<span className="sr-only"> (opens in new tab)</span></a></div>
        </div><figure><img src={profile.portrait} width="1023" height="1091" loading="lazy" decoding="async" alt="Yaniv Akiva smiling, wearing a black shirt against a blue background." /><figcaption>YANIV AKIVA / Israel</figcaption></figure></div>
        <details className="build-expertise"><summary tabIndex={focus}><Plus size={16} aria-hidden="true" focusable="false" /> The technical toolbox</summary><dl>{expertise.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></details>
      </section>
      <section id={preview ? undefined : "contact"} className="build-contact" aria-labelledby={preview ? undefined : "contact-title"} tabIndex={preview ? undefined : -1}>
        <p className="build-path">~/contact.md</p><h2 id={preview ? undefined : "contact-title"}>got something interesting?</h2><a className="build-email" href={`mailto:${profile.email}`} tabIndex={focus}>{profile.email}<ArrowUpRight size={22} aria-hidden="true" focusable="false" /></a>
        <div className="build-contact-bottom"><a href="#home" tabIndex={focus}>← Back to the garden</a><button type="button" onClick={() => window.print()} tabIndex={focus}><Printer size={16} aria-hidden="true" focusable="false" /> Print this page</button></div>
      </section>
    </div>
  </section>;
}
