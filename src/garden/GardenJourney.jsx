import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "framer-motion";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { readingScrollAfterResize, scenePhase } from "./journey-state";

export function SceneImage({
  scene,
  className = "",
  priority = false,
  lazy = false,
  onLoad,
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <img
      className={className}
      src={`/garden/${scene}-scene.webp`}
      srcSet={`/garden/${scene}-scene-small.webp 960w, /garden/${scene}-scene.webp 1672w`}
      sizes="100vw"
      width="1672"
      height="941"
      alt=""
      aria-hidden="true"
      decoding={priority ? "sync" : "async"}
      fetchPriority={priority ? "high" : "auto"}
      loading={lazy ? "lazy" : "eager"}
      onLoad={onLoad}
      onError={() => setFailed(true)}
    />
  );
}

const chapterViews = ["workshop", "bridge", "arrival"];
const chapterNames = ["The workshop", "The bridge", "The garden"];

/** One sticky environment; all professional content remains in normal flow. */
export default function GardenJourney({ motionEnabled, children }) {
  const intro = useRef(null);
  const previousLayout = useRef(null);
  const [activeRole, setActiveRole] = useState(0);
  const [phase, setPhase] = useState(0);
  const [loadScenes, setLoadScenes] = useState(false);
  const [ready, setReady] = useState({ bridge: false, workshop: false });
  const { scrollYProgress } = useScroll({
    target: intro,
    offset: motionEnabled
      ? ["start start", "end end"]
      : ["start start", "end start"],
  });

  // Compact the static version, keeping already-visible career/about text in place.
  useLayoutEffect(() => {
    const height = intro.current.offsetHeight;
    const previous = previousLayout.current;
    if (previous && previous.enabled !== motionEnabled) {
      const y = window.scrollY;
      const nextY = readingScrollAfterResize(y, previous.height, height);
      if (nextY !== y) window.scrollTo({ top: nextY, behavior: "instant" });
    }
    previousLayout.current = { height, enabled: motionEnabled };
    const observer = new ResizeObserver(() => {
      previousLayout.current = {
        height: intro.current.offsetHeight,
        enabled: motionEnabled,
      };
    });
    observer.observe(intro.current);
    return () => observer.disconnect();
  }, [motionEnabled]);

  // Include career deep links: the intro itself may already be far above view.
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLoadScenes(true);
          observer.disconnect();
        }
      },
      { rootMargin: "600px" },
    );
    observer.observe(intro.current.parentElement);
    return () => observer.disconnect();
  }, []);

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    setPhase(scenePhase(progress, motionEnabled));
  });

  const arrivalScale = useTransform(scrollYProgress, [0, 0.66], [1, 1.17]);
  const arrivalX = useTransform(scrollYProgress, [0, 0.66], ["0%", "-4%"]);
  const bridgeOpacity = useTransform(scrollYProgress, [0.52, 0.65], [0, 1]);
  const bridgeScale = useTransform(scrollYProgress, [0.52, 0.9], [1, 1.14]);
  const workshopOpacity = useTransform(scrollYProgress, [0.86, 0.98], [0, 1]);
  const workshopScale = useTransform(scrollYProgress, [0.86, 1], [1.06, 1]);
  const mistOpacity = useTransform(
    scrollYProgress,
    [0, 0.59, 0.7, 0.92, 1],
    [0, 0.12, 0, 0.1, 0],
  );

  return (
    <div
      className="garden-journey"
      id="home"
      data-phase={phase}
      data-static={!motionEnabled}
    >
      <div className="journey-stage" aria-hidden="true">
        <motion.div
          className="scene-plane scene-arrival"
          style={{
            scale: motionEnabled ? arrivalScale : 1,
            x: motionEnabled ? arrivalX : 0,
          }}
        >
          <SceneImage scene="arrival" priority />
        </motion.div>
        {loadScenes && (
          <>
            <motion.div
              className="scene-plane scene-bridge"
              style={{
                opacity: ready.bridge
                  ? motionEnabled
                    ? bridgeOpacity
                    : phase > 0
                      ? 1
                      : 0
                  : 0,
                scale: motionEnabled ? bridgeScale : 1,
              }}
            >
              <SceneImage
                scene="bridge"
                onLoad={() => setReady((value) => ({ ...value, bridge: true }))}
              />
            </motion.div>
            <motion.div
              className="scene-plane scene-workshop"
              style={{
                opacity: ready.workshop
                  ? motionEnabled
                    ? workshopOpacity
                    : phase === 2
                      ? 1
                      : 0
                  : 0,
                scale: motionEnabled ? workshopScale : 1,
              }}
            >
              <SceneImage
                scene="workshop"
                onLoad={() =>
                  setReady((value) => ({ ...value, workshop: true }))
                }
              />
            </motion.div>
          </>
        )}
        {chapterViews.slice(1).map((scene, index) => (
          <div
            key={scene}
            className="scene-plane chapter-backdrop"
            data-active={
              phase === 2 &&
              activeRole === index + 1 &&
              (scene === "arrival" || ready[scene])
            }
          >
            {loadScenes && <SceneImage scene={scene} />}
          </div>
        ))}
        <motion.div
          className="scene-mist"
          style={{ opacity: motionEnabled ? mistOpacity : 0 }}
        />
        <div className="scene-caption" data-visible={phase === 2}>
          <span className="scene-caption-rule" />
          <span>{chapterNames[activeRole]}</span>
          <span className="scene-caption-note">A little room to think.</span>
        </div>
      </div>

      <div className="journey-intro" ref={intro}>
        <section className="journey-hero" aria-labelledby="hero-title">
          <div className="mobile-arrival" aria-hidden="true">
            <SceneImage scene="arrival" />
          </div>
          <div className="arrival-wash" aria-hidden="true" />
          <div className="journey-copy">
            <p className="eyebrow">SOFTWARE ENGINEER · ISRAEL</p>
            <h1 id="hero-title">
              Yaniv
              <br />
              Akiva<span>.</span>
            </h1>
            <p className="journey-role">
              Senior software engineer.
              <br />
              <em>Curious by nature.</em>
            </p>
            <p className="journey-description">
              I build distributed systems
              <br />
              and security infrastructure.
            </p>
            <a className="garden-button" href="mailto:contact@yanivakiva.com">
              Say hello <ArrowUpRight size={19} aria-hidden="true" />
            </a>
          </div>
          <div className="journey-bottom">
            <span className="journey-location">
              <span /> A WORKSHOP ABOVE THE CLOUDS
            </span>
            <a href="#experience" className="follow-path">
              Explore my work <ArrowDown size={18} aria-hidden="true" />
            </a>
          </div>
        </section>
        <div className="journey-passage" aria-hidden="true">
          <p>
            <span>The path to</span>
            <br />
            <em>what I do.</em>
          </p>
        </div>
      </div>
      {children(setActiveRole, activeRole)}
    </div>
  );
}
