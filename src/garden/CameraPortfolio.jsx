import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Wind } from "lucide-react";
import CameraJourney from "./CameraJourney";
import EditorResume from "./BuildLog";
import { career, profile } from "./portfolio-data";
import { installAnchorNavigation } from "./anchor-navigation";
import { createJourneyScroll, restoreTourFocus } from "./scroll-controller";
import "lenis/dist/lenis.css";
import "./camera.css";

export default function CameraPortfolio() {
  const root = useRef(null);
  const playback = useRef(null), smoother = useRef(null);
  const tourControls = useRef(null), tourButton = useRef(null), experienceLink = useRef(null), previousTour = useRef(false);
  const [touring, setTouring] = useState(null);
  const [systemReduced, setSystemReduced] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [motionOff, setMotionOff] = useState(() => { try { return localStorage.getItem("garden.motion") === "off"; } catch { return false; } });
  const [inEditor, setInEditor] = useState(false);
  const [reading, setReading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(career[0].slug);
  const revealRole = useCallback(id => {
    if (career.some(role => role.slug === id)) flushSync(() => setSelectedRole(id));
  }, []);
  const enabled = !motionOff && !systemReduced;
  const updateTour = useCallback(state => {
    // Do not leave focus in a control subtree that is about to disappear.
    // Mouse/touch cancellation outside that subtree must not steal focus.
    if (!state) restoreTourFocus(tourControls.current, experienceLink.current, document.activeElement);
    setTouring(state);
  }, []);
  const progress = useCallback(() => {
    const intro = document.getElementById("home"), editor = document.getElementById("experience");
    if (!intro || !editor) return;
    const stage = intro.querySelector(".camera-stage");
    const p = intro.dataset.animated === "true" ? -intro.getBoundingClientRect().top / Math.max(1, intro.offsetHeight - stage.offsetHeight) : 0;
    const isAnimated = intro.dataset.animated === "true";
    setInEditor(p >= .94 || editor.getBoundingClientRect().top <= 90);
    setReading(!isAnimated || p >= .9999 || editor.getBoundingClientRect().top <= 1);
  }, []);
  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)"); const change = () => setSystemReduced(query.matches);
    query.addEventListener("change", change); return () => query.removeEventListener("change", change);
  }, []);
  useEffect(() => { try { localStorage.setItem("garden.motion", motionOff ? "off" : "on"); } catch { /* Storage may be unavailable. */ } }, [motionOff]);
  useEffect(() => {
    window.addEventListener("scroll", progress, { passive: true }); progress();
    return () => window.removeEventListener("scroll", progress);
  }, [progress, enabled]);
  useEffect(() => {
    smoother.current = enabled ? createJourneyScroll({ playback, onTour: updateTour }) : null;
    return () => { smoother.current?.destroy(); smoother.current = null; };
  }, [enabled, updateTour]);
  useEffect(() => {
    if (touring?.keyboard && !previousTour.current) tourButton.current?.focus({ preventScroll: true });
    previousTour.current = Boolean(touring);
  }, [touring]);
  useEffect(() => {
    const stopAnchors = installAnchorNavigation({
    browser: window,
    document,
    root: root.current,
    onResolveTarget: revealRole,
    // Hidden CV targets must become readable before navigation moves keyboard focus.
    onNavigate: () => flushSync(progress),
    scrollTo: options => {
      if (smoother.current) return smoother.current.navigate(options);
      window.scrollTo({ top: options.top, behavior: "instant" }); options.onComplete();
    },
    });
    return stopAnchors;
  }, [progress, revealRole]);
  return <div ref={root} className="camera-portfolio" data-motion={enabled ? "on" : "off"} data-reading={reading}>
    <a className="camera-skip" href="#experience">Skip to experience</a>
    <header className="camera-header" data-dark={inEditor}>
      <a className="camera-wordmark" href="#home" aria-label="Yaniv Akiva, back to the garden">YA<span>/</span></a>
      <nav aria-label="Main navigation"><a ref={experienceLink} href="#experience">Experience</a><a href="#about">About</a><a className="header-contact" href="#contact">Contact</a>
        <button type="button" className="camera-motion" disabled={systemReduced} aria-pressed={enabled} aria-label={`Motion ${enabled ? "on" : "off"}`} title={systemReduced ? "Following your system reduced-motion preference" : "Toggle camera motion"} onClick={() => { smoother.current?.cancel(); setMotionOff(value => !value); }}><Wind size={16} /><span>{enabled ? "Motion on" : "Motion off"}</span></button>
      </nav>
    </header>
    {touring && <div ref={tourControls} className="camera-tour-controls" role="group" aria-label="Garden tour controls"><span aria-hidden="true">{touring.paused ? "Tour paused" : "Through the garden"}</span><button ref={tourButton} type="button" aria-label={touring.paused ? "Resume garden tour" : "Pause garden tour"} onClick={() => touring.paused ? smoother.current?.resume() : smoother.current?.pause()}>{touring.paused ? "Resume" : "Pause"}</button><a href="#experience">Skip to CV <span aria-hidden="true">↗</span></a></div>}
    <div className="print-heading"><h1>YANIV AKIVA</h1><p>{profile.role} · {profile.email} · yanivakiva.com</p></div>
    <main><CameraJourney enabled={enabled} onProgress={progress} playback={playback} selectedRole={selectedRole} /><EditorResume selected={selectedRole} onSelect={setSelectedRole} /></main>
  </div>;
}
