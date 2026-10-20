import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Wind } from "lucide-react";
import CameraJourney from "./CameraJourney";
import EditorResume from "./BuildLog";
import { career, profile } from "./portfolio-data";
import { installAnchorNavigation } from "./anchor-navigation";
import { createJourneyScroll, restoreTourFocus } from "./scroll-controller";
import { lockJourneyOpening } from "./journey-lock";
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
  const [opening, setOpening] = useState({ status: "loading", progress: 0 });
  const [journeyComplete, setJourneyComplete] = useState(false);
  const tourFocus = useRef(false);
  const ready = opening.status === "ready";
  const blocked = !ready && !journeyComplete;
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
    const p = -intro.getBoundingClientRect().top / Math.max(1, intro.offsetHeight - stage.offsetHeight);
    if (intro.dataset.opening === "ready" && intro.dataset.arrived === "true") setJourneyComplete(true);
    setInEditor(p >= .94 || editor.getBoundingClientRect().top <= 90);
    setReading(p >= .9999 || editor.getBoundingClientRect().top <= 1);
  }, []);
  useLayoutEffect(() => {
    if (!blocked) return;
    return lockJourneyOpening();
  }, [blocked]);
  const explore = useCallback(event => {
    if (!ready) return;
    tourFocus.current = event.currentTarget?.matches?.(":focus-visible") || false;
    const target = document.getElementById("experience");
    const top = target.getBoundingClientRect().top + window.scrollY;
    if (!enabled) {
      // Step through the same distance without animated scrolling.
      window.scrollTo({ top: Math.min(top, window.scrollY + playback.current.travel / 4), behavior: "instant" });
    } else smoother.current?.navigate({ top, target, link: event.currentTarget, immediate: false,
      onComplete: () => { flushSync(progress); } });
  }, [ready, enabled, progress]);
  useEffect(() => {
    if (journeyComplete && tourFocus.current) {
      document.getElementById("experience")?.focus({ preventScroll: true });
      tourFocus.current = false;
    }
  }, [journeyComplete]);
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
    smoother.current = enabled && !blocked ? createJourneyScroll({ playback, onTour: updateTour }) : null;
    return () => { smoother.current?.destroy(); smoother.current = null; };
  }, [enabled, blocked, updateTour]);
  useEffect(() => {
    if (journeyComplete || !ready) return;
    const bound = () => {
      const travel = playback.current?.travel;
      if (travel && window.scrollY > travel + 1) {
        smoother.current?.cancel(); window.scrollTo({ top: travel, behavior: "instant" });
      }
    };
    const key = event => {
      if (event.key !== "End" && !(event.metaKey && event.key === "ArrowDown")) return;
      event.preventDefault();
      explore({ currentTarget: experienceLink.current });
    };
    window.addEventListener("scroll", bound, { passive: true });
    window.addEventListener("keydown", key);
    return () => { window.removeEventListener("scroll", bound); window.removeEventListener("keydown", key); };
  }, [journeyComplete, ready, explore]);
  useEffect(() => {
    if (touring?.keyboard && !previousTour.current) tourButton.current?.focus({ preventScroll: true });
    previousTour.current = Boolean(touring);
  }, [touring]);
  useEffect(() => {
    const stopAnchors = installAnchorNavigation({
    browser: window,
    document,
    root: root.current,
    canNavigate: id => !blocked && (journeyComplete || id === "home"),
    onBlockedNavigation: () => {
      smoother.current?.cancel(); window.scrollTo({ top: 0, behavior: "instant" });
    },
    onResolveTarget: revealRole,
    // Hidden CV targets must become readable before navigation moves keyboard focus.
    onNavigate: () => flushSync(progress),
    scrollTo: options => {
      if (smoother.current) return smoother.current.navigate(options);
      window.scrollTo({ top: options.top, behavior: "instant" }); options.onComplete();
    },
    });
    return stopAnchors;
  }, [progress, revealRole, blocked, journeyComplete]);
  return <div ref={root} className="camera-portfolio" data-motion={enabled ? "on" : "off"} data-reading={journeyComplete && reading} data-journey-complete={journeyComplete} data-loading={blocked}>
    {journeyComplete ? <a className="camera-skip" href="#experience">Skip to experience</a> : <button className="camera-skip" disabled={!ready} data-journey="true" onClick={explore}>{enabled ? "Start garden tour" : "Continue through garden"}</button>}
    <header className="camera-header" data-dark={inEditor}>
      <a className="camera-wordmark" href="#home" aria-label="Yaniv Akiva, back to the garden">YA<span>/</span></a>
      <nav aria-label="Main navigation">{journeyComplete ? <a ref={experienceLink} href="#experience">Experience</a> : <button ref={experienceLink} type="button" disabled={!ready} data-journey="true" onClick={explore} title="Travel through the garden to my work">{enabled ? "Experience" : "Continue"}</button>}<a href="#about" aria-disabled={!journeyComplete || undefined} title={!journeyComplete ? "Available after the garden journey" : undefined}>About</a><a className="header-contact" href="#contact" aria-disabled={!journeyComplete || undefined} title={!journeyComplete ? "Available after the garden journey" : undefined}>Contact</a>
        {journeyComplete && <button type="button" className="camera-motion" disabled={systemReduced} aria-pressed={enabled} aria-label={`Motion ${enabled ? "on" : "off"}`} title={systemReduced ? "Following your system reduced-motion preference" : "Toggle camera motion"} onClick={() => { smoother.current?.cancel(); setMotionOff(value => !value); }}><Wind size={16} /><span>{enabled ? "Motion on" : "Motion off"}</span></button>}
      </nav>
    </header>
    {touring && <div ref={tourControls} className="camera-tour-controls" role="group" aria-label="Garden tour controls"><span aria-hidden="true">{touring.paused ? "Tour paused" : "Through the garden"}</span><button ref={tourButton} type="button" aria-label={touring.paused ? "Resume garden tour" : "Pause garden tour"} onClick={() => touring.paused ? smoother.current?.resume() : smoother.current?.pause()}>{touring.paused ? "Resume" : "Pause"}</button></div>}
    <div className="print-heading"><h1>YANIV AKIVA</h1><p>{profile.role} · {profile.email} · yanivakiva.com</p></div>
    <main><CameraJourney enabled={enabled} onProgress={progress} onOpening={setOpening} onExplore={explore} playback={playback} selectedRole={selectedRole} />{journeyComplete ? <EditorResume selected={selectedRole} onSelect={setSelectedRole} /> : <section id="experience" className="editor-resume camera-cv-pending" inert="" aria-hidden="true" />}</main>
  </div>;
}
