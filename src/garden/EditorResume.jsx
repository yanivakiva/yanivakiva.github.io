import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, FileText, Github, Linkedin, Plus } from "lucide-react";
import { career } from "./portfolio-data";
import { printDisclosures } from "./journey-state";
import "./resume.css";

export function EditorOpening({ preview = false, activeSection = career[0].slug }) {
  const experienceActive = career.some(role => role.slug === activeSection);
  const aboutActive = activeSection === "about";
  return <>
    <nav className="editor-tabbar" aria-label="CV documents" aria-hidden={preview || undefined}>
      <a className={`editor-tab${experienceActive ? " active" : ""}`} href="#experience" aria-current={experienceActive && !preview ? "location" : undefined} tabIndex={preview ? -1 : undefined}><FileText size={15} aria-hidden="true" focusable="false" /> experience.md <span className="tab-dot" aria-hidden="true" /></a>
      <a className={`editor-tab secondary-tab${aboutActive ? " active" : ""}`} href="#about" aria-current={aboutActive && !preview ? "location" : undefined} tabIndex={preview ? -1 : undefined}>about.md</a>
      <span className="editor-tab-path" aria-hidden="true">~/yaniv <span>/</span> the work</span>
    </nav>
    <div className="editor-opening">
      <div className="resume-opening-title">
        <p className="editor-comment">THE WORK / 2018 — NOW</p>
        <h2 id={preview ? undefined : "experience-title"}>Selected <em>experience.</em></h2>
      </div>
      <div className="resume-intro-copy">
        <p className="editor-lead">Distributed systems.<br />Security infrastructure.<br /><span>Careful thinking, from the first line to production.</span></p>
        <div className="editor-file-meta"><span>Senior software engineer</span><span>Israel</span></div>
      </div>
    </div>
  </>;
}

export default function EditorResume({ preview = false } = {}) {
  const root = useRef(null);
  const [active, setActive] = useState("sygnia");
  useEffect(() => {
    // The laptop portal is a visual copy, not a second interactive document.
    if (preview) return;
    const node = root.current;
    const elements = [...node.querySelectorAll("[data-editor-section]")];
    let frame = 0;
    const update = () => {
      frame = 0; let current = "sygnia";
      elements.forEach(element => { if (element.getBoundingClientRect().top < window.innerHeight * .4) current = element.dataset.editorSection; });
      setActive(current);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const resize = new ResizeObserver(schedule); resize.observe(node);
    window.addEventListener("scroll", schedule, { passive: true }); window.addEventListener("resize", schedule); update();
    const print = printDisclosures(() => node.querySelectorAll("details"));
    window.addEventListener("beforeprint", print.before); window.addEventListener("afterprint", print.after);
    return () => { cancelAnimationFrame(frame); resize.disconnect(); print.after();
      window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule);
      window.removeEventListener("beforeprint", print.before); window.removeEventListener("afterprint", print.after); };
  }, [preview]);
  return <section id={preview ? undefined : "experience"} className={`editor-resume${preview ? " editor-resume-preview" : ""}`} ref={root} aria-labelledby={preview ? undefined : "experience-title"} tabIndex={preview ? undefined : -1} inert={preview ? "" : undefined} aria-hidden={preview || undefined}>
    <EditorOpening activeSection={active} preview={preview} />
    <div className="editor-workspace">
      <aside className="editor-sidebar" aria-label="CV navigation">
        <p>ON THIS PAGE</p>
        <nav aria-label="CV files and chapters">
          {career.map(role => <a href={`#${role.slug}`} key={role.slug} aria-current={active === role.slug ? "location" : undefined} tabIndex={preview ? -1 : undefined}><span aria-hidden="true">{role.number}</span>{role.company}</a>)}
          <a className="file-link" href="#about" aria-current={active === "about" ? "location" : undefined} tabIndex={preview ? -1 : undefined}>About</a>
          <a className="file-link" href="#contact" aria-current={active === "contact" ? "location" : undefined} tabIndex={preview ? -1 : undefined}>Contact</a>
        </nav>
        <p className="sidebar-note"><span aria-hidden="true">:read</span> Three chapters.<br />Always learning.</p>
      </aside>
      <div className="editor-document">
        {career.map(role => <article className="editor-role" id={preview ? undefined : role.slug} data-editor-section={role.slug} key={role.slug} aria-labelledby={preview ? undefined : `${role.slug}-title`} tabIndex={preview ? undefined : -1}>
          <div className="role-code-marker" aria-hidden="true"><span>{role.number}</span><span>EXPERIENCE</span></div>
          <div className="editor-role-heading"><h3 id={preview ? undefined : `${role.slug}-title`}>{role.url ? <a href={role.url} target="_blank" rel="noreferrer" tabIndex={preview ? -1 : undefined}>{role.company} <ArrowUpRight size={23} aria-hidden="true" focusable="false" /><span className="sr-only"> (opens in new tab)</span></a> : role.company}</h3><span className="editor-dates">{role.dates}</span></div>
          <p className="editor-position">{role.role}</p>
          <div className="resume-role-content">
            <div className="resume-role-summary"><h4>{role.title}</h4><p className="editor-description">{role.description}</p></div>
            <div className="resume-role-details">
              <ul className="editor-achievements">{role.points.map(point => <li key={point}>{point}</li>)}</ul>
              {role.more.length > 0 && <details className="editor-details"><summary tabIndex={preview ? -1 : undefined}><Plus size={17} aria-hidden="true" focusable="false" /> More implementation detail<span className="sr-only"> for {role.company}</span></summary><ul className="editor-achievements">{role.more.map(point => <li key={point}>{point}</li>)}</ul></details>}
              <ul className="editor-technologies" aria-label={`${role.company} technologies`}>{role.skills.map(skill => <li key={skill}>{skill}</li>)}</ul>
            </div>
          </div>
        </article>)}
        <section id={preview ? undefined : "about"} className="editor-about" data-editor-section="about" aria-labelledby={preview ? undefined : "about-title"} tabIndex={preview ? undefined : -1}>
          <p className="editor-comment">A LITTLE ABOUT ME</p><div className="editor-about-grid"><div><h2 id={preview ? undefined : "about-title"}>Curious,<br /><em>by nature.</em></h2>
            <p>I’m Yaniv, a software engineer based in Israel. I’m drawn to problems that need both careful thinking and a little imagination.</p>
            <p>My work spans distributed systems, backend services, and security infrastructure. Outside of it, you’ll often find me cooking, travelling, or getting out into nature.</p>
            <div className="editor-social"><a href="https://github.com/yanivakiva" target="_blank" rel="noreferrer" tabIndex={preview ? -1 : undefined}><Github size={17} aria-hidden="true" focusable="false" /> GitHub <span className="sr-only">(opens in new tab)</span></a><a href="https://www.linkedin.com/in/yanivakiva" target="_blank" rel="noreferrer" tabIndex={preview ? -1 : undefined}><Linkedin size={17} aria-hidden="true" focusable="false" /> LinkedIn <span className="sr-only">(opens in new tab)</span></a></div>
          </div><figure><img src="/garden/yaniv.webp" width="640" height="780" loading="lazy" alt="Yaniv by the turquoise sea on a trip." /><figcaption>Away from the keyboard.</figcaption></figure></div>
        </section>
        <section id={preview ? undefined : "contact"} className="editor-contact" data-editor-section="contact" aria-labelledby={preview ? undefined : "contact-title"} tabIndex={preview ? undefined : -1}>
          <p className="editor-comment">KEEP IN TOUCH</p><h2 id={preview ? undefined : "contact-title"}>Say <em>hello.</em></h2>
          <a href="mailto:contact@yanivakiva.com" tabIndex={preview ? -1 : undefined}>contact@yanivakiva.com <ArrowUpRight size={24} aria-hidden="true" focusable="false" /></a>
          <p>A conversation starts here.</p>
          <a className="return-garden" href="#home" tabIndex={preview ? -1 : undefined}>← Back to the garden</a>
        </section>
      </div>
    </div>
    <footer className="editor-status" aria-hidden="true"><span className="vim-mode">NORMAL</span><span>⌁ main</span><span className="status-file">{active === "about" || active === "contact" ? active : "experience"}.md</span><span className="status-right">UTF-8 <span>·</span> Yaniv Akiva</span></footer>
  </section>;
}
