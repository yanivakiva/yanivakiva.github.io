import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { clamp, coverRect, FrameCache } from "./camera-math";
import { cinematicFrame, portalGeometry, portalHandoff } from "./cinematic-math";
import { drawScreenSurface } from "./screen-surface";
import { createMediaScrubber } from "./media-scrubber";
import EditorResume from "./BuildLog";

const ASSETS = "/garden/cinematic";
const PORTRAIT_QUERY = "(max-aspect-ratio: 1/1)";
export default function CameraJourney({ enabled, onProgress, playback, selectedRole }) {
  const root = useRef(null), canvas = useRef(null), copy = useRef(null), indicator = useRef(null), arrival = useRef(null);
  const scene = useRef(null), portal = useRef(null), terminal = useRef(null), progress = useRef(0), previous = useRef(null);
  const companion = useRef(null), movie = useRef(null);
  const [variant, setVariant] = useState(() => matchMedia(PORTRAIT_QUERY).matches ? "portrait" : "wide");
  const [failed, setFailed] = useState(false), [posterFailed, setPosterFailed] = useState(false);
  const animated = enabled && !failed;
  useEffect(() => { if (enabled) setFailed(false); }, [enabled, variant]);
  useEffect(() => {
    const query = matchMedia(PORTRAIT_QUERY);
    const change = () => { setVariant(query.matches ? "portrait" : "wide"); setPosterFailed(false); };
    query.addEventListener("change", change);
    return () => query.removeEventListener("change", change);
  }, []);
  useLayoutEffect(() => {
    const span = animated ? root.current.offsetHeight - root.current.querySelector(".camera-stage").offsetHeight : root.current.offsetHeight;
    if (previous.current && previous.current.animated !== animated) {
      const y = window.scrollY, before = previous.current.span;
      if (y >= before) window.scrollTo({ top: Math.max(0, y + span - before), behavior: "instant" });
      else if (!animated && y > 0) window.scrollTo({ top: root.current.offsetHeight, behavior: "instant" });
    }
    previous.current = { animated, span };
    const resize = new ResizeObserver(() => {
      previous.current = { animated, span: animated ? root.current.offsetHeight - root.current.querySelector(".camera-stage").offsetHeight : root.current.offsetHeight };
    });
    resize.observe(root.current); onProgress();
    return () => resize.disconnect();
  }, [animated, onProgress]);
  useEffect(() => {
    if (!animated) {
      playback.current = null;
      Object.assign(copy.current.style, { opacity: "1", visibility: "visible", transform: "none" });
      scene.current.style.transform = "none"; portal.current.style.opacity = "0"; terminal.current.style.opacity = "0"; arrival.current.style.opacity = "0";
      indicator.current.style.opacity = "1";
      companion.current.style.opacity = "1"; companion.current.style.transform = "none";
      indicator.current.style.setProperty("--camera-progress", "0%");
      indicator.current.querySelector(".camera-chapter").textContent = "01 / THE GARDEN";
      onProgress(); return;
    }
    const node = root.current, stage = node.querySelector(".camera-stage");
    let metadata, cache, media, disposed = false, raf = 0, lastFrame = 0, lastBitmap, failures = 0;
    const controller = new AbortController();
    // React keeps this canvas across aspect-ratio changes. Reveal the new
    // variant's poster until a matching frame has actually decoded.
    canvas.current.style.opacity = "0";
    movie.current.style.opacity = "0";
    const video = movie.current;
    const context = canvas.current.getContext("2d", { alpha: false });
    if (!context) { setFailed(true); return; }
    const surface = terminal.current.getContext("2d");
    const screenImage = new Image(), texture = document.createElement("canvas"); let textureReady = false;
    // Rasterize once: repeatedly drawing an SVG under 192 affine transforms
    // otherwise asks Firefox to re-rasterize the entire document per triangle.
    texture.width = 2400; texture.height = 1500;
    screenImage.onload = () => { if (!disposed) {
      texture.getContext("2d").drawImage(screenImage, 0, 0, texture.width, texture.height);
      textureReady = true; overlays();
    } };
    screenImage.src = "/garden/terminal-screen.svg?v=stealth-20260915";
    playback.current = {
      get travel() { return node.offsetHeight - stage.offsetHeight; },
      ensurePosition(y) {
        if (!metadata || (!cache && !media)) return false;
        const p = clamp((y - (node.getBoundingClientRect().top + window.scrollY)) / Math.max(1, this.travel));
        if (p > metadata.filmEnd) return true; // The sharp final plate handles the approach.
        const index = cinematicFrame(p, metadata.count, metadata.filmEnd);
        request(index);
        return media ? media.ready(index) : cache.frames.has(index) || cache.failed.has(index);
      },
    };
    function request(index) { if (media) media.request(index); else cache?.request(index); }
    function overlays() {
      const p = progress.current;
      const atStart = p < .001;
      const visualProgress = atStart ? 0 : metadata && p < metadata.filmEnd ? lastFrame / (metadata.count - 1) * metadata.filmEnd : p;
      // Returning to the top must immediately restore the sharp opening plate,
      // even when a distant frame is still finishing a network seek/decode.
      if (media) video.style.opacity = !atStart && lastFrame > 0 ? "1" : "0";
      if (cache) canvas.current.style.opacity = !atStart && lastFrame > 0 ? "1" : "0";
      copy.current.style.opacity = String(1 - clamp(p / .12));
      copy.current.style.visibility = p >= .12 ? "hidden" : "visible";
      copy.current.style.transform = `translateY(${-Math.min(p, .12) * 160}px)`;
      // The foreground ledge passes below the camera before it is hidden.
      // Fading earlier would make the paper animal look ghostlike over the garden.
      companion.current.style.opacity = String(1 - clamp((visualProgress - .19) / .02));
      companion.current.style.transform = `translate3d(${-visualProgress * 240}px,${visualProgress * 1800}px,0) scale(${1 + visualProgress * .5})`;
      indicator.current.style.opacity = String(1 - clamp((p - .75) / .07));
      indicator.current.style.setProperty("--camera-progress", `${p * 100}%`);
      indicator.current.querySelector(".camera-chapter").textContent = p < .35 ? "01 / THE GARDEN" : p < .58 ? "02 / ACROSS THE BRIDGE" : p < .8 ? "03 / THE WORKSHOP" : "04 / INSIDE THE WORK";
      const filmEnd = metadata?.filmEnd ?? .8, inDisplay = p >= filmEnd;
      // A preloaded final plate prevents a stale garden frame when reversing from a deep link.
      const frame = atStart ? null : inDisplay ? metadata?.frames.at(-1) : metadata?.frames[lastFrame];
      arrival.current.style.opacity = inDisplay ? "1" : "0";
      const zoom = inDisplay ? clamp((p - filmEnd) / (1 - filmEnd)) : 0;
      const geometry = frame?.screen && portalGeometry(frame.screen, metadata.width, metadata.height, stage.clientWidth, stage.clientHeight, zoom);
      if (geometry) {
        scene.current.style.transform = `matrix(${geometry.scale},0,0,${geometry.scale},${geometry.x},${geometry.y})`;
        const handoff = portalHandoff(p);
        const opacity = clamp((visualProgress - .735) / .065) * handoff.terminal;
        terminal.current.style.opacity = String(textureReady ? opacity : 0);
        if (surface && textureReady && opacity > 0) {
          const ratio = Math.min(devicePixelRatio || 1, 2), w = stage.clientWidth, h = stage.clientHeight;
          if (terminal.current.width !== Math.round(w * ratio) || terminal.current.height !== Math.round(h * ratio)) {
            terminal.current.width = Math.round(w * ratio); terminal.current.height = Math.round(h * ratio);
          }
          surface.setTransform(ratio, 0, 0, ratio, 0, 0); surface.clearRect(0, 0, w, h);
          drawScreenSurface(surface, texture, geometry.points);
        }
        // The CV arrives at its native layout; portrait text is never stretched into a laptop.
        portal.current.style.opacity = String(handoff.document);
      } else {
        scene.current.style.transform = "none"; portal.current.style.opacity = "0"; terminal.current.style.opacity = "0";
      }
    }
    function paint(bitmap, index) {
      if (disposed) return;
      const w = stage.clientWidth, h = stage.clientHeight, ratio = Math.min(devicePixelRatio || 1, 2);
      if (canvas.current.width !== Math.round(w * ratio) || canvas.current.height !== Math.round(h * ratio)) {
        canvas.current.width = Math.round(w * ratio); canvas.current.height = Math.round(h * ratio);
      }
      const rect = coverRect(bitmap.width, bitmap.height, canvas.current.width, canvas.current.height);
      context.drawImage(bitmap, rect.x, rect.y, rect.width, rect.height);
      // Keep the dedicated Retina plate at rest; it shares the enhanced first frame.
      canvas.current.style.opacity = index === 0 ? "0" : "1";
      lastFrame = index; lastBitmap = bitmap; node.dataset.frame = String(index);
      if (index === cache?.target) failures = 0;
      overlays();
    }
    function update() {
      raf = 0;
      const rect = node.getBoundingClientRect(), travel = node.offsetHeight - stage.offsetHeight;
      progress.current = clamp(-rect.top / Math.max(1, travel));
      onProgress(); overlays();
      if (metadata && rect.bottom > 0 && rect.top < innerHeight) request(cinematicFrame(progress.current, metadata.count, metadata.filmEnd));
    }
    function schedule() { if (!raf) raf = requestAnimationFrame(update); }
    const observer = new ResizeObserver(() => { if (lastBitmap && cache?.frames.has(lastFrame)) paint(lastBitmap, lastFrame); schedule(); });
    observer.observe(stage);
    window.addEventListener("scroll", schedule, { passive: true }); window.addEventListener("resize", schedule);
    update();
    fetch(`${ASSETS}/${variant}/manifest.json`, { signal: controller.signal }).then(response => {
      if (!response.ok) throw new Error("Sequence unavailable"); return response.json();
    }).then(data => {
      if (disposed) return;
      if (data.count < 31 || data.frames.length !== data.count || !data.frames.at(-1).screen) throw new Error("Incomplete film");
      metadata = data;
      function fallback() {
        if (disposed || cache) return;
        media?.destroy(); media = null; video.style.opacity = "0";
        node.dataset.renderer = "frames";
        cache = new FrameCache({ count: data.count, paint, frameBytes: data.width * data.height * 4,
        budget: (variant === "portrait" ? 96 : 144) * 1024 * 1024,
        concurrency: variant === "portrait" ? 3 : 2,
        onError: (_, index) => {
          if (disposed || Math.abs(index - cache.target) > 2 || cache.frames.has(cache.target)) return;
          if (!lastBitmap || ++failures >= 3) setFailed(true);
        },
        load: async (index, signal, { onDecodeStart } = {}) => {
          const response = await fetch(`${ASSETS}/${variant}/${String(index).padStart(3, "0")}.${data.format || "webp"}`, { signal });
          if (!response.ok) throw new Error("Frame unavailable");
          const blob = await response.blob();
          if (onDecodeStart?.() === false) throw new DOMException("Stale frame", "AbortError");
          return createImageBitmap(blob);
        },
        });
        update();
      }
      if (video.canPlayType('video/webm; codecs="av01.0.12M.08"')) {
        node.dataset.renderer = "video";
        media = createMediaScrubber(video, { count: data.count, fps: data.fps,
          onFrame(index) {
            if (disposed) return;
            lastFrame = index; node.dataset.frame = String(index);
            video.style.opacity = index > 0 ? "1" : "0";
            overlays();
          }, onError: fallback });
        video.src = `${ASSETS}/motion-${variant}-v1.webm`;
        video.load();
      } else fallback();
      update();
    }).catch(error => { if (!disposed && error.name !== "AbortError") setFailed(true); });
    return () => { disposed = true; playback.current = null; screenImage.onload = null; controller.abort(); media?.destroy(); cache?.destroy(); observer.disconnect(); cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); };
  }, [animated, variant, onProgress, playback]);
  return <section className="camera-journey" id="home" ref={root} data-animated={animated} aria-label="A workshop above the clouds">
    <div className="camera-stage">
      <div className="camera-scene-layer" ref={scene} aria-hidden="true">
        <picture className="camera-poster">
          {!posterFailed && <source media={PORTRAIT_QUERY} srcSet={`${ASSETS}/hero-portrait.webp 940w, ${ASSETS}/hero-portrait-retina.webp 1880w`} sizes="100vw" />}
          <img src={posterFailed ? "/garden/arrival-scene.webp" : `${ASSETS}/hero-wide.webp`} srcSet={posterFailed ? undefined : `${ASSETS}/hero-wide.webp 1672w, ${ASSETS}/hero-wide-retina.webp 3344w`} sizes="100vw" alt="" width="1672" height="941" fetchpriority="high" onError={() => setPosterFailed(true)} />
        </picture>
        {animated && <><video ref={movie} className="camera-movie" muted playsInline preload="auto" disablePictureInPicture tabIndex={-1} /><canvas ref={canvas} className="camera-sequence" /></>}
        <img ref={arrival} className="camera-arrival-poster" src={`${ASSETS}/arrival-${variant}.webp`} alt="" fetchpriority="low" />
      </div>
      <div className="camera-companion" ref={companion} aria-hidden="true"><img src="/garden/companion-v2.webp" width="1254" height="1254" alt="" /></div>
      <div ref={copy} className="camera-introduction">
        <p className="camera-eyebrow"><span /> ENGINEER / CO-FOUNDER / ISRAEL</p>
        <h1 aria-label="YANIV AKIVA">YANIV<br /><span>AKIVA</span></h1>
        <p className="camera-description">i build stuff sometimes.</p>
        <a href="#experience" data-journey="true" className="camera-cta">Explore my work <ArrowUpRight size={19} aria-hidden="true" /></a>
      </div>
      <canvas className="camera-screen-code" ref={terminal} aria-hidden="true" />
      <div className="camera-portal-preview" ref={portal} aria-hidden="true"><EditorResume preview selected={selectedRole} /></div>
      <div className="camera-footer" ref={indicator} aria-hidden="true"><span className="camera-chapter">01 / THE GARDEN</span><span className="camera-scroll-label">{animated ? "SCROLL TO WANDER" : "A WORKSHOP ABOVE THE CLOUDS"} <ArrowDown size={14} /></span><div className="camera-progress"><span /></div></div>
    </div>
  </section>;
}
